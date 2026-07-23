use crate::model::{Portability, ScanCandidate, ScanResult};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs;
use std::path::Path;
use std::process::Command;
use uuid::Uuid;
use walkdir::WalkDir;

const MAX_ROOTS: usize = 8;
const MAX_DEPTH: usize = 6;
const MAX_CANDIDATES: usize = 1_000;

const METADATA_SCRIPT: &str = r#"
$ErrorActionPreference = 'Stop'
$inputItems = Get-Content -LiteralPath $env:ANYAPP_SCAN_INPUT -Raw | ConvertFrom-Json
$results = New-Object System.Collections.Generic.List[object]
$shortcutShell = New-Object -ComObject WScript.Shell
Add-Type -AssemblyName System.Drawing
foreach ($item in @($inputItems)) {
  $source = [string]$item.path
  $productName = ''
  $description = ''
  $iconKey = $null
  try {
    if ([IO.Path]::GetExtension($source) -ieq '.lnk') {
      $shortcut = $shortcutShell.CreateShortcut($source)
      if ($shortcut.TargetPath) { $source = $shortcut.TargetPath }
    }
    if (Test-Path -LiteralPath $source -PathType Leaf) {
      $version = (Get-Item -LiteralPath $source).VersionInfo
      if ($version) {
        $productName = [string]$version.ProductName
        $description = [string]$version.FileDescription
      }
      if ($item.iconFile -and !(Test-Path -LiteralPath $item.iconFile -PathType Leaf)) {
        $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($source)
        if ($icon) {
          $bitmap = $icon.ToBitmap()
          try { $bitmap.Save([string]$item.iconFile, [System.Drawing.Imaging.ImageFormat]::Png) }
          finally { $bitmap.Dispose(); $icon.Dispose() }
        }
      }
      if ($item.iconFile -and (Test-Path -LiteralPath $item.iconFile -PathType Leaf)) {
        $iconKey = [string]$item.iconKey
      }
    }
  } catch {
    # Metadata enrichment is best-effort; the verified candidate remains usable.
  }
  $results.Add([pscustomobject]@{
    path = [string]$item.path
    productName = $productName
    description = $description
    iconKey = $iconKey
  })
}
$resultArray = @($results | ForEach-Object { $_ })
$json = ConvertTo-Json -InputObject $resultArray -Depth 4 -Compress
[IO.File]::WriteAllText($env:ANYAPP_SCAN_OUTPUT, $json, (New-Object Text.UTF8Encoding($false)))
"#;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct EnrichmentInput {
    path: String,
    icon_file: String,
    icon_key: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct EnrichmentOutput {
    path: String,
    #[serde(default)]
    product_name: String,
    #[serde(default)]
    description: String,
    #[serde(default)]
    icon_key: Option<String>,
}

