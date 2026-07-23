import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { anyAppClient } from '../lib/tauri-client'
import type { AppConfig } from '../types'

export const loadStateKey = ['anyapp', 'load-state'] as const

export function useLoadState() {
  return useQuery({ queryKey: loadStateKey, queryFn: anyAppClient.loadConfig, retry: false })
}

export function useAnyAppActions() {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: loadStateKey })
  const saveConfig = useMutation({
    mutationFn: (config: AppConfig) => anyAppClient.saveConfig(config),
    onSuccess: refresh,
  })
  const launch = useMutation({
    mutationFn: (appId: string) => anyAppClient.launchApp(appId),
    onSuccess: refresh,
  })
  const restoreBackup = useMutation({
    mutationFn: (name: string) => anyAppClient.restoreBackup(name),
    onSuccess: refresh,
  })
  const resetCorrupt = useMutation({
    mutationFn: () => anyAppClient.resetCorruptConfig(),
    onSuccess: refresh,
  })
  const applyImport = useMutation({
    mutationFn: (config: AppConfig) => anyAppClient.applyImport(config),
    onSuccess: refresh,
  })
  const relocate = useMutation({
    mutationFn: ({ oldRoot, newRoot }: { oldRoot: string; newRoot: string }) =>
      anyAppClient.relocateMissing(oldRoot, newRoot),
    onSuccess: refresh,
  })

  return {
    saveConfig,
    launch,
    restoreBackup,
    resetCorrupt,
    applyImport,
    relocate,
    scanPaths: anyAppClient.scanPaths,
    previewImport: anyAppClient.previewImport,
    exportConfig: anyAppClient.exportConfig,
    revealApp: anyAppClient.revealApp,
    openAppWebsite: anyAppClient.openAppWebsite,
    createDesktopShortcut: anyAppClient.createDesktopShortcut,
  }
}

export function useAppIcon(iconKey: string | null) {
  return useQuery({
    queryKey: ['anyapp', 'icon', iconKey],
    queryFn: () => anyAppClient.getIconData(iconKey!),
    enabled: Boolean(iconKey),
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  })
}
