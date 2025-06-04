'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { validatePhoneNumber, formatPhoneNumber } from '@/lending-libs/lending-utils'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { initializeApp, getApps } from 'firebase/app'

// Firebase 설정 (이미 초기화된 앱이 있으면 재사용)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)

interface FormData {
  phone: string
}

interface FormErrors {
  phone?: string
}

export function BetaSignupForm() {
  const [formData, setFormData] = useState<FormData>({
    phone: ''
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // 전화번호 입력 처리
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '') // 숫자만 추출
    const formatted = formatPhoneNumber(value)
    
    setFormData(prev => ({ ...prev, phone: formatted }))
    
    // 실시간 유효성 검사
    if (errors.phone && validatePhoneNumber(formatted)) {
      setErrors(prev => ({ ...prev, phone: undefined }))
    }
  }

  // 폼 유효성 검사
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // 전화번호 검사
    if (!formData.phone.trim()) {
      newErrors.phone = '전화번호를 입력해주세요'
    } else if (!validatePhoneNumber(formData.phone)) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // Firestore에 베타 신청 데이터 저장
      await addDoc(collection(db, 'beta-signups'), {
        phone: formData.phone,
        createdAt: serverTimestamp(),
        source: 'landing-page',
        status: 'pending'
      })

      setIsSubmitted(true)
      
      // 성공 이벤트 트래킹 (Google Analytics 등)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'beta_signup', {
          event_category: 'engagement',
          event_label: 'landing_page_signup'
        })
      }

    } catch (error) {
      console.error('베타 신청 오류:', error)
      alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 성공 화면
  if (isSubmitted) {
    return (
      <div className="bg-white rounded-2xl p-8 max-w-md mx-auto text-center shadow-lg">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            신청이 완료되었습니다!
          </h3>
          <p className="text-gray-600">
            베타 출시 소식을 가장 먼저 알려드릴게요.<br />
            곧 연락드리겠습니다.
          </p>
        </div>
        
        <div className="space-y-3 text-sm text-gray-500">
          <p>✅ 프로 이용권 1달 무료</p>
          <p>✅ 베타 피드백 우선 반영</p>
          <p>✅ 언제든 해지 가능</p>
        </div>
      </div>
    )
  }

  // 신청 폼
  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 w-full shadow-lg">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          베타 체험 신청
        </h3>
        <p className="text-gray-600 text-center">
          출시 알림을 받고 무료 체험하세요
        </p>
      </div>

      {/* 전화번호 입력 */}
      <div className="mb-6">
        <Input
          type="tel"
          label="전화번호"
          placeholder="010 1234 5678"
          value={formData.phone}
          onChange={handlePhoneChange}
          error={errors.phone}
          maxLength={13}
          startIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          }
        />
      </div>

      {/* 제출 버튼 */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={isSubmitting}
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? '신청 중...' : '베타 체험 신청하기'}
      </Button>

      {/* 추가 안내 */}
      <p className="text-xs text-gray-500 text-center mt-4">
        신청 후 영업일 기준 1-2일 내에 연락드립니다
      </p>
    </form>
  )
}