pub fn scan(
    roots: &[String],
    existing_paths: &HashSet<String>,
    cache_dir: &Path,
) -> Result<ScanResult, String> {
    if roots.is_empty() {
        return Err("请至少选择一个扫描目录".into());
    }
    if roots.len() > MAX_ROOTS {
        return Err(format!("一次最多扫描 {MAX_ROOTS} 个目录"));
    }
    fs::create_dir_all(cache_dir).map_err(|error| format!("无法创建图标缓存目录：{error}"))?;

    let mut candidates = Vec::new();
    let mut warnings = Vec::new();
    let mut seen = existing_paths.clone();
    let mut skipped_filtered = 0;
    let mut skipped_duplicates = 0;

    for root in roots {
        let root_path = Path::new(root);
        if !root_path.is_dir() {
            warnings.push(format!("目录不存在或不可读：{root}"));
            continue;
        }
        for entry in WalkDir::new(root_path)
            .follow_links(false)
            .max_depth(MAX_DEPTH)
            .into_iter()
        {
            let entry = match entry {
                Ok(entry) => entry,
                Err(error) => {
                    warnings.push(format!("扫描警告：{error}"));
                    continue;
                }
            };
            if !entry.file_type().is_file() {
                continue;
            }
            let path = entry.path();
            let extension = path
                .extension()
                .and_then(|value| value.to_str())
                .unwrap_or_default()
                .to_ascii_lowercase();
            if !matches!(extension.as_str(), "exe" | "lnk") {
                continue;
            }
            if extension == "lnk" && !is_valid_shell_link(path) {
                warnings.push(format!("跳过格式无效的快捷方式：{}", path.display()));
                continue;
            }
            let stem = path
                .file_stem()
                .and_then(|value| value.to_str())
                .unwrap_or("未命名软件");
            if is_filtered_name(stem) {
                skipped_filtered += 1;
                continue;
            }
            let absolute = fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf());
            let path_string = absolute.to_string_lossy().into_owned();
            let normalized = normalize_path(&path_string);
            if !seen.insert(normalized) {
                skipped_duplicates += 1;
                continue;
            }
            let icon_key =
                Uuid::new_v5(&Uuid::NAMESPACE_URL, path_string.to_lowercase().as_bytes())
                    .to_string();
            candidates.push(ScanCandidate {
                id: format!("app-{}", Uuid::new_v4()),
                name: humanize_name(stem),
                path: path_string,
                description: String::new(),
                product_name: String::new(),
                kind: extension,
                portability: Portability::ExternalAbsolute,
                icon_key: Some(icon_key),
            });
            if candidates.len() >= MAX_CANDIDATES {
                warnings.push(format!("候选达到 {MAX_CANDIDATES} 条上限，已停止继续扫描"));
                break;
            }
        }
        if candidates.len() >= MAX_CANDIDATES {
            break;
        }
    }

    if let Err(error) = enrich_metadata(&mut candidates, cache_dir) {
        warnings.push(format!("文件描述与图标提取未完成：{error}"));
        for candidate in &mut candidates {
            candidate.icon_key = None;
        }
    }

    for candidate in &mut candidates {
        if !candidate.product_name.trim().is_empty() {
            candidate.name = candidate.product_name.trim().to_string();
        }
    }

    Ok(ScanResult {
        candidates,
        warnings,
        skipped_filtered,
        skipped_duplicates,
    })
}

fn enrich_metadata(candidates: &mut [ScanCandidate], cache_dir: &Path) -> Result<(), String> {
    if candidates.is_empty() {
        return Ok(());
    }
    let nonce = Uuid::new_v4();
    let input_path = cache_dir.join(format!("scan-{nonce}.input.json"));
    let output_path = cache_dir.join(format!("scan-{nonce}.output.json"));
    let input: Vec<EnrichmentInput> = candidates
        .iter()
        .filter_map(|candidate| {
            candidate.icon_key.as_ref().map(|icon_key| EnrichmentInput {
                path: candidate.path.clone(),
                icon_file: cache_dir
                    .join(format!("{icon_key}.png"))
                    .to_string_lossy()
                    .into_owned(),
                icon_key: icon_key.clone(),
            })
        })
        .collect();
    fs::write(
        &input_path,
        serde_json::to_vec(&input).map_err(|error| error.to_string())?,
    )
    .map_err(|error| error.to_string())?;

    let status = powershell_command(METADATA_SCRIPT)
        .env("ANYAPP_SCAN_INPUT", &input_path)
        .env("ANYAPP_SCAN_OUTPUT", &output_path)
        .status()
        .map_err(|error| error.to_string())?;
    let _ = fs::remove_file(&input_path);
    if !status.success() {
        let _ = fs::remove_file(&output_path);
        return Err(format!("PowerShell 返回状态 {status}"));
    }
    let bytes = fs::read(&output_path).map_err(|error| error.to_string())?;
    let _ = fs::remove_file(&output_path);
    let output: Vec<EnrichmentOutput> =
        serde_json::from_slice(&bytes).map_err(|error| error.to_string())?;
    for metadata in output {
        if let Some(candidate) = candidates
            .iter_mut()
            .find(|candidate| candidate.path == metadata.path)
        {
            candidate.product_name = metadata.product_name;
            candidate.description = metadata.description;
            candidate.icon_key = metadata.icon_key;
        }
    }
    Ok(())
}

fn powershell_command(script: &str) -> Command {
    let mut command = Command::new("powershell.exe");
    command.args([
        "-NoLogo",
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        script,
    ]);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x0800_0000);
    }
    command
}

