import { invoke } from '@tauri-apps/api/core'
import { open, save } from '@tauri-apps/plugin-dialog'
import type {
  AppConfig,
  ConfigView,
  ImportPreview,
  LaunchResult,
  LoadState,
  RelocationResult,
  ScanResult,
} from '../types'

export const anyAppClient = {
  loadConfig: () => invoke<LoadState>('load_config'),
  saveConfig: (config: AppConfig) => invoke<ConfigView>('save_config', { config }),
  previewImport: (path: string) => invoke<ImportPreview>('preview_import', { path }),
  applyImport: (preview: AppConfig) => invoke<ConfigView>('apply_import', { preview }),
  exportConfig: (path: string) => invoke<void>('export_config', { path }),
  restoreBackup: (name: string) => invoke<ConfigView>('restore_backup', { name }),
  resetCorruptConfig: () => invoke<ConfigView>('reset_corrupt_config'),
  scanPaths: (roots: string[]) => invoke<ScanResult>('scan_paths', { roots }),
  launchApp: (appId: string) => invoke<LaunchResult>('launch_app', { appId }),
  revealApp: (appId: string) => invoke<void>('reveal_app', { appId }),
  openAppWebsite: (appId: string) => invoke<void>('open_app_website', { appId }),
  createDesktopShortcut: (appId: string) =>
    invoke<string>('create_desktop_shortcut', { appId }),
  getIconData: (iconKey: string) => invoke<string | null>('get_icon_data', { iconKey }),
  relocateMissing: (oldRoot: string, newRoot: string) =>
    invoke<RelocationResult>('relocate_missing', { oldRoot, newRoot }),
}

export async function pickScanRoots() {
  const selected = await open({ directory: true, multiple: true, title: '选择软件根目录（最多 8 个）' })
  if (!selected) return []
  return Array.isArray(selected) ? selected : [selected]
}

export async function pickExecutable() {
  const selected = await open({
    multiple: false,
    title: '选择可执行文件或快捷方式',
    filters: [{ name: '支持的启动入口', extensions: ['exe', 'lnk'] }],
  })
  return typeof selected === 'string' ? selected : null
}

export async function pickImportFile() {
  const selected = await open({
    multiple: false,
    title: '导入 AnyApp JSON',
    filters: [{ name: 'JSON 配置', extensions: ['json'] }],
  })
  return typeof selected === 'string' ? selected : null
}

export function pickExportFile() {
  return save({
    title: '导出 AnyApp JSON',
    defaultPath: 'anyapp-config.json',
    filters: [{ name: 'JSON 配置', extensions: ['json'] }],
  })
}

export async function pickDirectory(title: string) {
  const selected = await open({ directory: true, multiple: false, title })
  return typeof selected === 'string' ? selected : null
}
