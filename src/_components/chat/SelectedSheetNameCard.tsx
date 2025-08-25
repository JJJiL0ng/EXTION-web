import React, { use } from 'react';
import { useGetActiveSheetName } from '@/_hooks/sheet/useGetActiveSheetName'
import { File } from 'lucide-react';

export const SelectedSheetNameCard: React.FC<{ 
  showIcon?: boolean;
  spreadRef?: React.MutableRefObject<any> | React.RefObject<any> | null;
  fileName?: string;
}> = ({
  showIcon = true,
  spreadRef: propSpreadRef,
  fileName,
}) => {
  
  // props로 받은 spreadRef가 있으면 우선 사용, 없으면 context에서 가져온 것 사용
  const spreadRef = propSpreadRef || null;

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
      <File size={16} className={`mr-1 text-gray-700`} />
      )}
      <span className={`text-gray-700`}>
        {fileName}
      </span>
    </div>
  );
};

export default SelectedSheetNameCard;