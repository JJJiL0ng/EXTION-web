import { UploadSheetsReqDto, UploadSheetsResDto } from "../_sc-type/uploadSheets.types"
import { uploadSheetsAndMappingAPiConnector } from "../_sc-apiConnector/uploadSheetsAndMapping.apiConnector";
import { useTargetSheetRangeStore } from "../_sc-store/targetSheetRangeStore";
import { useSourceSheetRangeStore } from "../_sc-store/sourceSheetRangeStore";
import { useSourceSheetNameStore } from "../_sc-store/sourceSheetNameStore";
import { useTargetSheetNameStore } from "../_sc-store/targetSheetNameStore";
import useUserIdStore from '@/_aaa_sheetChat/_aa_superRefactor/store/user/userIdStore';

export interface useUploadSheetAndMappingProps {
    spreadSourceRef: any;
    spreadTargetRef: any;
}

export const useUploadSheetAndMapping = ({spreadSourceRef, spreadTargetRef}: useUploadSheetAndMappingProps) => {
    const sourceSheetName = useSourceSheetNameStore((state) => state.sourceSheetName);
    const targetSheetName = useTargetSheetNameStore((state) => state.targetSheetName);
    const sourceRange = useSourceSheetRangeStore((state) => state.sourceRange);
    const targetRange = useTargetSheetRangeStore((state) => state.targetRange);
    const isExcuteMappingSuggestion = true;
    const isFirstWorkFlowGenerated = true;
    const userId = useUserIdStore((state) => state.userId);

    const uploadSheetAndMapping = async (workFlowId?: string): Promise<UploadSheetsResDto | null> => {
        if (!sourceSheetName || !targetSheetName) {
            console.error('Source or Target sheet name is missing');
            return null;
        }

        if (!userId) {
            console.error('User ID is missing');
            return null;
        }

        // SpreadJS 인스턴스 검증 (.current를 통해 실제 인스턴스 접근)
        if (!spreadSourceRef?.current || !spreadTargetRef?.current) {
            console.error('SpreadJS instances are not initialized');
            return null;
        }

        // toJSON 호출을 함수 내부로 이동 (.current를 통해 실제 인스턴스의 toJSON 메서드 호출)
        const sourceSheetData = spreadSourceRef.current.toJSON({
            includeBindingSource: true,
            ignoreFormula: false,
            ignoreStyle: false,
            saveAsView: true,
            rowHeadersAsFrozenColumns: false,
            columnHeadersAsFrozenRows: false,
            includeAutoMergedCells: true,
            saveR1C1Formula: true,
            includeUnsupportedFormula: true,
            includeUnsupportedStyle: true
        });

        const targetSheetData = spreadTargetRef.current.toJSON({
            includeBindingSource: true,
            ignoreFormula: false,
            ignoreStyle: false,
            saveAsView: true,
            rowHeadersAsFrozenColumns: false,
            columnHeadersAsFrozenRows: false,
            includeAutoMergedCells: true,
            saveR1C1Formula: true,
            includeUnsupportedFormula: true,
            includeUnsupportedStyle: true
        });

        const dto: UploadSheetsReqDto = {
            userId,
            sourceSheetData,
            targetSheetData,
            sourceSheetName,
            targetSheetName,
            isFirstWorkFlowGenerated,
            isExcuteMappingSuggestion,
            sourceSheetRange: sourceRange,
            targetSheetRange: targetRange,
            workFlowId
        };

        console.log('Uploading sheets with DTO:', dto);

        try {
            const response = await uploadSheetsAndMappingAPiConnector(dto);
            console.log('Upload response:', response);
            return response;
        } catch (error) {
            console.error('Error uploading sheets and mapping:', error);
            return null;
        }
    };

    return { uploadSheetAndMapping };

}