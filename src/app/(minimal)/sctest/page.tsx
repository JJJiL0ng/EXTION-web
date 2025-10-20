"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { FileStateProvider } from "@/_aaa_schema-converter/_sc-context/FileStateProvider";
import useUserIdStore from "@/_aaa_sheetChat/_aa_superRefactor/store/user/userIdStore";
import { useRouter } from "next/navigation";



const ScContainer = dynamic(
  () => import("../../../_aaa_schema-converter/_sc-component/sc-container/ScCotainer"),
  { ssr: false }
);

export default function Page() {
  const router = useRouter();
  const userId = useUserIdStore((state) => state.userId);
  useEffect(() => {
    if (!userId) {
      console.log('⚠️ [TryPage] userId 없음 - /invite-check로 리다이렉트');
      router.push('/invite-check');
      return;
    }

    console.log('✅ [TryPage] userId 존재:', userId);
  }, [userId, router]);
  
  return (
    <FileStateProvider>
      <ScContainer />
    </FileStateProvider>
  );
}