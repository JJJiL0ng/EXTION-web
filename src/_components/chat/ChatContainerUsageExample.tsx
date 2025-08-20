// // src/_components/chat/ChatContainerUsageExample.tsx
// // 채팅 컨테이너 사용 예시

// import React from 'react';
// import { ChatInitMode, UploadedFileInfo } from '../../_types/chat.types';
// import MainChattingContainer from './MainChattingContainer';
// import FileUploadChattingContainer from './FileUploadChattingContainer';

// // 사용 예시 컴포넌트들

// // 1. 빈 시트에서 시작하는 채팅
// export const BlankSheetChatExample: React.FC = () => {
//   return (
//     <MainChattingContainer
//       initMode={ChatInitMode.BLANK_SHEET}
//       userId="user_123"
//     />
//   );
// };

// // 2. 기존 채팅 불러오기
// export const ExistingChatExample: React.FC = () => {
//   return (
//     <MainChattingContainer
//       initMode={ChatInitMode.EXISTING_CHAT}
//       userId="user_123"
//     />
//   );
// };

// // 3. 파일 업로드 후 채팅 (올바른 사용법)
// export const FileUploadChatExample: React.FC = () => {
//   // 파일 업로드 후 생성된 정보
//   const fileInfo: UploadedFileInfo = {
//     fileName: 'sales_data.xlsx',
//     fileSize: 1024000, // 1MB
//     fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//     spreadSheetId: 'sheet_abc123',
//     uploadedAt: new Date().toISOString()
//   };

//   return (
//     <FileUploadChattingContainer
//       initMode={ChatInitMode.FILE_UPLOAD} // 기본값이므로 생략 가능
//       fileInfo={fileInfo}
//       spreadSheetId="sheet_abc123"
//       userId="user_123"
//     />
//   );
// };

// // 4. fileInfo 없이 파일 업로드 컨테이너 사용 (폴백 처리됨)
// export const FileUploadWithoutInfoExample: React.FC = () => {
//   return (
//     <FileUploadChattingContainer
//       initMode={ChatInitMode.FILE_UPLOAD}
//       // fileInfo가 없음 - BLANK_SHEET 모드로 폴백됨
//       userId="user_123"
//     />
//   );
// };

// // 5. 조건부 컨테이너 사용
// interface ConditionalChatProps {
//   hasFile: boolean;
//   fileInfo?: UploadedFileInfo;
//   userId: string;
// }

// export const ConditionalChat: React.FC<ConditionalChatProps> = ({
//   hasFile,
//   fileInfo,
//   userId
// }) => {
//   if (hasFile && fileInfo) {
//     return (
//       <FileUploadChattingContainer
//         fileInfo={fileInfo}
//         spreadSheetId={fileInfo.spreadSheetId}
//         userId={userId}
//       />
//     );
//   }

//   return (
//     <MainChattingContainer
//       initMode={ChatInitMode.BLANK_SHEET}
//       userId={userId}
//     />
//   );
// };

// // 6. 완전한 파일 업로드 플로우 시뮬레이션
// export const FileUploadFlowExample: React.FC = () => {
//   const [fileInfo, setFileInfo] = React.useState<UploadedFileInfo | null>(null);
//   const [isUploading, setIsUploading] = React.useState(false);

//   const handleFileUpload = async (file: File) => {
//     setIsUploading(true);
    
//     try {
//       // 파일 업로드 시뮬레이션
//       await new Promise(resolve => setTimeout(resolve, 2000));
      
//       // 업로드 완료 후 fileInfo 생성
//       const uploadedFileInfo: UploadedFileInfo = {
//         fileName: file.name,
//         fileSize: file.size,
//         fileType: file.type,
//         spreadSheetId: `sheet_${Date.now()}`,
//         uploadedAt: new Date().toISOString()
//       };
      
//       setFileInfo(uploadedFileInfo);
//     } catch (error) {
//       console.error('File upload failed:', error);
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   if (isUploading) {
//     return (
//       <div className="flex items-center justify-center h-full">
//         <div className="text-center">
//           <div className="text-lg font-medium mb-2">파일을 업로드하고 있습니다...</div>
//           <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
//         </div>
//       </div>
//     );
//   }

//   if (fileInfo) {
//     return (
//       <FileUploadChattingContainer
//         fileInfo={fileInfo}
//         spreadSheetId={fileInfo.spreadSheetId}
//         userId="user_123"
//       />
//     );
//   }

//   return (
//     <div className="flex items-center justify-center h-full">
//       <div className="text-center">
//         <div className="text-lg font-medium mb-4">파일을 업로드해주세요</div>
//         <input
//           type="file"
//           onChange={(e) => {
//             const file = e.target.files?.[0];
//             if (file) {
//               handleFileUpload(file);
//             }
//           }}
//           accept=".xlsx,.xls,.csv"
//           className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
//         />
//       </div>
//     </div>
//   );
// };