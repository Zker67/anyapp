use crate::migration::migrate_value;
use crate::model::{
    project_config, validate_config, AppConfig, BackupInfo, ConfigView, LoadState, LoadStatus,
};
use chrono::{SecondsFormat, Utc};
use serde_json::Value;
use std::fs::{self, File, OpenOptions};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use thiserror::Error;

const CONFIG_FILE: &str = "config.json";
const MAX_IMPORT_BYTES: u64 = 2 * 1024 * 1024;
const BACKUP_COUNT: usize = 3;

#[derive(Debug, Error)]
pub enum RepositoryError {
    #[error("配置 IO 失败：{0}")]
    Io(#[from] std::io::Error),
    #[error("配置 JSON 无效：{0}")]
    Json(#[from] serde_json::Error),
    #[error("配置校验失败：{0}")]
    Validation(String),
    #[error("配置已损坏，请先恢复备份或重置，拒绝覆盖")]
    CorruptCurrent,
    #[error("配置已被其他操作更新，请刷新后重试")]
    RevisionConflict,
    #[error("备份名称无效")]
    InvalidBackup,
}

pub struct Repository {
    root: PathBuf,
    portable_root: PathBuf,
    write_lock: Mutex<()>,
}

impl Repository {
    pub fn new(root: PathBuf, portable_root: PathBuf) -> Self {
        Self {
            root,
            portable_root,
            write_lock: Mutex::new(()),
        }
    }

    pub fn root(&self) -> &Path {
        &self.root
    }

    pub fn portable_root(&self) -> &Path {
        &self.portable_root
    }

    pub fn config_path(&self) -> PathBuf {
        self.root.join(CONFIG_FILE)
    }

    pub fn icons_dir(&self) -> PathBuf {
        self.root.join("icons")
    }

    pub fn load_state(&self) -> Result<LoadState, RepositoryError> {
        fs::create_dir_all(&self.root)?;
        fs::create_dir_all(self.icons_dir())?;
        if !self.config_path().exists() {
            self.save_initial(&AppConfig::default())?;
        }

        let backups = self.list_backups()?;
        match self.read_current() {
            Ok(config) => Ok(LoadState {
                status: LoadStatus::Ready,
                view: Some(self.to_view(config)),
                error: None,
                backups,
            }),
            Err(error) => Ok(LoadState {
                status: LoadStatus::Corrupt,
                view: None,
                error: Some(error.to_string()),
                backups,
            }),
        }
    }

    pub fn read_current(&self) -> Result<AppConfig, RepositoryError> {
        let bytes = fs::read(self.config_path())?;
        let config: AppConfig = serde_json::from_slice(&bytes)?;
        validate_config(&config).map_err(RepositoryError::Validation)?;
        Ok(config)
    }

    pub fn view_current(&self) -> Result<ConfigView, RepositoryError> {
        self.read_current().map(|config| self.to_view(config))
    }

    pub fn save(&self, mut incoming: AppConfig) -> Result<ConfigView, RepositoryError> {
        let _guard = self
            .write_lock
            .lock()
            .expect("repository write lock poisoned");
        let current = if self.config_path().exists() {
            self.read_current()
                .map_err(|_| RepositoryError::CorruptCurrent)?
        } else {
            AppConfig::default()
        };
        if incoming.revision != current.revision {
            return Err(RepositoryError::RevisionConflict);
        }
        incoming.revision = current.revision.saturating_add(1);
        self.save_unlocked(&incoming, true, false, atomic_replace)?;
        Ok(self.to_view(incoming))
    }

    pub fn update<F>(&self, mutate: F) -> Result<ConfigView, RepositoryError>
    where
        F: FnOnce(&mut AppConfig) -> Result<(), String>,
    {
        let _guard = self
            .write_lock
            .lock()
            .expect("repository write lock poisoned");
        let mut config = self
            .read_current()
            .map_err(|_| RepositoryError::CorruptCurrent)?;
        mutate(&mut config).map_err(RepositoryError::Validation)?;
        config.revision = config.revision.saturating_add(1);
        self.save_unlocked(&config, true, false, atomic_replace)?;
        Ok(self.to_view(config))
    }

    pub fn read_import(&self, path: &Path) -> Result<crate::model::ImportPreview, RepositoryError> {
        let metadata = fs::metadata(path)?;
        if metadata.len() > MAX_IMPORT_BYTES {
            return Err(RepositoryError::Validation(format!(
                "导入文件超过 {} MiB 上限",
                MAX_IMPORT_BYTES / 1024 / 1024
            )));
        }
        let file = File::open(path)?;
        let mut bytes = Vec::with_capacity(metadata.len() as usize);
        file.take(MAX_IMPORT_BYTES + 1).read_to_end(&mut bytes)?;
        let value: Value = serde_json::from_slice(&bytes)?;
        migrate_value(value).map_err(RepositoryError::Validation)
    }

    pub fn export_to(&self, destination: &Path) -> Result<(), RepositoryError> {
        let config = self.read_current()?;
        validate_config(&config).map_err(RepositoryError::Validation)?;
        let parent = destination
            .parent()
            .ok_or_else(|| RepositoryError::Validation("导出路径缺少父目录".into()))?;
        fs::create_dir_all(parent)?;
        let bytes = serialize_config(&config)?;
        let temp = temporary_path(destination);
        write_synced(&temp, &bytes)?;
        let verification: AppConfig = serde_json::from_slice(&fs::read(&temp)?)?;
        validate_config(&verification).map_err(RepositoryError::Validation)?;
        atomic_replace(&temp, destination)?;
        sync_parent(parent)?;
        Ok(())
    }

    pub fn restore_backup(&self, name: &str) -> Result<ConfigView, RepositoryError> {
        if !backup_names().contains(&name) {
            return Err(RepositoryError::InvalidBackup);
        }
        let backup_path = self.root.join(name);
        let bytes = fs::read(&backup_path)?;
        let mut config: AppConfig = serde_json::from_slice(&bytes)?;
        validate_config(&config).map_err(RepositoryError::Validation)?;

        let _guard = self
            .write_lock
            .lock()
            .expect("repository write lock poisoned");
        self.archive_corrupt_if_needed()?;
        config.revision = config.revision.saturating_add(1);
        self.save_unlocked(&config, false, true, atomic_replace)?;
        Ok(self.to_view(config))
    }

    pub fn reset_corrupt(&self) -> Result<ConfigView, RepositoryError> {
        let _guard = self
            .write_lock
            .lock()
            .expect("repository write lock poisoned");
        self.archive_corrupt_if_needed()?;
        let config = AppConfig {
            revision: 1,
            ..AppConfig::default()
        };
        self.save_unlocked(&config, false, true, atomic_replace)?;
        Ok(self.to_view(config))
    }

    pub fn list_backups(&self) -> Result<Vec<BackupInfo>, RepositoryError> {
        backup_names()
            .into_iter()
            .filter_map(|name| {
                let path = self.root.join(name);
                path.exists().then_some((name, path))
            })
            .map(|(name, path)| {
                let valid = fs::read(&path)
                    .ok()
                    .and_then(|bytes| serde_json::from_slice::<AppConfig>(&bytes).ok())
                    .is_some_and(|config| validate_config(&config).is_ok());
                let modified_at = fs::metadata(&path)
                    .ok()
                    .and_then(|metadata| metadata.modified().ok())
                    .map(chrono::DateTime::<Utc>::from)
                    .map(|time| time.to_rfc3339_opts(SecondsFormat::Secs, true));
                Ok(BackupInfo {
                    name: name.into(),
                    valid,
                    modified_at,
                })
            })
            .collect()
    }

    fn save_initial(&self, config: &AppConfig) -> Result<(), RepositoryError> {
        let _guard = self
            .write_lock
            .lock()
            .expect("repository write lock poisoned");
        if self.config_path().exists() {
            return Ok(());
        }
        self.save_unlocked(config, false, true, atomic_replace)
    }

    fn save_unlocked<F>(
        &self,
        config: &AppConfig,
        backup_current: bool,
        allow_corrupt: bool,
        replacer: F,
    ) -> Result<(), RepositoryError>
    where
        F: Fn(&Path, &Path) -> std::io::Result<()>,
    {
        validate_config(config).map_err(RepositoryError::Validation)?;
        fs::create_dir_all(&self.root)?;
        let target = self.config_path();
        let temp = temporary_path(&target);
        let bytes = serialize_config(config)?;
        write_synced(&temp, &bytes)?;

        let verification: AppConfig = serde_json::from_slice(&fs::read(&temp)?)?;
        validate_config(&verification).map_err(RepositoryError::Validation)?;

        if target.exists() {
            match self.read_current() {
                Ok(_) if backup_current => self.rotate_backups()?,
                Ok(_) => {}
                Err(_) if allow_corrupt => {}
                Err(_) => {
                    let _ = fs::remove_file(&temp);
                    return Err(RepositoryError::CorruptCurrent);
                }
            }
        }

        if let Err(error) = replacer(&temp, &target) {
            let _ = fs::remove_file(&temp);
            return Err(RepositoryError::Io(error));
        }
        sync_parent(&self.root)?;
        Ok(())
    }

    fn rotate_backups(&self) -> Result<(), RepositoryError> {
        for index in (1..=BACKUP_COUNT).rev() {
            let source = self.root.join(format!("config.backup.{index}.json"));
            if !source.exists() {
                continue;
            }
            if index == BACKUP_COUNT {
                fs::remove_file(source)?;
            } else {
                let destination = self.root.join(format!("config.backup.{}.json", index + 1));
                if destination.exists() {
                    fs::remove_file(&destination)?;
                }
                fs::rename(source, destination)?;
            }
        }
        let destination = self.root.join("config.backup.1.json");
        fs::copy(self.config_path(), &destination)?;
        OpenOptions::new()
            .read(true)
            .write(true)
            .open(destination)?
            .sync_all()?;
        Ok(())
    }

    fn archive_corrupt_if_needed(&self) -> Result<(), RepositoryError> {
        let target = self.config_path();
        if !target.exists() || self.read_current().is_ok() {
            return Ok(());
        }
        let archive = self.root.join(format!(
            "config.corrupt.{}.json",
            Utc::now().format("%Y%m%dT%H%M%SZ")
        ));
        fs::copy(target, archive)?;
        Ok(())
    }

    fn to_view(&self, config: AppConfig) -> ConfigView {
        let mut view = project_config(config, &self.portable_root);
        view.data_dir = self.root.to_string_lossy().into_owned();
        view.config_path = self.config_path().to_string_lossy().into_owned();
        view
    }
}

fn serialize_config(config: &AppConfig) -> Result<Vec<u8>, serde_json::Error> {
    let mut bytes = serde_json::to_vec_pretty(config)?;
    bytes.push(b'\n');
    Ok(bytes)
}

fn write_synced(path: &Path, bytes: &[u8]) -> std::io::Result<()> {
    let mut file = OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(true)
        .open(path)?;
    file.write_all(bytes)?;
    file.flush()?;
    file.sync_all()
}

fn temporary_path(target: &Path) -> PathBuf {
    let file_name = target
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or(CONFIG_FILE);
    target.with_file_name(format!(".{file_name}.{}.tmp", std::process::id()))
}

#[cfg(windows)]
fn sync_parent(_parent: &Path) -> std::io::Result<()> {
    // MoveFileExW uses MOVEFILE_WRITE_THROUGH. Windows does not expose directory fsync via File.
    Ok(())
}

#[cfg(not(windows))]
fn sync_parent(parent: &Path) -> std::io::Result<()> {
    File::open(parent)?.sync_all()
}

fn backup_names() -> Vec<&'static str> {
    vec![
        "config.backup.1.json",
        "config.backup.2.json",
        "config.backup.3.json",
    ]
}

#[cfg(windows)]
fn atomic_replace(source: &Path, destination: &Path) -> std::io::Result<()> {
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::Storage::FileSystem::{
        MoveFileExW, MOVEFILE_REPLACE_EXISTING, MOVEFILE_WRITE_THROUGH,
    };

    let source: Vec<u16> = source.as_os_str().encode_wide().chain(Some(0)).collect();
    let destination: Vec<u16> = destination
        .as_os_str()
        .encode_wide()
        .chain(Some(0))
        .collect();
    let result = unsafe {
        MoveFileExW(
            source.as_ptr(),
            destination.as_ptr(),
            MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH,
        )
    };
    if result == 0 {
        Err(std::io::Error::last_os_error())
    } else {
        Ok(())
    }
}

#[cfg(not(windows))]
fn atomic_replace(source: &Path, destination: &Path) -> std::io::Result<()> {
    fs::rename(source, destination)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn failed_replace_preserves_previous_config() {
        let directory = tempdir().unwrap();
        let repository = Repository::new(
            directory.path().to_path_buf(),
            directory.path().to_path_buf(),
        );
        repository.save_initial(&AppConfig::default()).unwrap();
        let before = fs::read(repository.config_path()).unwrap();
        let mut changed = repository.read_current().unwrap();
        changed.revision += 1;
        changed.settings.compact_view = true;

        let result = repository.save_unlocked(&changed, true, false, |_, _| {
            Err(std::io::Error::other("simulated replace failure"))
        });
        assert!(result.is_err());
        assert_eq!(fs::read(repository.config_path()).unwrap(), before);
        assert!(repository.root.join("config.backup.1.json").exists());
    }

    #[test]
    fn rotates_only_three_backups() {
        let directory = tempdir().unwrap();
        let repository = Repository::new(
            directory.path().to_path_buf(),
            directory.path().to_path_buf(),
        );
        repository.save_initial(&AppConfig::default()).unwrap();
        for _ in 0..5 {
            let config = repository.read_current().unwrap();
            repository.save(config).unwrap();
        }
        assert!(repository.root.join("config.backup.1.json").exists());
        assert!(repository.root.join("config.backup.2.json").exists());
        assert!(repository.root.join("config.backup.3.json").exists());
        assert!(!repository.root.join("config.backup.4.json").exists());
    }
}
