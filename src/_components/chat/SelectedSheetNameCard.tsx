import React, { use } from 'react';
import { useSpreadsheetUploadStore } from '../../_store/sheet/spreadsheetUploadStore';
import { useGetActiveSheetName } from '@/_hooks/sheet/useGetActiveSheetName'
import { Eye } from 'lucide-react';
import {useSpreadsheetContext} from '@/_contexts/SpreadsheetContext';

export const SelectedSheetNameCard: React.FC<{ 
  showIcon?: boolean;
  spreadRef?: React.MutableRefObject<any> | React.RefObject<any> | null;
}> = ({
  showIcon = true,
  spreadRef: propSpreadRef,
}) => {
  // const { isFileUploaded, uploadedFileName } = useSpreadsheetUploadStore();
  
  // props로 받은 spreadRef가 있으면 우선 사용, 없으면 context에서 가져온 것 사용
  // const spreadRef = propSpreadRef || null;

  const spreadRef = useSpreadsheetContext().spreadRef;

  // Hook은 항상 최상위에서 호출되어야 함
  const { activeSheetName } = useGetActiveSheetName({ spreadRef });

  if (!spreadRef) {
    console.error('No spreadRef provided');
    return null;
  }

  return (  
    //현재 border 컬러가 적용이 안되는 에러가 있음 추후 확인해야함 : todo
    <div
      className="inline-flex items-center px-2 py-1 bg-white border border-gray-300 text-xs font-medium rounded-lg"
    >
      {showIcon && (
      <Eye size={16} className={`mr-1 text-gray-700`} />
      )}
      <span className={`text-gray-700`}>
        {/* {uploadedFileName} */}
        {/* {activeSheetName && (
          <>
            <span className="mx-1">·</span>
            <span>{activeSheetName}</span>
          </>
        )} */}
        {activeSheetName}
      </span>
    </div>
  );
};

export default SelectedSheetNameCard;