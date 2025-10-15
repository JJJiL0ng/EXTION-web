import { useGetSheetRange } from "@/_aaa_schema-converter/_sc-hook/useGetSheetRanage";
import { useGetActiveSheetName } from "@/_aaa_schema-converter/_sc-hook/useGetActiveSheetName";

interface RangeSelectorProps {
    spread: any;
    viewerType: 'source' | 'target';
}

export const RangeSelector: React.FC<RangeSelectorProps> = ({ spread, viewerType }) => {
    const [row, col, rowCount, colCount] = useGetSheetRange({ spread, viewerType });

    // 열 번호를 알파벳으로 변환 (A, B, C, ... Z, AA, AB, ...)
    const getColumnLabel = (colIndex: number): string => {
        let label = '';
        let num = colIndex;
        while (num >= 0) {
            label = String.fromCharCode(65 + (num % 26)) + label;
            num = Math.floor(num / 26) - 1;
            if (num < 0) break;
        }
        return label;
    };

    // 시작과 끝 셀 주소 계산
    const startCell = `${getColumnLabel(col)}${row + 1}`;
    const endCell = `${getColumnLabel(col + colCount - 1)}${row + rowCount}`;
    const rangeText = rowCount === 1 && colCount === 1 
        ? startCell 
        : `${startCell}:${endCell}`;

    const activeSheetName = useGetActiveSheetName({ viewerType, spread });

    return (
        <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">선택 영역:</span>
                <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md">
                    <span className="text-sm font-mono font-semibold text-blue-700">
                        {rangeText}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                    <span className="font-medium">행:</span>
                    <span className="font-mono">{rowCount}</span>
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1">
                    <span className="font-medium">열:</span>
                    <span className="font-mono">{colCount}</span>
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1">
                    <span className="font-medium">셀:</span>
                    <span className="font-mono">{rowCount * colCount}</span>
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1">
                    <span className="font-medium">시트:</span>
                    <span className="font-mono">{activeSheetName}</span>
                </span>
            </div>
        </div>
    );
};
