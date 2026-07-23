use crate::model::{
    resolve_app_path, AfterLaunch, AppConfig, ConfigView, ImportPreview, LaunchResult, LoadState,
    RelocationResult, ScanResult,
};
use crate::repository::Repository;
use crate::{scanner, windows_ops};
use base64::{engine::general_purpose::STANDARD, Engine as _};
use chrono::{SecondsFormat, Utc};
use std::collections::HashSet;
use std::path::{Path, PathBuf};
use tauri::State;

pub struct AppState {
    pub repository: Repository,
}

#[tauri::command]
pub fn load_config(state: State<'_, AppState>) -> Result<LoadState, String> {
    state.repository.load_state().map_err(to_error)
}

#[tauri::command]
pub fn save_config(config: AppConfig, state: State<'_, AppState>) -> Result<ConfigView, String> {
    state.repository.save(config).map_err(to_error)
}

#[tauri::command]
pub fn preview_import(path: String, state: State<'_, AppState>) -> Result<ImportPreview, String> {
    state
        .repository
        .read_import(Path::new(&path))
        .map_err(to_error)
}

#[tauri::command]
pub fn apply_import(preview: AppConfig, state: State<'_, AppState>) -> Result<ConfigView, String> {
    state
        .repository
        .update(move |current| {
            let revision = current.revision;
            *current = preview;
            current.revision = revision;
            Ok(())
        })
        .map_err(to_error)
}

#[tauri::command]
pub fn export_config(path: String, state: State<'_, AppState>) -> Result<(), String> {
    state
        .repository
        .export_to(Path::new(&path))
        .map_err(to_error)
}

#[tauri::command]
pub fn restore_backup(name: String, state: State<'_, AppState>) -> Result<ConfigView, String> {
    state.repository.restore_backup(&name).map_err(to_error)
}

#[tauri::command]
pub fn reset_corrupt_config(state: State<'_, AppState>) -> Result<ConfigView, String> {
    state.repository.reset_corrupt().map_err(to_error)
}

#[tauri::command]
pub fn scan_paths(roots: Vec<String>, state: State<'_, AppState>) -> Result<ScanResult, String> {
    let config = state.repository.read_current().map_err(to_error)?;
    let existing: HashSet<String> = config
        .apps
        .iter()
        .map(|app| scanner::normalize_path(&app.path))
        .collect();
    scanner::scan(&roots, &existing, &state.repository.icons_dir())
}

#[tauri::command]
pub fn launch_app(
    app_id: String,
    window: tauri::Window,
    state: State<'_, AppState>,
) -> Result<LaunchResult, String> {
    let config = state.repository.read_current().map_err(to_error)?;
    let app = config
        .apps
        .iter()
        .find(|app| app.id == app_id)
        .ok_or_else(|| "软件不存在或已被删除".to_string())?;
    let (resolved, _) = resolve_app_path(state.repository.portable_root(), &app.path)?;
    let after_launch = config.settings.after_launch;

    windows_ops::launch(&resolved)?;

    let now = Utc::now().to_rfc3339_opts(SecondsFormat::Secs, true);
    let (view, warning) = match state
        .repository
        .update(|config| record_launch(config, &app_id, &now))
    {
        Ok(view) => (view, None),
        Err(error) => {
            let view = state.repository.view_current().map_err(|reload_error| {
                format!(
                    "软件已启动，但启动统计保存失败（{error}），重新读取配置也失败：{reload_error}"
                )
            })?;
            (view, Some(format!("软件已启动，但启动统计未保存：{error}")))
        }
    };

    match after_launch {
        AfterLaunch::Keep => {}
        AfterLaunch::Minimize => window.minimize().map_err(|error| error.to_string())?,
        AfterLaunch::Exit => window.close().map_err(|error| error.to_string())?,
    }
    Ok(LaunchResult { view, warning })
}

fn record_launch(config: &mut AppConfig, app_id: &str, now: &str) -> Result<(), String> {
    let app = config
        .apps
        .iter_mut()
        .find(|app| app.id == app_id)
        .ok_or_else(|| "软件已启动，但其配置记录已被删除".to_string())?;
    app.last_launched_at = Some(now.to_string());
    app.updated_at = now.to_string();
    app.launch_count = app.launch_count.saturating_add(1);
    Ok(())
}

