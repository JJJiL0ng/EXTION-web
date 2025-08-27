import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface SpreadsheetNamesState {
  spreadSheetNames: string[]
  // setters
  setSpreadSheetNames: (names: string[]) => void
  addSpreadSheetName: (name: string) => void
  addSpreadSheetNames: (names: string[]) => void
  updateSpreadSheetNameAt: (index: number, name: string) => void
  removeSpreadSheetName: (name: string) => void
  removeSpreadSheetNameAt: (index: number) => void
  clearSpreadSheetNames: () => void
}

const useSpreadsheetNamesStore = create<SpreadsheetNamesState>()(
  devtools(
    (set) => ({
      spreadSheetNames: [],

      setSpreadSheetNames: (names) =>
        set({ spreadSheetNames: [...names] }, false, 'setSpreadSheetNames'),

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
            return { spreadSheetNames: Array.from(next) }
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
            return { spreadSheetNames: arr }
          },
          false,
          'updateSpreadSheetNameAt'
        ),

      removeSpreadSheetName: (name) =>
        set(
          (state) => ({
            spreadSheetNames: state.spreadSheetNames.filter((n) => n !== name)
          }),
          false,
          'removeSpreadSheetName'
        ),

      removeSpreadSheetNameAt: (index) =>
        set(
          (state) => {
            if (index < 0 || index >= state.spreadSheetNames.length) return state
            const arr = state.spreadSheetNames.slice()
            arr.splice(index, 1)
            return { spreadSheetNames: arr }
          },
          false,
          'removeSpreadSheetNameAt'
        ),

      clearSpreadSheetNames: () =>
        set({ spreadSheetNames: [] }, false, 'clearSpreadSheetNames')
    }),
    {
      name: 'spreadsheet-names-store',
      enabled: process.env.NODE_ENV === 'development',
      trace: true
    }
  )
)

export default useSpreadsheetNamesStore
