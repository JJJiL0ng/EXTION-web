import { FormulaResponse } from '@/_hooks/sheet/useSpreadjsCommandEngine';

// Chat message의 structuredContent 타입
interface StructuredFormulaContent {
  intent: string;
  analysisType?: string;
  detectedOperation?: string;
  formulaName?: string;
  formulaDescription?: string;
  formulaSyntax?: string;
  spreadjsCommand?: string;
  targetRange?: string;
  sourceRange?: string;
  implementation?: {
    steps?: string[];
    cellLocations?: {
      source?: string;
      target?: string;
      description?: string;
    };
  };
  [key: string]: any; // 추가 필드 허용
}

/**
 * Chat message의 structuredContent를 FormulaResponse 형태로 변환
 */
export function transformStructuredContentToFormulaResponse(
  structuredContent: StructuredFormulaContent
): FormulaResponse {
  // 기본값 설정
  const defaultResponse: FormulaResponse = {
    success: true,
    analysis: {
      detectedOperation: structuredContent.detectedOperation || 'Unknown operation',
      dataRange: structuredContent.sourceRange || 'A1:A1',
      targetCells: structuredContent.targetRange || 'B1',
      operationType: structuredContent.analysisType || 'formula'
    },
    formulaDetails: {
      name: structuredContent.formulaName || 'Custom Formula',
      description: structuredContent.formulaDescription || 'Formula execution',
      syntax: structuredContent.formulaSyntax || '',
      spreadjsCommand: structuredContent.spreadjsCommand || ''
    },
    implementation: {
      steps: structuredContent.implementation?.steps || ['Apply formula'],
      cellLocations: {
        source: structuredContent.implementation?.cellLocations?.source || 
                structuredContent.sourceRange || 'A1',
        target: structuredContent.implementation?.cellLocations?.target || 
                structuredContent.targetRange || 'B1',
        description: structuredContent.implementation?.cellLocations?.description || 
                    'Formula application'
      }
    }
  };

  // SpreadJS 명령어가 없는 경우 기본 명령어 생성 시도
  if (!defaultResponse.formulaDetails.spreadjsCommand) {
    defaultResponse.formulaDetails.spreadjsCommand = generateDefaultSpreadJSCommand(
      structuredContent,
      defaultResponse
    );
  }

  return defaultResponse;
}

/**
 * 기본 SpreadJS 명령어 생성 (fallback)
 */
function generateDefaultSpreadJSCommand(
  structuredContent: StructuredFormulaContent,
  response: FormulaResponse
): string {
  const targetCell = response.implementation.cellLocations.target;
  const formula = structuredContent.formulaSyntax || '';
  
  // 타겟 셀을 행/열 인덱스로 변환
  const cellMatch = targetCell.match(/([A-Z]+)(\d+)/);
  if (cellMatch && formula) {
    const [, col, row] = cellMatch;
    const colIndex = col.charCodeAt(0) - 65; // A=0, B=1, ...
    const rowIndex = parseInt(row) - 1; // 1-based to 0-based
    
    return `sheet.setFormula(${rowIndex}, ${colIndex}, '${formula}')`;
  }
  
  // 값 설정 명령어로 fallback
  if (cellMatch) {
    const [, col, row] = cellMatch;
    const colIndex = col.charCodeAt(0) - 65;
    const rowIndex = parseInt(row) - 1;
    
    return `sheet.setValue(${rowIndex}, ${colIndex}, 'Formula Result')`;
  }
  
  return 'sheet.setValue(0, 0, "Formula")';
}

/**
 * 구조화된 컨텐츠가 수식 관련 데이터인지 검증
 */
export function isValidFormulaContent(structuredContent: any): structuredContent is StructuredFormulaContent {
  return (
    structuredContent &&
    typeof structuredContent === 'object' &&
    structuredContent.intent === 'excel_formula' &&
    (structuredContent.formulaSyntax || structuredContent.spreadjsCommand)
  );
}

/**
 * FormulaResponse 데이터 검증
 */
export function validateFormulaResponse(response: FormulaResponse): boolean {
  return !!(
    response.success &&
    response.formulaDetails &&
    response.formulaDetails.spreadjsCommand &&
    response.implementation &&
    response.implementation.cellLocations &&
    response.implementation.cellLocations.target
  );
}

export type { StructuredFormulaContent };