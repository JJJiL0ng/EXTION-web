"use client";

import React, { useState, useEffect } from "react"
import { useScChattingVisabliltyStore } from "@/_aaa_schema-converter/_sc-store/scChattingVisabiltyStore";


export default function ScChatting() {
  const { scChattingVisablilty, setScChattingVisablilty } = useScChattingVisabliltyStore();
  return (
    <div >
        <h1> 채팅 영역</h1>
    </div>
  );
}   