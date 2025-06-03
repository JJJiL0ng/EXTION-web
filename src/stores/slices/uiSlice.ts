import { StateCreator } from 'zustand';
import { LoadingStates, ErrorStates, ArtifactCode, MultiSheetFormulaApplication, ChatMessage } from '../types';

// UI 슬라이스 상태
export interface UISlice {
    // === 로딩 상태 ===
    loadingStates: LoadingStates;
    
    // === 에러 상태 ===
    errors: ErrorStates;
    
    // === 수식 관리 ===
    pendingFormula: MultiSheetFormulaApplication | null;
    formulaHistory: MultiSheetFormulaApplication[];
    
    // === 아티팩트 관리 ===
    artifactCode: ArtifactCode | null;
    artifactHistory: ArtifactCode[];
    
    // === 모달 상태 ===
    isArtifactModalOpen: boolean;
    activeArtifactId: string | null;
    isSheetSelectorOpen: boolean;
    
    // === 내부 플래그 ===
    isInternalUpdate: boolean;
    
    // === 액션들 ===
    // 로딩 상태 관리
    setLoadingState: (type: keyof LoadingStates, loading: boolean) => void;
    
    // 에러 상태 관리
    setError: (type: keyof ErrorStates, error: string | null) => void;
    
    // 수식 관리
    setPendingFormula: (formula: MultiSheetFormulaApplication | null) => void;
    addToFormulaHistory: (formula: MultiSheetFormulaApplication) => void;
    applyPendingFormulaToSheet: (sheetIndex?: number) => void;
    
    // 아티팩트 관리
    setArtifactCode: (code: ArtifactCode | null) => void;
    addToArtifactHistory: (artifact: ArtifactCode) => void;
    
    // 모달 관리
    openSheetSelector: () => void;
    closeSheetSelector: () => void;
    openArtifactModal: (artifactId?: string) => void;
    closeArtifactModal: () => void;
    
    // 내부 플래그 관리
    setInternalUpdate: (flag: boolean) => void;
    
    // 스토어 리셋
    resetUIStore: () => void;
}

// UI 슬라이스 생성자
export const createUISlice: StateCreator<
    UISlice & { 
        sheetMessages: { [sheetIndex: number]: ChatMessage[] }; 
        xlsxData: any; 
        computedSheetData: any; 
        cellAddressToCoords: any; 
        [key: string]: any 
    },
    [],
    [],
    UISlice
