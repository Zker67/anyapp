import { create } from 'zustand'
import type { AppFilter, AppSort } from '../lib/filter'

interface UiState {
  query: string
  filter: AppFilter
  sort: AppSort
  selectedIndex: number
  setQuery: (query: string) => void
  setFilter: (filter: AppFilter) => void
  setSort: (sort: AppSort) => void
  setSelectedIndex: (index: number) => void
}

export const useUiStore = create<UiState>((set) => ({
  query: '',
  filter: 'all',
  sort: 'name',
  selectedIndex: 0,
  setQuery: (query) => set({ query, selectedIndex: 0 }),
  setFilter: (filter) => set({ filter, selectedIndex: 0 }),
  setSort: (sort) => set({ sort, selectedIndex: 0 }),
  setSelectedIndex: (selectedIndex) => set({ selectedIndex }),
}))
