import ChatInputBox from "./ChatInputBox";
import ChatViewer from "./ChatViewer";
import ChatTabBar from "./ChatTabBar";

export default function MainChattingContainer() {
  return (
    <div className="border-4 border-gray-200 h-full flex flex-col">
        {/* 채팅 뷰어 */}
        <div>
            <ChatTabBar />
        </div>
        <div className="flex-1 overflow-y-auto">
            <ChatViewer />
        </div>
        {/* 채팅 입력 박스 - 최하단 */}
        <div>
            <ChatInputBox />
        </div>
    </div>
  );
}