> = (set, get) => ({
    // === 초기 상태 ===
    loadingStates: {
        fileUpload: false,
        sheetSwitch: false,
        formulaGeneration: false,
        artifactGeneration: false,
        dataGeneration: false,
        dataFix: false,
    },
    
    errors: {
        fileError: null,
        sheetError: null,
        formulaError: null,
        artifactError: null,
        dataGenerationError: null,
        dataFixError: null,
    },
    
    pendingFormula: null,
    formulaHistory: [],
    artifactCode: null,
    artifactHistory: [],
    isArtifactModalOpen: false,
    activeArtifactId: null,
    isSheetSelectorOpen: false,
    isInternalUpdate: false,
    
    // === 로딩 상태 관리 ===
    setLoadingState: (type, loading) =>
        set((state) => ({
            loadingStates: { ...state.loadingStates, [type]: loading }
        })),
    
    // === 에러 상태 관리 ===
    setError: (type, error) =>
        set((state) => ({
            errors: { ...state.errors, [type]: error }
        })),
    
    // === 수식 관리 ===
    setPendingFormula: (formula) => set({ pendingFormula: formula }),
    
    addToFormulaHistory: (formula) =>
        set((state) => ({
            formulaHistory: [...state.formulaHistory, formula]
        })),
    
    applyPendingFormulaToSheet: (sheetIndex) => {
        const { pendingFormula, xlsxData, computedSheetData, cellAddressToCoords } = get();

        if (!pendingFormula || !xlsxData) return;

        const targetSheetIndex = sheetIndex ?? pendingFormula.sheetIndex ?? xlsxData.activeSheetIndex;
        const targetSheet = xlsxData.sheets[targetSheetIndex];

        if (!targetSheet) {
            get().setError('formulaError', `시트 인덱스 ${targetSheetIndex}를 찾을 수 없습니다`);
            return;
        }

        try {
            const { row, col } = cellAddressToCoords(pendingFormula.cellAddress);
            const newComputedData = { ...computedSheetData };

            if (!newComputedData[targetSheetIndex]) {
                newComputedData[targetSheetIndex] = [...targetSheet.data];
            }

            if (!newComputedData[targetSheetIndex][row]) {
                newComputedData[targetSheetIndex][row] = new Array(targetSheet.headers.length).fill('');
            }

            newComputedData[targetSheetIndex][row][col] = pendingFormula.formula;

            set({
                computedSheetData: newComputedData,
                pendingFormula: null
            });

        } catch (error) {
            get().setError('formulaError', error instanceof Error ? error.message : '수식 적용 실패');
        }
    },
    
    // === 아티팩트 관리 ===
    setArtifactCode: (code) => set({ artifactCode: code }),
    
    addToArtifactHistory: (artifact) => {
        set((state) => ({
            artifactHistory: [...state.artifactHistory, artifact],
            artifactCode: artifact,
            activeArtifactId: artifact.messageId || null
        }));
    },
    
    // === 모달 관리 ===
    openSheetSelector: () => set({ isSheetSelectorOpen: true }),
    closeSheetSelector: () => set({ isSheetSelectorOpen: false }),
    
    openArtifactModal: (artifactId) => {
        const state = get();
        
        if (artifactId) {
            // 모든 시트의 메시지에서 해당 ID를 가진 메시지 찾기
            let foundMessage: ChatMessage | null = null;
            
            for (const sheetMessages of Object.values(state.sheetMessages)) {
                foundMessage = sheetMessages.find(msg => msg.id === artifactId) || null;
                if (foundMessage) break;
            }
            
            // 메시지를 찾았고 아티팩트 데이터가 있으면 artifactCode 설정
            if (foundMessage && foundMessage.artifactData) {
                const artifactCode: ArtifactCode = {
                    code: foundMessage.artifactData.code || '',
                    type: foundMessage.artifactData.type as 'chart' | 'table' | 'analysis',
                    timestamp: foundMessage.artifactData.timestamp,
                    title: foundMessage.artifactData.title,
                    messageId: foundMessage.id
                };
                
                set({
                    isArtifactModalOpen: true,
                    activeArtifactId: artifactId,
                    artifactCode: artifactCode
                });
            } else {
                // 메시지를 찾지 못했거나 아티팩트 데이터가 없으면 기본 동작
                set({
                    isArtifactModalOpen: true,
                    activeArtifactId: artifactId
                });
            }
        } else {
            set((state) => ({
                isArtifactModalOpen: true,
                activeArtifactId: state.activeArtifactId
            }));
        }
    },
    
    closeArtifactModal: () => {
        set({
            isArtifactModalOpen: false,
            activeArtifactId: null
        });
    },
    
    // === 내부 플래그 관리 ===
    setInternalUpdate: (flag) => set({ isInternalUpdate: flag }),
    
    // === 스토어 리셋 ===
    resetUIStore: () => {
        set({
            loadingStates: {
                fileUpload: false,
                sheetSwitch: false,
                formulaGeneration: false,
                artifactGeneration: false,
                dataGeneration: false,
                dataFix: false,
            },
            errors: {
                fileError: null,
                sheetError: null,
                formulaError: null,
                artifactError: null,
                dataGenerationError: null,
                dataFixError: null,
            },
            pendingFormula: null,
            formulaHistory: [],
            artifactCode: null,
            artifactHistory: [],
            isArtifactModalOpen: false,
            activeArtifactId: null,
            isSheetSelectorOpen: false,
            isInternalUpdate: false,
        });
    }
}); 