use crate::model::{
    validate_config, AppConfig, AppEntry, Category, ImportPreview, Settings, CURRENT_SCHEMA_VERSION,
};
use serde_json::{Map, Value};
use std::collections::{HashMap, HashSet};
use uuid::Uuid;

const LEGACY_TIMESTAMP: &str = "1970-01-01T00:00:00Z";

pub fn migrate_value(value: Value) -> Result<ImportPreview, String> {
    validate_json_depth(&value, 0)?;

    if let Some(version) = value.get("schemaVersion").and_then(Value::as_u64) {
        if version != CURRENT_SCHEMA_VERSION as u64 {
            return Err(format!(
                "不支持 schemaVersion {version}，当前仅支持 {CURRENT_SCHEMA_VERSION}"
            ));
        }
        let config: AppConfig =
            serde_json::from_value(value).map_err(|error| format!("当前配置格式无效：{error}"))?;
        validate_config(&config)?;
        return Ok(ImportPreview {
            app_count: config.apps.len(),
            category_count: config.categories.len(),
            config,
            source_format: "AnyApp schema v1".into(),
            warnings: Vec::new(),
        });
    }

    let (apps_value, categories_value, source_format) = match value {
        Value::Array(apps) => (Value::Array(apps), Value::Null, "旧数组格式"),
        Value::Object(mut object) => {
            let apps = take_first(
                &mut object,
                &["apps", "software", "softwares", "softwareList"],
            )
            .unwrap_or_else(|| Value::Array(Vec::new()));
            let categories =
                take_first(&mut object, &["categories", "categoryList"]).unwrap_or(Value::Null);
            (apps, categories, "旧对象格式")
        }
        _ => return Err("导入文件必须是 JSON 数组或对象".into()),
    };

    let app_values = apps_value
        .as_array()
        .ok_or_else(|| "旧配置的软件列表不是数组".to_string())?;
    let mut warnings = Vec::new();
    let mut categories = parse_categories(&categories_value, &mut warnings);
    let mut category_by_name: HashMap<String, String> = categories
        .iter()
        .map(|category| (category.name.trim().to_lowercase(), category.id.clone()))
        .collect();
    let known_category_ids: HashSet<String> =
        categories.iter().map(|item| item.id.clone()).collect();
    let mut seen_paths = HashSet::new();
    let mut apps = Vec::new();

    for (index, value) in app_values.iter().enumerate() {
        let Some(object) = value.as_object() else {
            warnings.push(format!("第 {} 条记录不是对象，已跳过", index + 1));
            continue;
        };
        let path = string_field(object, &["path", "exePath", "target"]);
        if path.trim().is_empty() {
            warnings.push(format!("第 {} 条记录缺少路径，已跳过", index + 1));
            continue;
        }
        let normalized_path = path.replace('/', "\\").to_lowercase();
        if !seen_paths.insert(normalized_path) {
            warnings.push(format!("路径“{path}”重复，已保留第一条"));
            continue;
        }
        let name = non_empty_or(
            string_field(object, &["name", "title", "productName"]),
            fallback_name(&path),
        );
        let category_hint = string_field(object, &["categoryId", "category", "group"]);
        let category_id = if category_hint.is_empty() {
            None
        } else if known_category_ids.contains(&category_hint) {
            Some(category_hint)
        } else {
            let key = category_hint.trim().to_lowercase();
            let id = category_by_name.entry(key).or_insert_with(|| {
                let id = stable_id("category", &category_hint);
                categories.push(Category {
                    id: id.clone(),
                    name: category_hint.trim().to_string(),
                    color: "slate".into(),
                });
                id
            });
            Some(id.clone())
        };
        if object.contains_key("crackUrl") {
            warnings.push(format!("“{name}”的旧 crackUrl 字段已移除，不会写入新配置"));
        }
        let website = optional_string_field(object, &["website", "homepage", "url"]);
        let tags = tags_field(object.get("tags"));
        let favorite = bool_field(object, &["favorite", "isFavorite", "starred"]);
        let description = string_field(object, &["description", "desc", "fileDescription"]);
        let id_hint = string_field(object, &["id"]);
        let id = if id_hint.trim().is_empty() {
            stable_id("app", &format!("{name}\n{path}"))
        } else {
            id_hint
        };

        apps.push(AppEntry {
            id,
            name,
            path,
            category_id,
            description,
            tags,
            favorite,
            website,
            icon_key: None,
            created_at: string_or_default(object, "createdAt", LEGACY_TIMESTAMP),
            updated_at: string_or_default(object, "updatedAt", LEGACY_TIMESTAMP),
            last_launched_at: optional_string_field(object, &["lastLaunchedAt", "lastOpenedAt"]),
            launch_count: object
                .get("launchCount")
                .and_then(Value::as_u64)
                .unwrap_or_default(),
        });
    }

    if categories.is_empty() {
        categories.push(Category {
            id: "category-general".into(),
            name: "常用".into(),
            color: "cobalt".into(),
        });
    }

    let config = AppConfig {
        schema_version: CURRENT_SCHEMA_VERSION,
        revision: 0,
        categories,
        apps,
        settings: Settings::default(),
    };
    validate_config(&config)?;
    Ok(ImportPreview {
        app_count: config.apps.len(),
        category_count: config.categories.len(),
        config,
        source_format: source_format.into(),
        warnings,
    })
}

