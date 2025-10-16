//ai채팅과 유저 채팅 즉 메시지들을 랜더링하는 컴포넌트

import React from "react";

export interface ChatMessage {
    role: 'user' | 'sc-assistant';
    content: string;
}

import { useScChattingVisabliltyStore } from "@/_aaa_schema-converter/_sc-store/scChattingVisabiltyStore";
