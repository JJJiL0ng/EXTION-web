"use client";

import React from "react";
import dynamic from "next/dynamic";
import { FileStateProvider } from "@/_aaa_schema-converter/_sc-context/FileStateProvider";

const ScContainer = dynamic(
  () => import("../../../_aaa_schema-converter/_sc-component/sc-container/ScCotainer"),
  { ssr: false }
);

export default function Page() {
  return (
    <FileStateProvider>
      <ScContainer />
    </FileStateProvider>
  );
}