fn parse_categories(value: &Value, warnings: &mut Vec<String>) -> Vec<Category> {
    let Some(items) = value.as_array() else {
        return Vec::new();
    };
    let mut seen = HashSet::new();
    let mut categories = Vec::new();
    for item in items {
        let (id, name, color) = match item {
            Value::String(name) => (stable_id("category", name), name.clone(), "slate".into()),
            Value::Object(object) => {
                let name = string_field(object, &["name", "title", "label"]);
                if name.trim().is_empty() {
                    warnings.push("发现缺少名称的旧分类，已跳过".into());
                    continue;
                }
                let id = non_empty_or(
                    string_field(object, &["id", "value"]),
                    stable_id("category", &name),
                );
                let color = non_empty_or(string_field(object, &["color"]), "slate".into());
                (id, name, color)
            }
            _ => continue,
        };
        if seen.insert(id.clone()) {
            categories.push(Category { id, name, color });
        }
    }
    categories
}

fn take_first(object: &mut Map<String, Value>, keys: &[&str]) -> Option<Value> {
    keys.iter().find_map(|key| object.remove(*key))
}

fn string_field(object: &Map<String, Value>, keys: &[&str]) -> String {
    keys.iter()
        .find_map(|key| object.get(*key))
        .and_then(|value| match value {
            Value::String(value) => Some(value.clone()),
            Value::Number(value) => Some(value.to_string()),
            _ => None,
        })
        .unwrap_or_default()
}

fn optional_string_field(object: &Map<String, Value>, keys: &[&str]) -> Option<String> {
    let value = string_field(object, keys);
    (!value.trim().is_empty()).then_some(value)
}

fn bool_field(object: &Map<String, Value>, keys: &[&str]) -> bool {
    keys.iter()
        .find_map(|key| object.get(*key))
        .and_then(Value::as_bool)
        .unwrap_or(false)
}

fn tags_field(value: Option<&Value>) -> Vec<String> {
    match value {
        Some(Value::Array(values)) => values
            .iter()
            .filter_map(Value::as_str)
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(ToOwned::to_owned)
            .collect(),
        Some(Value::String(value)) => value
            .split([',', '，'])
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(ToOwned::to_owned)
            .collect(),
        _ => Vec::new(),
    }
}

fn string_or_default(object: &Map<String, Value>, key: &str, default: &str) -> String {
    object
        .get(key)
        .and_then(Value::as_str)
        .filter(|value| !value.trim().is_empty())
        .unwrap_or(default)
        .to_string()
}

fn fallback_name(path: &str) -> String {
    std::path::Path::new(path)
        .file_stem()
        .and_then(|value| value.to_str())
        .filter(|value| !value.is_empty())
        .unwrap_or("未命名软件")
        .to_string()
}

fn non_empty_or(value: String, fallback: String) -> String {
    if value.trim().is_empty() {
        fallback
    } else {
        value
    }
}

fn stable_id(kind: &str, seed: &str) -> String {
    format!(
        "{kind}-{}",
        Uuid::new_v5(&Uuid::NAMESPACE_URL, seed.trim().to_lowercase().as_bytes())
    )
}

fn validate_json_depth(value: &Value, depth: usize) -> Result<(), String> {
    if depth > 32 {
        return Err("JSON 嵌套层级超过 32".into());
    }
    match value {
        Value::Array(values) => {
            for value in values {
                validate_json_depth(value, depth + 1)?;
            }
        }
        Value::Object(values) => {
            for value in values.values() {
                validate_json_depth(value, depth + 1)?;
            }
        }
        _ => {}
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn migrates_legacy_array_deterministically() {
        let value = serde_json::json!([{
            "name": "<img src=x onerror=alert(1)>",
            "path": "C:/Apps/demo.exe",
            "category": "工具",
            "crackUrl": "javascript:alert(1)"
        }]);
        let first = migrate_value(value.clone()).unwrap();
        let second = migrate_value(value).unwrap();
        assert_eq!(first.config, second.config);
        assert_eq!(first.config.apps[0].name, "<img src=x onerror=alert(1)>");
        let serialized = serde_json::to_string(&first.config).unwrap();
        assert!(!serialized.contains("crackUrl"));
        assert!(first
            .warnings
            .iter()
            .any(|warning| warning.contains("crackUrl")));
    }

    #[test]
    fn rejects_unknown_schema() {
        let value = serde_json::json!({"schemaVersion": 99});
        assert!(migrate_value(value).is_err());
    }
}
