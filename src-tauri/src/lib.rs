mod commands;
mod migration;
mod model;
mod repository;
mod scanner;
mod windows_ops;

use commands::{
    apply_import, create_desktop_shortcut, export_config, get_icon_data, launch_app, load_config,
    open_app_website, preview_import, relocate_missing, reset_corrupt_config, restore_backup,
    reveal_app, save_config, scan_paths, AppState,
};
use repository::Repository;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let (data_root, portable_root) =
        commands::resolve_roots().expect("failed to resolve AnyApp data roots");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .manage(AppState {
            repository: Repository::new(data_root, portable_root),
        })
        .invoke_handler(tauri::generate_handler![
            load_config,
            save_config,
            preview_import,
            apply_import,
            export_config,
            restore_backup,
            reset_corrupt_config,
            scan_paths,
            launch_app,
            reveal_app,
            open_app_website,
            create_desktop_shortcut,
            get_icon_data,
            relocate_missing,
        ])
        .run(tauri::generate_context!())
        .expect("error while running AnyApp");
}
