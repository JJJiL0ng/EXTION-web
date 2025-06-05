'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { validatePhoneNumber, formatPhoneNumber, validateEmail } from '@/lending-libs/lending-utils'
import { getFirestore, collection, addDoc, serverTimestamp, doc, onSnapshot, runTransaction } from 'firebase/firestore'
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

const TOTAL_BETA_SLOTS = 100
const INITIAL_SIGNUP_COUNT = 13 // 이미 13명이 신청한 것처럼 표시

type ContactType = 'email' | 'phone'

interface FormData {
  contactType: ContactType
  email: string
  phone: string
}

interface FormErrors {
  email?: string
  phone?: string
}

export function BetaSignupForm() {
  const [formData, setFormData] = useState<FormData>({
    contactType: 'email', // 기본값을 이메일로 설정
    email: '',
    phone: ''
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [remainingSlots, setRemainingSlots] = useState<number>(TOTAL_BETA_SLOTS - INITIAL_SIGNUP_COUNT)
  const [isLoading, setIsLoading] = useState(true)

  // 실시간으로 남은 인원 수 조회
  useEffect(() => {
    const counterDocRef = doc(db, 'counters', 'beta-signups')
    
    const unsubscribe = onSnapshot(counterDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        const currentCount = data?.count || 0
        // 초기 카운트를 포함하여 계산
        const totalCount = INITIAL_SIGNUP_COUNT + currentCount
        setRemainingSlots(Math.max(0, TOTAL_BETA_SLOTS - totalCount))
      } else {
        setRemainingSlots(TOTAL_BETA_SLOTS - INITIAL_SIGNUP_COUNT)
      }
      setIsLoading(false)
    }, (error) => {
      console.error('카운터 조회 오류:', error)
      setRemainingSlots(TOTAL_BETA_SLOTS - INITIAL_SIGNUP_COUNT)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // 연락 방법 변경 처리
  const handleContactTypeChange = (type: ContactType) => {
    setFormData(prev => ({ ...prev, contactType: type }))
    // 변경 시 에러 초기화
    setErrors({})
  }

  // 이메일 입력 처리
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, email: value }))
    
    // 실시간 유효성 검사
    if (errors.email && validateEmail(value)) {
      setErrors(prev => ({ ...prev, email: undefined }))
    }
  }

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

    if (formData.contactType === 'email') {
      // 이메일 검사
      if (!formData.email.trim()) {
        newErrors.email = '이메일을 입력해주세요'
      } else if (!validateEmail(formData.email)) {
        newErrors.email = '올바른 이메일 형식이 아닙니다'
      }
    } else {
      // 전화번호 검사
      if (!formData.phone.trim()) {
        newErrors.phone = '전화번호를 입력해주세요'
      } else if (!validatePhoneNumber(formData.phone)) {
        newErrors.phone = '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    // 인원이 다 찬 경우 체크
    if (remainingSlots <= 0) {
      alert('베타 테스트 인원이 모두 찼습니다. 다음 기회를 기다려주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      // 트랜잭션을 사용하여 카운터와 신청 데이터를 원자적으로 업데이트
      await runTransaction(db, async (transaction) => {
        const counterDocRef = doc(db, 'counters', 'beta-signups')
        const counterDoc = await transaction.get(counterDocRef)
        
        let currentCount = 0
        if (counterDoc.exists()) {
          currentCount = counterDoc.data().count || 0
        }
        
        // 실제 총 신청자 수 계산 (초기 카운트 포함)
        const totalCount = INITIAL_SIGNUP_COUNT + currentCount
        
        // 인원이 다 찬 경우 다시 체크
        if (totalCount >= TOTAL_BETA_SLOTS) {
          throw new Error('베타 테스트 인원이 모두 찼습니다.')
        }
        
        // 베타 신청 데이터 추가
        const signupData = {
          contactType: formData.contactType,
          ...(formData.contactType === 'email' 
            ? { email: formData.email } 
            : { phone: formData.phone }
          ),
          createdAt: serverTimestamp(),
          source: 'landing-page',
          status: 'pending',
          slotNumber: totalCount + 1 // 실제 순번 (초기 카운트 포함)
        }
        
        const betaSignupsRef = collection(db, 'beta-signups')
        const newSignupRef = doc(betaSignupsRef)
        transaction.set(newSignupRef, signupData)
        
        // 카운터 업데이트 (실제 신청자만 카운트)
        transaction.set(counterDocRef, { 
          count: currentCount + 1,
          lastUpdated: serverTimestamp()
        }, { merge: true })
      })

      setIsSubmitted(true)
      
      // 성공 이벤트 트래킹 (Google Analytics 등)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'beta_signup', {
          event_category: 'engagement',
          event_label: 'landing_page_signup',
          contact_type: formData.contactType,
          remaining_slots: remainingSlots - 1
        })
      }

    } catch (error) {
      console.error('베타 신청 오류:', error)
      if (error instanceof Error && error.message.includes('모두 찼습니다')) {
        alert(error.message)
      } else {
        alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
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

      {/* 한정인원 표시 */}
      <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border-2 border-red-200">
        <div className="flex items-center justify-center gap-2 mb-2">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold text-red-700">한정 모집</span>
        </div>
        
        {isLoading ? (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
            <p className="text-sm text-gray-600 mt-1">확인 중...</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-2xl font-bold text-red-600">{remainingSlots}</span>
              <span className="text-sm text-gray-600">/ {TOTAL_BETA_SLOTS}명</span>
            </div>
            <p className="text-xs text-gray-600">
              {remainingSlots > 0 ? '베타 테스터 남은 자리' : '모집이 완료되었습니다'}
            </p>
          </div>
        )}
      </div>

      {/* 연락 방법 선택 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          연락 방법을 선택해주세요
        </label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => handleContactTypeChange('email')}
            disabled={remainingSlots <= 0}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
              remainingSlots <= 0 
                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                : formData.contactType === 'email'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            이메일
          </button>
          <button
            type="button"
            onClick={() => handleContactTypeChange('phone')}
            disabled={remainingSlots <= 0}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
              remainingSlots <= 0 
                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                : formData.contactType === 'phone'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            전화번호
          </button>
        </div>
      </div>

      {/* 이메일 또는 전화번호 입력 */}
      <div className="mb-6">
        {formData.contactType === 'email' ? (
          <Input
            type="email"
            label="이메일"
            placeholder="example@email.com"
            value={formData.email}
            onChange={handleEmailChange}
            error={errors.email}
            disabled={remainingSlots <= 0}
            startIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />
        ) : (
          <Input
            type="tel"
            label="전화번호"
            placeholder="010 1234 5678"
            value={formData.phone}
            onChange={handlePhoneChange}
            error={errors.phone}
            maxLength={13}
            disabled={remainingSlots <= 0}
            startIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            }
          />
        )}
      </div>

      {/* 개인정보 보호 안내 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-1a2 2 0 00-2-2H6a2 2 0 00-2 2v1a2 2 0 002 2zM12 10V7a4 4 0 00-8 0v3m0 0v3h8V10H4z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">개인정보 보호</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• 입력하신 연락처는 베타 테스트 안내 목적으로만 사용됩니다</p>
              <p>• 마케팅 목적의 무단 사용은 하지 않습니다</p>
              <p>• 언제든지 개인정보 삭제를 요청하실 수 있습니다</p>
              <p>• 개인정보는 암호화되어 안전하게 보관되고 1개월 이후 자동 삭제됩니다</p>
            </div>
          </div>
        </div>
      </div>

      {/* 제출 버튼 */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={isSubmitting}
        disabled={isSubmitting || remainingSlots <= 0}
        className="w-full"
      >
        {isSubmitting 
          ? '신청 중...' 
          : remainingSlots <= 0 
          ? '모집 완료' 
          : '베타 체험 신청하기'
        }
      </Button>

      {/* 추가 안내 */}
      <p className="text-xs text-gray-500 text-center mt-4">
        {remainingSlots > 0 
          ? '신청 후 영업일 기준 1-2일 내에 연락드립니다'
          : '다음 베타 모집 소식을 받으시려면 이메일을 남겨주세요'
        }
      </p>
    </form>
  )
}