"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useVerifyInviteCode } from "@/_invite/_hook/useVerifyInviteCode";

const MAX_ATTEMPTS = 5;

export default function InviteCheck() {
    const router = useRouter();
    const { verify, isLoading } = useVerifyInviteCode();
    const [code, setCode] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [attempts, setAttempts] = useState(0);

    const handleCheck = async () => {
        // 이미 로딩 중이면 중복 요청 방지
        if (isLoading) {
            return;
        }

        if (attempts >= MAX_ATTEMPTS) {
            setMessage("Maximum attempts exceeded. Please refresh the page.");
            return;
        }

        const trimmed = code.trim();
        if (!trimmed) {
            setMessage("Please enter a code.");
            return;
        }

        setAttempts((prev) => prev + 1);
        setMessage(null);

        try {
            const result = await verify(trimmed);

            if (result && result.success) {
                router.push("/sctest");
            } else {
                setMessage(`Invalid invite code. (${attempts + 1}/${MAX_ATTEMPTS})`);
                setCode("");
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An error occurred.";
            setMessage(`${errorMessage} (${attempts + 1}/${MAX_ATTEMPTS})`);
            setCode("");
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-4 sm:p-4 font-sans" style={{ backgroundColor: '#EEF2F6' }}>
            <div className="w-full max-w-md sm:max-w-sm">
                <div className="bg-[#EEF2F6] border-2 border-dashed border-gray-400 rounded sm:rounded p-6 sm:p-6">
                    {/* 로고 영역 */}
                    <div className="text-center mb-4 sm:mb-6 pt-6">
                        <Image 
                            src="/extion-small-blue.svg" 
                            alt="Extion Logo" 
                            width={100}
                            height={33}
                            className="mx-auto sm:w-[120px] sm:h-[40px]"
                        />
                    </div>

                    {/* 제목 및 설명 */}
                    <div className="text-center mb-4 sm:mb-6">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1.5 sm:mb-2">
                            Invite Code Verification
                        </h1>
                   
                    </div>

                    {/* 입력 영역 */}
                    <div className="space-y-2 sm:space-y-2 mb-3 sm:mb-4">
                        <input
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Enter your invite code"
                            disabled={isLoading || attempts >= MAX_ATTEMPTS}
                            className="w-full px-2 py-2 sm:px-4 sm:py-3 text-sm sm:text-base rounded-md sm:rounded border-2 border-gray-200 
                                     focus:border-[#0b5fff] focus:ring-2 focus:ring-blue-100 
                                     outline-none transition-all duration-200
                                     disabled:bg-gray-100 disabled:cursor-not-allowed
                                     placeholder:text-gray-400"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !isLoading && attempts < MAX_ATTEMPTS) {
                                    handleCheck();
                                }
                            }}
                        />
                        
                        <button
                            onClick={handleCheck}
                            disabled={isLoading || attempts >= MAX_ATTEMPTS}
                            className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base font-semibold rounded-md sm:rounded-lg 
                                     text-white bg-[#005de9] hover:bg-[#0a52e6] 
                                     active:scale-98 transition-all duration-200
                                     disabled:bg-gray-300 disabled:cursor-not-allowed
                                     shadow-md hover:shadow-lg"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    Verifying...
                                </span>
                            ) : "Verify"}
                        </button>
                    </div>

                    {/* 시도 횟수 경고 */}
                    {attempts >= MAX_ATTEMPTS && (
                        <div className="p-2.5 sm:p-3 bg-orange-50 border-l-3 border-orange-400 rounded-md">
                            <p className="text-orange-700 text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
                                <span className="text-sm">⚠️</span>
                                <span>Maximum attempts ({MAX_ATTEMPTS}) reached.</span>
                            </p>
                            <p className="text-orange-600 text-[10px] sm:text-xs mt-0.5 sm:mt-1 ml-5 sm:ml-6">
                                Please refresh the page.
                            </p>
                        </div>
                    )}

                    {/* 에러 메시지 */}
                    {message && (
                        <div className="p-2.5 sm:p-3 bg-red-50 border-l-3 border-red-400 rounded">
                            <p className="text-red-800 text-xs sm:text-sm font-medium">
                                {message}
                            </p>
                        </div>
                    )}

                    {/* 진행 상황 표시: (removed duplicate small counter - only max-attempts warning shown) */}
                </div>

                {/* 하단 도움말 */}
                <div className="mt-3 sm:mt-4">
                    <div className="bg-gradient-to-r from-[#5865F2] to-[#7289DA] rounded-md sm:rounded-lg p-6 sm:p-4 text-white shadow-md">
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="white"/>
                            </svg>
                            <h3 className="text-sm sm:text-base font-bold">Don&apos;t have an invite code?</h3>
                        </div>
                        <p className="text-center text-[10px] sm:text-xs mb-2 sm:mb-3 text-blue-100">
                            Join our Discord community to get your invite code!
                        </p>
                        <a
                            href="https://discord.gg/4BS9TxG8MA"
                            onClick={(e) => {
                                e.preventDefault();
                                window.open(
                                    "https://discord.gg/4BS9TxG8MA",
                                    "_blank",
                                    "noopener,noreferrer,width=900,height=700"
                                );
                            }}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full bg-white text-[#5865F2] font-semibold py-2 sm:py-2.5 px-3 sm:px-4 rounded-md
                                     hover:bg-gray-100 transition-all duration-200 text-center text-xs sm:text-sm
                                     shadow-sm hover:shadow-md active:scale-95"
                        >
                            Join Discord Community →
                        </a>
                    </div>
                </div>
            </div>
        </main>
    );
}
