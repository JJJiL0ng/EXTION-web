// app/providers.tsx (새로 만들기)
'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PHProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
            posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
                api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
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