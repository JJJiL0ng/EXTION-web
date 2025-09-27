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
                    className="flex items-center gap-1 px-2 py-0 text-sm text-white rounded transition-colors duration-200"
                    style={{ backgroundColor: '#005ed9' }}
                    onClick={handleOpenChatSection}
                >
                    <img src="/EXTION_new_logo_white.svg" alt="Extion Logo" className="w-4 h-4" />
                    Extion 
                </button>
    )
}