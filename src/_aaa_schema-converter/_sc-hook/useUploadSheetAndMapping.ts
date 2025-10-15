import { UploadSheetsReqDto, UploadSheetsResDto } from "../_sc-type/uploadSheets.types"
import { uploadSheetsAndMappingAPiConnector } from "../_sc-apiConnector/uploadSheetsAndMapping.apiConnector";
import { useTargetSheetRangeStore } from "../_sc-store/targetSheetRangeStore";
import { useSourceSheetRangeStore } from "../_sc-store/sourceSheetRangeStore";
import { useSourceSheetNameStore } from "../_sc-store/sourceSheetNameStore";
import { useTargetSheetNameStore } from "../_sc-store/targetSheetNameStore";

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

    const sourceSheetData = spreadSourceRef.toJSON({
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

    const targetSheetData = spreadTargetRef.toJSON({
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


    const uploadSheetAndMapping = async (workFlowId?: string): Promise<UploadSheetsResDto | null> => {
        if (!sourceSheetName || !targetSheetName) {
            console.error('Source or Target sheet name is missing');
            return null;
        }

        const dto: UploadSheetsReqDto = {
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

        try {
            const response = await uploadSheetsAndMappingAPiConnector(dto);
            return response;
        } catch (error) {
            console.error('Error uploading sheets and mapping:', error);
            return null;
        }
    };

    return { uploadSheetAndMapping };

}