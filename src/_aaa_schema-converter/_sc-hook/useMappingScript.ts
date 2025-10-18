import { useScWorkflowStore } from "@/_aaa_schema-converter/_sc-store/scWorkflowStore";
import { createMappingScriptApiConnector } from "../_sc-apiConnector/mappingScript.apiConnector";

export const useMappingScript = () => {
  const createMappingScript = async () => {
    const { sourceSheetVersionId, targetSheetVersionId, workflowCodeId } = useScWorkflowStore.getState();

    // 상태 값 검증
    console.log('Current workflow store state:', {
      sourceSheetVersionId,
      targetSheetVersionId,
      workflowCodeId
    });

    if (!sourceSheetVersionId || !targetSheetVersionId || !workflowCodeId) {
      const errorMsg = 'Missing required workflow data. Please upload sheets first.';
      console.error(errorMsg, {
        sourceSheetVersionId: sourceSheetVersionId || 'MISSING',
        targetSheetVersionId: targetSheetVersionId || 'MISSING',
        workflowCodeId: workflowCodeId || 'MISSING'
      });
      throw new Error(errorMsg);
    }

    const data = {
      sourceSheetVersionId,
      targetSheetVersionId,
      workFlowCodeId: workflowCodeId,
    };

    try {
      const response = await createMappingScriptApiConnector(data);
      console.log("Mapping script created:", response);
      return response;
    } catch (error) {
      console.error("Error creating mapping script:", error);
      throw error;
    }
  };

  return {
    createMappingScript,
  };
};