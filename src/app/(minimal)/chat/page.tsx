'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChatBoxOnly } from '@/components/chatbox';
import useTableGenerate from '@/hooks/useTablegenerate';
import { useAuthStore } from '@/stores/authStore';

// DashboardClient.tsx 에서 가져온 타입. 나중에 전역 타입으로 옮기는 것 고려
interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

const ChatPage = () => {
  const { user: authUser } = useAuthStore();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  const router = useRouter();
  const { generateTable } = useTableGenerate();

  const handleSend = (message: string) => {
    console.log('[ChatPage] handleSend 호출됨, 메시지:', message);
    const userId = authUser?.uid;

    if (!message.trim() && uploadedFiles.length === 0) {
      alert('메시지를 입력하거나 파일을 업로드해주세요.');
      return;
    }
    
    if (!userId) {
      alert('테이블을 생성하려면 로그인이 필요합니다.');
      // 혹은 로그인 페이지로 리디렉션
      router.push('/login');
      return;
    }
    
    const filesToUpload = uploadedFiles.map(f => f.file);

    generateTable({
      userId,
      message: message,
      files: filesToUpload,
      webSearchEnabled: isSearchActive,
    });
    
    router.push('/table-generate');
  };

  const handleUpload = () => {
    console.log('파일 업로드');
    // 실제 파일 업로드 로직 구현 필요
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-full w-[60%] mx-auto">
        <ChatBoxOnly 
          onSend={handleSend}
          onUpload={handleUpload}
          onSearch={() => setIsSearchActive(!isSearchActive)}
          uploadedFiles={uploadedFiles}
          onFilesChange={setUploadedFiles}
          isSearchActive={isSearchActive}
        />
      </div>
    </div>
  );
};

export default ChatPage;