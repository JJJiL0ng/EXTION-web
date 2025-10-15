import React from 'react';
import { useIsMappingReady } from '@/_aaa_schema-converter/_sc-hook/useIsMappingReady';
import { useSourceSheetRangeStore } from '@/_aaa_schema-converter/_sc-store/sourceSheetRangeStore';
import { useTargetSheetRangeStore } from '@/_aaa_schema-converter/_sc-store/targetSheetRangeStore';

interface MappingStartButtonProps {
    onStartMapping?: () => void;
}

export const MappingStartButton: React.FC<MappingStartButtonProps> = ({ onStartMapping }) => {
    const isMappingReady = useIsMappingReady();
    const sourceRange = useSourceSheetRangeStore((state) => state.sourceRange);
    const targetRange = useTargetSheetRangeStore((state) => state.targetRange);

    if (!isMappingReady) {
        return null;
    }

    const handleStartMapping = () => {
        console.log('매핑 시작:', {
            sourceRange: {
                row: sourceRange[0],
                col: sourceRange[1],
                rowCount: sourceRange[2],
                colCount: sourceRange[3]
            },
            targetRange: {
                row: targetRange[0],
                col: targetRange[1],
                rowCount: targetRange[2],
                colCount: targetRange[3]
            }
        });

        if (onStartMapping) {
            onStartMapping();
        }
    };

    return (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="bg-white rounded-lg shadow-2xl border-2 border-blue-500 p-6 animate-fade-in">
                <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                        영역 선택 완료 ✓
                    </h3>
                    <p className="text-sm text-gray-600">
                        소스와 타겟 영역이 모두 선택되었습니다.
                    </p>
                </div>
                
                <button
                    onClick={handleStartMapping}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                    매핑 시작
                </button>
                
                <div className="mt-3 text-xs text-gray-500 text-center">
                    <div>소스: {sourceRange[2]}행 × {sourceRange[3]}열</div>
                    <div>타겟: {targetRange[2]}행 × {targetRange[3]}열</div>
                </div>
            </div>
        </div>
    );
};
