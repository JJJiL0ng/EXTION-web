import { useEffect, useMemo } from 'react'
import { useSpreadsheetContext } from "@/_contexts/SpreadsheetContext"
import useSpreadsheetNamesStore from "@/_store/sheet/spreadSheetNamesStore"

export const useSpreadSheetNames = () => {
    const { spreadRef } = useSpreadsheetContext()

    // store selectors (components won't import the store directly)
    const spreadSheetNames = useSpreadsheetNamesStore((s) => s.spreadSheetNames)
    const setSpreadSheetNames = useSpreadsheetNamesStore((s) => s.setSpreadSheetNames)

    // util: extract names from current spread
    const getNamesFromSpread = (spread: any): string[] => {
        try {
            const count = spread?.getSheetCount?.() ?? 0
            return Array.from({ length: count }, (_, i) => spread.getSheet(i).name())
        } catch {
            return []
        }
    }

    // 1) 컨텍스트(spreadRef)가 바뀔 때마다 스토어 업데이트
        useEffect(() => {
            const spread = spreadRef?.current
        if (!spread) return

        // 초기 동기화
        setSpreadSheetNames(getNamesFromSpread(spread))

        // 3) 시트 이름 변경 감지 및 콘솔 로그
        const GC: any = typeof window !== 'undefined' ? (window as any).GC : undefined
        const EVENTS = GC?.Spread?.Sheets?.Events
                const SheetNameChanged = EVENTS?.SheetNameChanged ?? 'SheetNameChanged'

                // 추가: 시트 변동(추가/삭제/이동/가시성/활성 등) 실시간 반영
                const resolveEvent = (key: string) => EVENTS?.[key] ?? key
                const extraEventKeys = [
                    'ActiveSheetChanged',
                    'SheetTabClick',
                    'SheetAdded',
                    'SheetRemoved',
                    'SheetMoved',
                    'SheetCountChanged',
                    'SheetVisibleChanged'
                ]
                const extraEvents = extraEventKeys.map(resolveEvent)

        const onSheetNameChanged = (_sender: any, args: any) => {
            const names = getNamesFromSpread(spread)
            setSpreadSheetNames(names)
            const oldName = args?.oldValue ?? args?.oldName ?? args?.oldText ?? args?.old ?? '(unknown)'
            const newName = args?.newValue ?? args?.newName ?? args?.newText ?? args?.new ?? '(unknown)'
            const sheetIndex =
                args?.sheet?.index?.() ??
                args?.sheet?.getIndex?.() ??
                args?.sheetIndex ??
                '(unknown)'
            // 로그
            console.log('[useSpreadSheetNames] Sheet name changed', { sheetIndex, oldName, newName, names })
        }

                const onSheetCollectionChanged = (_sender: any, args: any) => {
                    const names = getNamesFromSpread(spread)
                    setSpreadSheetNames(names)
                    console.log('[useSpreadSheetNames] Sheet collection changed', {
                        event: args?.type ?? args?.name ?? '(unknown)',
                        sheetIndex: args?.sheetIndex ?? args?.newIndex ?? args?.oldIndex,
                        names
                    })
                }

        // 이벤트 바인딩/클린업 (문자열/상수 모두 지원 시도)
        try {
            spread?.bind?.(SheetNameChanged, onSheetNameChanged)
        } catch {
            try {
                spread?.bind?.('SheetNameChanged', onSheetNameChanged)
            } catch {
                // noop
            }
        }

                // 추가 이벤트 바인딩 (각 이벤트는 실패해도 개별적으로 무시)
                extraEvents.forEach((ev) => {
                    try {
                        spread?.bind?.(ev, onSheetCollectionChanged)
                    } catch {
                        try { spread?.bind?.(String(ev), onSheetCollectionChanged) } catch { /* noop */ }
                    }
                })

        return () => {
            try {
                spread?.unbind?.(SheetNameChanged, onSheetNameChanged)
            } catch {
                try {
                    spread?.unbind?.('SheetNameChanged', onSheetNameChanged)
                } catch {
                    // noop
                }
            }

                    extraEvents.forEach((ev) => {
                        try {
                            spread?.unbind?.(ev, onSheetCollectionChanged)
                        } catch {
                            try { spread?.unbind?.(String(ev), onSheetCollectionChanged) } catch { /* noop */ }
                        }
                    })
        }
        }, [spreadRef, setSpreadSheetNames])

    return {
        spreadRef,
        spreadSheetNames
    }
}