#[tauri::command]
pub fn reveal_app(app_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let config = state.repository.read_current().map_err(to_error)?;
    let app = config
        .apps
        .iter()
        .find(|app| app.id == app_id)
        .ok_or_else(|| "软件不存在或已被删除".to_string())?;
    let (resolved, _) = resolve_app_path(state.repository.portable_root(), &app.path)?;
    windows_ops::reveal(&resolved)
}

#[tauri::command]
pub fn open_app_website(app_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let config = state.repository.read_current().map_err(to_error)?;
    let website = config
        .apps
        .iter()
        .find(|app| app.id == app_id)
        .and_then(|app| app.website.as_deref())
        .ok_or_else(|| "该软件未配置外部链接".to_string())?;
    windows_ops::open_web_url(website)
}

#[tauri::command]
pub fn create_desktop_shortcut(
    app_id: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let config = state.repository.read_current().map_err(to_error)?;
    let app = config
        .apps
        .iter()
        .find(|app| app.id == app_id)
        .ok_or_else(|| "软件不存在或已被删除".to_string())?;
    let (resolved, _) = resolve_app_path(state.repository.portable_root(), &app.path)?;
    windows_ops::create_desktop_shortcut(&resolved, &app.name, state.repository.root())
}

#[tauri::command]
pub fn get_icon_data(
    icon_key: String,
    state: State<'_, AppState>,
) -> Result<Option<String>, String> {
    if uuid::Uuid::parse_str(&icon_key).is_err() {
        return Err("图标缓存键无效".into());
    }
    let path = state.repository.icons_dir().join(format!("{icon_key}.png"));
    if !path.is_file() {
        return Ok(None);
    }
    let bytes = std::fs::read(path).map_err(|error| format!("读取图标失败：{error}"))?;
    if bytes.len() > 2 * 1024 * 1024 {
        return Err("图标文件超过 2 MiB 上限".into());
    }
    Ok(Some(format!(
        "data:image/png;base64,{}",
        STANDARD.encode(bytes)
    )))
}

#[tauri::command]
pub fn relocate_missing(
    old_root: String,
    new_root: String,
    state: State<'_, AppState>,
) -> Result<RelocationResult, String> {
    let old_root = PathBuf::from(old_root);
    let new_root = PathBuf::from(new_root);
    if !old_root.is_absolute() || !new_root.is_absolute() || !new_root.is_dir() {
        return Err("新旧根目录必须是绝对路径，且新目录必须存在".into());
    }
    let portable_root = state.repository.portable_root().to_path_buf();
    let mut relocated = 0usize;
    let view = state
        .repository
        .update(|config| {
            for app in &mut config.apps {
                let Ok((resolved, _)) = resolve_app_path(&portable_root, &app.path) else {
                    continue;
                };
                if resolved.exists() || !resolved.is_absolute() {
                    continue;
                }
                let Ok(suffix) = resolved.strip_prefix(&old_root) else {
                    continue;
                };
                let candidate = new_root.join(suffix);
                if candidate.is_file()
                    && crate::model::validate_supported_extension(&candidate).is_ok()
                {
                    app.path = candidate.to_string_lossy().into_owned();
                    app.updated_at = Utc::now().to_rfc3339_opts(SecondsFormat::Secs, true);
                    relocated += 1;
                }
            }
            Ok(())
        })
        .map_err(to_error)?;
    let still_missing = view
        .apps
        .iter()
        .filter(|app| !matches!(app.health, crate::model::PathHealth::Healthy))
        .count();
    Ok(RelocationResult {
        config: view.config,
        relocated,
        still_missing,
    })
}

pub fn resolve_roots() -> Result<(PathBuf, PathBuf), String> {
    let portable_root = if cfg!(debug_assertions) {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .expect("src-tauri has a parent")
            .to_path_buf()
    } else {
        std::env::current_exe()
            .map_err(|error| format!("无法定位 AnyApp 可执行文件：{error}"))?
            .parent()
            .ok_or_else(|| "AnyApp 可执行文件缺少父目录".to_string())?
            .to_path_buf()
    };
    let data_root = match std::env::var_os("ANYAPP_DATA_DIR") {
        Some(value) if !value.is_empty() => {
            let path = PathBuf::from(value);
            if !path.is_absolute() {
                return Err("ANYAPP_DATA_DIR 必须是绝对路径".into());
            }
            path
        }
        _ if cfg!(debug_assertions) => portable_root.join(".dev-data"),
        _ => portable_root.join("AnyAppData"),
    };
    Ok((data_root, portable_root))
}

fn to_error(error: impl std::fmt::Display) -> String {
    error.to_string()
}
