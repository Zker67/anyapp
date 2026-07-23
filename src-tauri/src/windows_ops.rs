use crate::model::{validate_supported_extension, validate_web_url};
use crate::scanner::is_valid_shell_link;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use uuid::Uuid;

const OPEN_WITH_SHELL_SCRIPT: &str =
    "$ErrorActionPreference='Stop'; Start-Process -FilePath $env:ANYAPP_TARGET";

const CREATE_SHORTCUT_SCRIPT: &str = r#"
$ErrorActionPreference = 'Stop'
$desktop = [Environment]::GetFolderPath('Desktop')
if (!$desktop) { throw '无法定位桌面目录' }
$shortcutPath = Join-Path $desktop ($env:ANYAPP_SHORTCUT_NAME + '.lnk')
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $env:ANYAPP_TARGET
$shortcut.WorkingDirectory = $env:ANYAPP_WORKDIR
$shortcut.Description = '由 AnyApp 创建'
$shortcut.Save()
[IO.File]::WriteAllText($env:ANYAPP_SHORTCUT_OUTPUT, $shortcutPath, (New-Object Text.UTF8Encoding($false)))
"#;

pub fn launch(path: &Path) -> Result<(), String> {
    validate_launch_target(path)?;
    let extension = extension(path);
    if extension == "exe" {
        let mut command = Command::new(path);
        if let Some(parent) = path.parent() {
            command.current_dir(parent);
        }
        hide_console(&mut command);
        command
            .spawn()
            .map(|_| ())
            .map_err(|error| format!("启动失败：{error}"))
    } else {
        let mut command = powershell(OPEN_WITH_SHELL_SCRIPT);
        command.env("ANYAPP_TARGET", path);
        let status = command
            .status()
            .map_err(|error| format!("启动快捷方式失败：{error}"))?;
        if status.success() {
            Ok(())
        } else {
            Err(format!("启动快捷方式失败，PowerShell 状态：{status}"))
        }
    }
}

pub fn reveal(path: &Path) -> Result<(), String> {
    let mut command = Command::new("explorer.exe");
    if path.exists() {
        command.arg("/select,").arg(path);
    } else {
        let parent = nearest_existing_parent(path)
            .ok_or_else(|| "路径及其父目录均不存在，无法定位".to_string())?;
        command.arg(parent);
    }
    hide_console(&mut command);
    command
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("打开资源管理器失败：{error}"))
}

pub fn open_web_url(raw: &str) -> Result<(), String> {
    let url = validate_web_url(raw)?;
    let mut command = powershell(OPEN_WITH_SHELL_SCRIPT);
    command.env("ANYAPP_TARGET", url.as_str());
    let status = command
        .status()
        .map_err(|error| format!("打开链接失败：{error}"))?;
    if status.success() {
        Ok(())
    } else {
        Err(format!("打开链接失败，PowerShell 状态：{status}"))
    }
}

pub fn create_desktop_shortcut(
    path: &Path,
    app_name: &str,
    scratch_dir: &Path,
) -> Result<String, String> {
    validate_launch_target(path)?;
    fs::create_dir_all(scratch_dir).map_err(|error| format!("无法创建数据目录：{error}"))?;
    let safe_name = sanitize_shortcut_name(app_name);
    if safe_name.is_empty() {
        return Err("快捷方式名称无效".into());
    }
    let output = scratch_dir.join(format!("shortcut-{}.txt", Uuid::new_v4()));
    let workdir = path.parent().unwrap_or_else(|| Path::new(""));
    let mut command = powershell(CREATE_SHORTCUT_SCRIPT);
    command
        .env("ANYAPP_TARGET", path)
        .env("ANYAPP_WORKDIR", workdir)
        .env("ANYAPP_SHORTCUT_NAME", &safe_name)
        .env("ANYAPP_SHORTCUT_OUTPUT", &output);
    let status = command
        .status()
        .map_err(|error| format!("创建快捷方式失败：{error}"))?;
    if !status.success() {
        let _ = fs::remove_file(&output);
        return Err(format!("创建快捷方式失败，PowerShell 状态：{status}"));
    }
    let result =
        fs::read_to_string(&output).map_err(|error| format!("无法读取快捷方式结果：{error}"))?;
    let _ = fs::remove_file(output);
    Ok(result)
}

pub fn validate_launch_target(path: &Path) -> Result<(), String> {
    if !path.is_file() {
        return Err(format!("文件不存在：{}", path.display()));
    }
    validate_supported_extension(path)?;
    if extension(path) == "lnk" && !is_valid_shell_link(path) {
        return Err("快捷方式文件头无效，已拒绝启动".into());
    }
    Ok(())
}

fn extension(path: &Path) -> String {
    path.extension()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase()
}

fn nearest_existing_parent(path: &Path) -> Option<PathBuf> {
    let mut cursor = path.parent();
    while let Some(candidate) = cursor {
        if candidate.is_dir() {
            return Some(candidate.to_path_buf());
        }
        cursor = candidate.parent();
    }
    None
}

fn sanitize_shortcut_name(name: &str) -> String {
    let mut result: String = name
        .chars()
        .map(|character| {
            if matches!(
                character,
                '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*'
            ) || character == '\0'
            {
                '_'
            } else {
                character
            }
        })
        .take(100)
        .collect();
    while result.ends_with([' ', '.']) {
        result.pop();
    }
    result.trim().to_string()
}

fn powershell(script: &str) -> Command {
    let mut command = Command::new("powershell.exe");
    command.args([
        "-NoLogo",
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        script,
    ]);
    hide_console(&mut command);
    command
}

fn hide_console(command: &mut Command) {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x0800_0000);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn shortcut_name_removes_windows_reserved_characters() {
        assert_eq!(sanitize_shortcut_name("A<'B\" C:/工具?."), "A_'B_ C__工具_");
    }

    #[test]
    fn powershell_scripts_use_environment_boundaries() {
        assert!(CREATE_SHORTCUT_SCRIPT.contains("$env:ANYAPP_TARGET"));
        assert!(CREATE_SHORTCUT_SCRIPT.contains("$env:ANYAPP_SHORTCUT_NAME"));
        assert!(!CREATE_SHORTCUT_SCRIPT.contains("format!("));
        assert!(OPEN_WITH_SHELL_SCRIPT.contains("$env:ANYAPP_TARGET"));
    }
}
