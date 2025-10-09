// app/providers.tsx
'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PHProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
            posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
                api_host: '/ingest', // ⭐ 여기 변경!
                ui_host: 'https://us.posthog.com', // ⭐ 추가!
                capture_pageview: true,
                capture_pageleave: true, 

                // 세션 레코딩
                session_recording: {
                    maskAllInputs: false,
                    maskTextSelector: '.sensitive',
                },
            })
        }
    }, [])

    return <PostHogProvider client={posthog}>
        {children}
    </PostHogProvider>
}