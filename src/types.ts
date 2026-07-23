export type AfterLaunch = 'keep' | 'minimize' | 'exit'
export type PathHealth = 'healthy' | 'missing' | 'unsupported' | 'unsafeRelative'
export type Portability = 'portableRelative' | 'externalAbsolute'

export interface Category {
  id: string
  name: string
  color: string
}

export interface AppEntry {
  id: string
  name: string
  path: string
  categoryId: string | null
  description: string
  tags: string[]
  favorite: boolean
  website: string | null
  iconKey: string | null
  createdAt: string
  updatedAt: string
  lastLaunchedAt: string | null
  launchCount: number
}

export interface Settings {
  afterLaunch: AfterLaunch
  compactView: boolean
}

export interface AppConfig {
  schemaVersion: number
  revision: number
  categories: Category[]
  apps: AppEntry[]
  settings: Settings
}

export interface AppProjection extends AppEntry {
  health: PathHealth
  resolvedPath: string
  portability: Portability
}

export interface ConfigView {
  config: AppConfig
  apps: AppProjection[]
  dataDir: string
  configPath: string
}

export interface LaunchResult {
  view: ConfigView
  warning: string | null
}

export interface BackupInfo {
  name: string
  valid: boolean
  modifiedAt: string | null
}

export interface LoadState {
  status: 'ready' | 'corrupt'
  view: ConfigView | null
  error: string | null
  backups: BackupInfo[]
}

export interface ImportPreview {
  config: AppConfig
  sourceFormat: string
  appCount: number
  categoryCount: number
  warnings: string[]
}

export interface ScanCandidate {
  id: string
  name: string
  path: string
  description: string
  productName: string
  kind: 'exe' | 'lnk'
  portability: Portability
  iconKey: string | null
}

export interface ScanResult {
  candidates: ScanCandidate[]
  warnings: string[]
  skippedFiltered: number
  skippedDuplicates: number
}

export interface RelocationResult {
  config: AppConfig
  relocated: number
  stillMissing: number
}
