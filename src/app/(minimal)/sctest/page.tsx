"use client";

import React from "react";
import ScContainer from "../../../_aaa_schema-converter/_sc-component/sc-container/ScCotainer";
import { FileStateProvider } from "@/_aaa_schema-converter/_sc-context/FileStateProvider";

export default function Page() {
  return (
    <FileStateProvider>
      <ScContainer />
    </FileStateProvider>
  );
}