pub(crate) fn is_valid_shell_link(path: &Path) -> bool {
    const HEADER: [u8; 20] = [
        0x4c, 0x00, 0x00, 0x00, 0x01, 0x14, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xc0, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x46,
    ];
    fs::read(path)
        .ok()
        .is_some_and(|bytes| bytes.starts_with(&HEADER))
}

fn is_filtered_name(stem: &str) -> bool {
    let compact = stem.to_ascii_lowercase().replace([' ', '-', '_', '.'], "");
    compact.starts_with("unins")
        || compact.starts_with("uninstall")
        || compact == "updater"
        || compact.ends_with("updater")
        || compact.contains("crashreport")
        || compact.contains("crashhandler")
        || compact == "setup"
        || compact == "installer"
}

fn humanize_name(stem: &str) -> String {
    stem.replace(['_', '-'], " ").trim().to_string()
}

pub fn normalize_path(path: &str) -> String {
    path.replace('/', "\\")
        .trim_end_matches('\\')
        .to_lowercase()
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn filters_maintenance_binaries_without_filtering_normal_apps() {
        assert!(is_filtered_name("unins000"));
        assert!(is_filtered_name("ProductUpdater"));
        assert!(is_filtered_name("crash_reporter"));
        assert!(!is_filtered_name("Visual Studio Code"));
        assert!(!is_filtered_name("Installer Designer"));
    }

    #[test]
    fn validates_shell_link_header_without_opening_it() {
        let directory = tempdir().unwrap();
        let valid = directory.path().join("valid.lnk");
        let invalid = directory.path().join("invalid.lnk");
        fs::write(
            &valid,
            [
                0x4c, 0x00, 0x00, 0x00, 0x01, 0x14, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xc0, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x46,
            ],
        )
        .unwrap();
        fs::write(&invalid, b"not a shortcut").unwrap();
        assert!(is_valid_shell_link(&valid));
        assert!(!is_valid_shell_link(&invalid));
    }

    #[test]
    fn metadata_script_never_embeds_candidate_values() {
        assert!(METADATA_SCRIPT.contains("$env:ANYAPP_SCAN_INPUT"));
        assert!(METADATA_SCRIPT.contains("$resultArray = @($results | ForEach-Object { $_ })"));
        assert!(!METADATA_SCRIPT.contains("ConvertTo-Json -InputObject @($results)"));
        assert!(!METADATA_SCRIPT.contains("format!("));
    }

    #[cfg(windows)]
    #[test]
    fn powershell_serializes_a_single_result_as_an_array() {
        let script = r#"
$ErrorActionPreference = 'Stop'
$results = New-Object System.Collections.Generic.List[object]
$results.Add([pscustomobject]@{ path = 'C:\Apps\one.exe'; productName = 'One' })
$resultArray = @($results | ForEach-Object { $_ })
$json = ConvertTo-Json -InputObject $resultArray -Depth 4 -Compress
[Console]::Out.Write($json)
"#;
        let output = powershell_command(script).output().unwrap();
        assert!(
            output.status.success(),
            "PowerShell failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
        let parsed: Vec<serde_json::Value> = serde_json::from_slice(&output.stdout).unwrap();
        assert_eq!(parsed.len(), 1);
        assert_eq!(parsed[0]["productName"], "One");
    }

    #[cfg(windows)]
    #[test]
    fn scans_and_enriches_one_executable_without_running_it() {
        let directory = tempdir().unwrap();
        let scan_root = directory.path().join("software");
        let cache_dir = directory.path().join("icons");
        fs::create_dir_all(&scan_root).unwrap();
        let candidate_path = scan_root.join("AnyApp Test Tool.exe");
        fs::copy(std::env::current_exe().unwrap(), &candidate_path).unwrap();

        let result = scan(
            &[scan_root.to_string_lossy().into_owned()],
            &HashSet::new(),
            &cache_dir,
        )
        .unwrap();

        assert_eq!(result.candidates.len(), 1);
        assert_eq!(result.candidates[0].kind, "exe");
        assert!(result.candidates[0].path.ends_with("AnyApp Test Tool.exe"));
        assert!(result
            .warnings
            .iter()
            .all(|warning| !warning.contains("文件描述与图标提取未完成")));
    }
}
