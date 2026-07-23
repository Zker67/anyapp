use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::path::{Component, Path, PathBuf};
use url::Url;

pub const CURRENT_SCHEMA_VERSION: u32 = 1;
pub const MAX_APPS: usize = 2_000;
pub const MAX_CATEGORIES: usize = 200;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub schema_version: u32,
    #[serde(default)]
    pub revision: u64,
    #[serde(default)]
    pub categories: Vec<Category>,
    #[serde(default)]
    pub apps: Vec<AppEntry>,
    #[serde(default)]
    pub settings: Settings,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            schema_version: CURRENT_SCHEMA_VERSION,
            revision: 0,
            categories: vec![Category {
                id: "category-general".into(),
                name: "常用".into(),
                color: "cobalt".into(),
            }],
            apps: Vec::new(),
            settings: Settings::default(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Category {
    pub id: String,
    pub name: String,
    #[serde(default = "default_category_color")]
    pub color: String,
}

fn default_category_color() -> String {
    "slate".into()
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AppEntry {
    pub id: String,
    pub name: String,
    pub path: String,
    #[serde(default)]
    pub category_id: Option<String>,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub favorite: bool,
    #[serde(default)]
    pub website: Option<String>,
    #[serde(default)]
    pub icon_key: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default)]
    pub last_launched_at: Option<String>,
    #[serde(default)]
    pub launch_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    #[serde(default)]
    pub after_launch: AfterLaunch,
    #[serde(default)]
    pub compact_view: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            after_launch: AfterLaunch::Keep,
            compact_view: false,
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub enum AfterLaunch {
    #[default]
    Keep,
    Minimize,
    Exit,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppProjection {
    #[serde(flatten)]
    pub app: AppEntry,
    pub health: PathHealth,
    pub resolved_path: String,
    pub portability: Portability,
}

#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum PathHealth {
    Healthy,
    Missing,
    Unsupported,
    UnsafeRelative,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum Portability {
    PortableRelative,
    ExternalAbsolute,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigView {
    pub config: AppConfig,
    pub apps: Vec<AppProjection>,
    pub data_dir: String,
    pub config_path: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LaunchResult {
    pub view: ConfigView,
    pub warning: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupInfo {
    pub name: String,
    pub valid: bool,
    pub modified_at: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LoadState {
    pub status: LoadStatus,
    pub view: Option<ConfigView>,
    pub error: Option<String>,
    pub backups: Vec<BackupInfo>,
}

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum LoadStatus {
    Ready,
    Corrupt,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportPreview {
    pub config: AppConfig,
    pub source_format: String,
    pub app_count: usize,
    pub category_count: usize,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanCandidate {
    pub id: String,
    pub name: String,
    pub path: String,
    pub description: String,
    pub product_name: String,
    pub kind: String,
    pub portability: Portability,
    pub icon_key: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanResult {
    pub candidates: Vec<ScanCandidate>,
    pub warnings: Vec<String>,
    pub skipped_filtered: usize,
    pub skipped_duplicates: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RelocationResult {
    pub config: AppConfig,
    pub relocated: usize,
    pub still_missing: usize,
}

pub fn validate_config(config: &AppConfig) -> Result<(), String> {
    if config.schema_version != CURRENT_SCHEMA_VERSION {
        return Err(format!(
            "不支持 schemaVersion {}，当前仅支持 {}",
            config.schema_version, CURRENT_SCHEMA_VERSION
        ));
    }
    if config.apps.len() > MAX_APPS {
        return Err(format!("软件数量超过上限 {MAX_APPS}"));
    }
    if config.categories.len() > MAX_CATEGORIES {
        return Err(format!("分类数量超过上限 {MAX_CATEGORIES}"));
    }

    let mut category_ids = HashSet::new();
    for category in &config.categories {
        validate_text("分类 ID", &category.id, 100, false)?;
        validate_text("分类名称", &category.name, 100, false)?;
        validate_text("分类颜色", &category.color, 32, false)?;
        if !category_ids.insert(category.id.as_str()) {
            return Err(format!("分类 ID 重复：{}", category.id));
        }
    }

    let mut app_ids = HashSet::new();
    let mut app_paths = HashSet::new();
    for app in &config.apps {
        validate_text("软件 ID", &app.id, 100, false)?;
        validate_text("软件名称", &app.name, 200, false)?;
        validate_text("软件路径", &app.path, 4_096, false)?;
        validate_text("软件描述", &app.description, 2_000, true)?;
        if !app_ids.insert(app.id.as_str()) {
            return Err(format!("软件 ID 重复：{}", app.id));
        }
        let normalized = app.path.replace('/', "\\").to_lowercase();
        if !app_paths.insert(normalized) {
            return Err(format!("软件路径重复：{}", app.path));
        }
        if let Some(category_id) = &app.category_id {
            if !category_ids.contains(category_id.as_str()) {
                return Err(format!("软件“{}”引用了不存在的分类", app.name));
            }
        }
        for tag in &app.tags {
            validate_text("标签", tag, 60, false)?;
        }
        if app.tags.len() > 30 {
            return Err(format!("软件“{}”的标签数量超过 30", app.name));
        }
        if let Some(website) = &app.website {
            validate_web_url(website)?;
        }
        validate_supported_extension(Path::new(&app.path))?;
    }
    Ok(())
}

pub fn validate_web_url(raw: &str) -> Result<Url, String> {
    let parsed = Url::parse(raw).map_err(|_| "外部链接不是有效 URL".to_string())?;
    match parsed.scheme() {
        "http" | "https" => Ok(parsed),
        _ => Err("外部链接仅允许 http 或 https".into()),
    }
}

pub fn validate_supported_extension(path: &Path) -> Result<(), String> {
    let extension = path
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();
    if matches!(extension.as_str(), "exe" | "lnk") {
        Ok(())
    } else {
        Err("首版仅支持 .exe 和已验证的 .lnk".into())
    }
}

pub fn resolve_app_path(portable_root: &Path, raw: &str) -> Result<(PathBuf, Portability), String> {
    let path = Path::new(raw);
    if path.is_absolute() {
        return Ok((path.to_path_buf(), Portability::ExternalAbsolute));
    }
    if path.components().any(|component| {
        matches!(
            component,
            Component::ParentDir | Component::RootDir | Component::Prefix(_)
        )
    }) {
        return Err("相对路径不能越过 AnyApp 所在目录".into());
    }
    Ok((portable_root.join(path), Portability::PortableRelative))
}

pub fn project_config(config: AppConfig, portable_root: &Path) -> ConfigView {
    let apps = config
        .apps
        .iter()
        .cloned()
        .map(|app| {
            let (health, resolved_path, portability) =
                match resolve_app_path(portable_root, &app.path) {
                    Ok((resolved, portability)) => {
                        let extension_ok = validate_supported_extension(&resolved).is_ok();
                        let healthy = resolved.is_file() && extension_ok;
                        (
                            if healthy {
                                PathHealth::Healthy
                            } else if extension_ok {
                                PathHealth::Missing
                            } else {
                                PathHealth::Unsupported
                            },
                            resolved.to_string_lossy().into_owned(),
                            portability,
                        )
                    }
                    Err(_) => (
                        PathHealth::UnsafeRelative,
                        app.path.clone(),
                        Portability::PortableRelative,
                    ),
                };
            AppProjection {
                app,
                health,
                resolved_path,
                portability,
            }
        })
        .collect();

    ConfigView {
        config,
        apps,
        data_dir: String::new(),
        config_path: String::new(),
    }
}

fn validate_text(
    field: &str,
    value: &str,
    max_chars: usize,
    allow_empty: bool,
) -> Result<(), String> {
    if !allow_empty && value.trim().is_empty() {
        return Err(format!("{field}不能为空"));
    }
    if value.chars().count() > max_chars {
        return Err(format!("{field}长度不能超过 {max_chars}"));
    }
    if value.contains('\0') {
        return Err(format!("{field}包含非法空字符"));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn relative_paths_cannot_escape_portable_root() {
        let root = Path::new("C:/portable");
        assert!(resolve_app_path(root, "apps/tool.exe").is_ok());
        assert!(resolve_app_path(root, "../tool.exe").is_err());
    }

    #[test]
    fn url_allowlist_rejects_local_and_script_schemes() {
        assert!(validate_web_url("https://example.com").is_ok());
        assert!(validate_web_url("file:///C:/secret.txt").is_err());
        assert!(validate_web_url("javascript:alert(1)").is_err());
    }
}
