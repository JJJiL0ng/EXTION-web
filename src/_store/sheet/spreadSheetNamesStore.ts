import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface SheetInfo { name: string; index: number }

interface SpreadsheetNamesState {
  // 공용 시트 네임 저장소
  spreadSheetNames: string[]
  // 선택된 시트 상태 (공용 저장소 기반)
  selectedSheets: SheetInfo[]

  // 기본 setters
  setSpreadSheetNames: (names: string[]) => void
  addSpreadSheetName: (name: string) => void
  addSpreadSheetNames: (names: string[]) => void
  updateSpreadSheetNameAt: (index: number, name: string) => void
  removeSpreadSheetName: (name: string) => void
  removeSpreadSheetNameAt: (index: number) => void
  clearSpreadSheetNames: () => void

  // 선택 관련 액션들 (SelectedSheetInfo 대체)
  addSelectedSheet: (sheetName: string, sheetIndex?: number) => void
  removeSelectedSheet: (sheetName: string) => void
  clearSelectedSheets: () => void
  addAllSheets: (sheets: SheetInfo[]) => void
  renameSelectedSheet: (oldName: string, newName: string) => void
}

const useSpreadsheetNamesStore = create<SpreadsheetNamesState>()(
  devtools(
    (set) => ({
      spreadSheetNames: [],
      selectedSheets: [],

      // names 변경 시 선택 상태를 현재 names에 맞춰 인덱스 재계산 및 존재하지 않는 선택 제거
      setSpreadSheetNames: (names) =>
        set(
          (state) => {
            const map = new Map(names.map((n, i) => [n, i]))
            const nextSelected = state.selectedSheets
              .map((s) => (map.has(s.name) ? { name: s.name, index: map.get(s.name)! } : null))
              .filter((s): s is SheetInfo => !!s)
            return { spreadSheetNames: [...names], selectedSheets: nextSelected }
          },
          false,
          'setSpreadSheetNames'
        ),

  addSpreadSheetName: (name) =>
        set(
          (state) => ({
            spreadSheetNames: state.spreadSheetNames.includes(name)
              ? state.spreadSheetNames
              : [...state.spreadSheetNames, name]
          }),
          false,
          'addSpreadSheetName'
        ),

      addSpreadSheetNames: (names) =>
        set(
          (state) => {
            const next = new Set(state.spreadSheetNames)
            names.forEach((n) => next.add(n))
            // 선택 상태도 이름 유지 기반으로 인덱스 재계산
            const arr = Array.from(next)
            const map = new Map(arr.map((n, i) => [n, i]))
            const nextSelected = state.selectedSheets
              .map((s) => (map.has(s.name) ? { name: s.name, index: map.get(s.name)! } : null))
              .filter((s): s is SheetInfo => !!s)
            return { spreadSheetNames: arr, selectedSheets: nextSelected }
          },
          false,
          'addSpreadSheetNames'
        ),

      updateSpreadSheetNameAt: (index, name) =>
        set(
          (state) => {
            if (index < 0 || index >= state.spreadSheetNames.length) return state
            const arr = state.spreadSheetNames.slice()
            arr[index] = name
            // 이름이 바뀌면 선택 상태의 해당 인덱스의 name도 업데이트 필요
            const map = new Map(arr.map((n, i) => [n, i]))
            const nextSelected = state.selectedSheets
              .map((s) => (map.has(s.name) ? { name: s.name, index: map.get(s.name)! } : null))
              .filter((s): s is SheetInfo => !!s)
            return { spreadSheetNames: arr, selectedSheets: nextSelected }
          },
          false,
          'updateSpreadSheetNameAt'
        ),

  removeSpreadSheetName: (name) =>
        set(
          (state) => ({
    spreadSheetNames: state.spreadSheetNames.filter((n) => n !== name),
    selectedSheets: state.selectedSheets.filter((s) => s.name !== name)
          }),
          false,
          'removeSpreadSheetName'
        ),

      removeSpreadSheetNameAt: (index) =>
        set(
          (state) => {
            if (index < 0 || index >= state.spreadSheetNames.length) return state
            const arr = state.spreadSheetNames.slice()
            const removed = arr.splice(index, 1)[0]
            const nextSelected = state.selectedSheets.filter((s) => s.name !== removed)
            // 인덱스 재계산
            const map = new Map(arr.map((n, i) => [n, i]))
            const reIndexed = nextSelected
              .map((s) => (map.has(s.name) ? { name: s.name, index: map.get(s.name)! } : null))
              .filter((s): s is SheetInfo => !!s)
            return { spreadSheetNames: arr, selectedSheets: reIndexed }
          },
          false,
          'removeSpreadSheetNameAt'
        ),

      clearSpreadSheetNames: () =>
        set({ spreadSheetNames: [], selectedSheets: [] }, false, 'clearSpreadSheetNames'),

      // ===== 선택 관련 액션들 =====
      addSelectedSheet: (sheetName: string, sheetIndex?: number) =>
        set(
          (state) => {
            if (state.selectedSheets.some((s) => s.name === sheetName)) return state
            const idx = state.spreadSheetNames.indexOf(sheetName)
            const index = idx >= 0 ? idx : (sheetIndex ?? state.selectedSheets.length)
            return { selectedSheets: [...state.selectedSheets, { name: sheetName, index }] }
          },
          false,
          'addSelectedSheet'
        ),

      removeSelectedSheet: (sheetName: string) =>
        set(
          (state) => ({ selectedSheets: state.selectedSheets.filter((s) => s.name !== sheetName) }),
          false,
          'removeSelectedSheet'
        ),

      clearSelectedSheets: () => set({ selectedSheets: [] }, false, 'clearSelectedSheets'),

      addAllSheets: (sheets: SheetInfo[]) =>
        set(
          (state) => {
            // 현존하는 시트만, 그리고 인덱스는 현재 names 기준 재계산
            const map = new Map(state.spreadSheetNames.map((n, i) => [n, i]))
            const unique = new Map<string, SheetInfo>()
            sheets.forEach((s) => {
              if (map.has(s.name)) unique.set(s.name, { name: s.name, index: map.get(s.name)! })
            })
            return { selectedSheets: Array.from(unique.values()) }
          },
          false,
          'addAllSheets'
        ),

      renameSelectedSheet: (oldName: string, newName: string) =>
        set(
          (state) => {
            const has = state.selectedSheets.some((s) => s.name === oldName)
            if (!has) return state
            const idx = state.spreadSheetNames.indexOf(newName)
            const next = state.selectedSheets.map((s) =>
              s.name === oldName ? { name: newName, index: idx >= 0 ? idx : s.index } : s
            )
            // 인덱스 최종 정합성
            if (idx >= 0) {
              const map = new Map(state.spreadSheetNames.map((n, i) => [n, i]))
              return {
                selectedSheets: next
                  .map((s) => (map.has(s.name) ? { name: s.name, index: map.get(s.name)! } : null))
                  .filter((s): s is SheetInfo => !!s)
              }
            }
            return { selectedSheets: next }
          },
          false,
          'renameSelectedSheet'
        )
    }),
    {
      name: 'spreadsheet-names-store',
      enabled: process.env.NODE_ENV === 'development',
      trace: true
    }
  )
)

export default useSpreadsheetNamesStore
