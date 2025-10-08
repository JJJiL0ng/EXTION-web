import React from "react";

const ChatOpenButtonProps = {
    isClicked: false,
    isChatOpen: false,
    onClick: () => {}
}

export default function ChatOpenButton() {
    const handleOpenChatSection = () => {
    }
    return (
        <button
                    className="flex items-center gap-1 px-2 py-1 text-sm text-white rounded transition-colors duration-200 h-6"
                    style={{ backgroundColor: '#005de9' }}
                    onClick={handleOpenChatSection}
                >
                    <img src="/extion-small-white.svg" alt="Extion Logo" className="w-4 h-4" />
                    Extion 
                </button>
    )
}