'use client'

import { useState } from 'react'
import { reviewsData, type ReviewData } from '../data/review'

// 별점 표시 컴포넌트
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? 'text-yellow-400' : 'text-gray-300'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// 개별 리뷰 카드 컴포넌트
function ReviewCard({ review }: { review: ReviewData }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 hover:shadow-md transition-shadow duration-300 h-48 md:h-56 flex flex-col">
      <div className="flex items-start gap-3 md:gap-4 flex-1">
        {/* 프로필 아바타 */}
        <div className="w-10 md:w-12 h-10 md:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-base md:text-lg flex-shrink-0">
          {review.name.charAt(0)}
        </div>
        
        <div className="flex-1 flex flex-col h-full">
          {/* 사용자 정보 */}
          <div className="flex items-center gap-2 mb-1 md:mb-2">
            <h3 className="font-semibold text-gray-900 text-sm md:text-base">{review.name}</h3>
            <span className="text-xs md:text-sm text-gray-500">|</span>
            <span className="text-xs md:text-sm text-gray-600">{review.role}</span>
          </div>
          
          {/* 별점 */}
          <div className="mb-2 md:mb-3">
            <StarRating rating={review.rating} />
          </div>
          
          {/* 리뷰 내용 - 자연스러운 배치 */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1">
              <p 
                className="text-gray-700 leading-relaxed mb-2 md:mb-3 text-sm md:text-base"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                "{review.comment}"
              </p>
            </div>
            
            {/* Before/After 또는 시간 단축 정보 - 간격 줄임 */}
            <div>
              {review.beforeAfter ? (
                <div className="bg-gray-50 rounded-lg p-2 md:p-3 space-y-1 md:space-y-2">
                  <div className="text-xs md:text-sm">
                    <span className="text-red-600 font-medium">전:</span>{' '}
                    <span className="text-gray-600">{review.beforeAfter.before}</span>
                  </div>
                  <div className="text-xs md:text-sm">
                    <span className="text-green-600 font-medium">후:</span>{' '}
                    <span className="text-gray-600">{review.beforeAfter.after}</span>
                  </div>
                </div>
              ) : review.timeReduction ? (
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium">
                  <svg className="w-3 md:w-4 h-3 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  {review.timeReduction}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 통계 정보 컴포넌트
function ReviewStats() {
  return (
    <div className="grid grid-cols-3 gap-2 md:gap-6 mb-8 md:mb-12 px-2">
      {/* 전체 평점 */}
      <div className="text-center">
        <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 mb-1 md:mb-2">
          <StarRating rating={Math.floor(reviewsData.overallRating)} />
          <div className="flex items-center gap-1">
            <span className="text-lg md:text-2xl font-bold text-gray-900">
              {reviewsData.overallRating}
            </span>
            <span className="text-gray-500 text-xs md:text-base">/5.0</span>
          </div>
        </div>
        <p className="text-xs md:text-sm text-gray-600 leading-tight">
          {reviewsData.totalReviews.toLocaleString()}명의<br className="md:hidden" /> 사용자 평가
        </p>
      </div>
      
      {/* 평균 시간 단축 */}
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1 md:mb-2">
          {reviewsData.averageTimeReduction}
        </div>
        <p className="text-xs md:text-sm text-gray-600 leading-tight">
          평균 작업시간<br className="md:hidden" /> 단축
        </p>
      </div>
      
      {/* 실시간 사용자 */}
      <div className="text-center">
        <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 mb-1 md:mb-2">
          <div className="w-2 md:w-3 h-2 md:h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-lg md:text-2xl font-bold text-gray-900">
            {reviewsData.activeUsers}명
          </span>
        </div>
        <p className="text-xs md:text-sm text-gray-600 leading-tight">
          지금 이 순간<br className="md:hidden" /> 사용 중
        </p>
      </div>
    </div>
  )
}

// 메인 리뷰 컨텐츠 컴포넌트
export function ReviewContent() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [mobileCurrentReview, setMobileCurrentReview] = useState(0)
  const reviewsPerPage = 3
  const totalSlides = Math.ceil(reviewsData.reviews.length / reviewsPerPage)
  const totalReviews = reviewsData.reviews.length

  const getCurrentReviews = () => {
    const start = currentSlide * reviewsPerPage
    const end = start + reviewsPerPage
    return reviewsData.reviews.slice(start, end)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
  }

  const nextMobileReview = () => {
    setMobileCurrentReview((prev) => (prev + 1) % totalReviews)
  }

  const prevMobileReview = () => {
    setMobileCurrentReview((prev) => (prev - 1 + totalReviews) % totalReviews)
  }

  return (
    <div>
      {/* 섹션 헤더 - 모바일 최적화 */}
      <div className="text-center mb-8 md:mb-12">
        {/* 모바일: 타이틀과 서브타이틀을 한줄로, 작은 글자 */}
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 md:mb-4">
          <span className="text-blue-600">{reviewsData.title}</span>{' '}
          <span className="block sm:inline">{reviewsData.subtitle}</span>
        </h2>
        {/* 모바일: 디스크립션 크기 줄이고 마진 조정 */}
        <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
          {reviewsData.description}
        </p>
      </div>

      {/* 통계 정보 */}
      <ReviewStats />

      {/* 리뷰 카드들 - 컴팩트한 높이 컨테이너 */}
      <div className="relative">
        {/* 데스크톱: 3개씩 그리드 */}
        <div className="hidden md:block">
          <div className="grid grid-cols-3 gap-6 mb-8 min-h-[14rem]">
            {getCurrentReviews().map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          {/* 데스크톱 네비게이션 */}
          {totalSlides > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={prevSlide}
                className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                aria-label="이전 리뷰 그룹"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* 페이지 인디케이터 */}
              <div className="flex gap-2">
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentSlide ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    aria-label={`${index + 1}번째 그룹으로 이동`}
                  />
                ))}
              </div>
              
              <button
                onClick={nextSlide}
                className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                aria-label="다음 리뷰 그룹"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* 모바일: 1개씩 표시 - 컴팩트한 높이 */}
        <div className="md:hidden">
          <div className="mb-8 min-h-[12rem]">
            <ReviewCard review={reviewsData.reviews[mobileCurrentReview]} />
          </div>

          {/* 모바일 네비게이션 */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={prevMobileReview}
              className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="이전 리뷰"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* 모바일 페이지 인디케이터 */}
            <div className="flex gap-2">
              {reviewsData.reviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setMobileCurrentReview(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === mobileCurrentReview ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  aria-label={`${index + 1}번째 리뷰로 이동`}
                />
              ))}
            </div>
            
            <button
              onClick={nextMobileReview}
              className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="다음 리뷰"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* 모바일 리뷰 카운터 */}
          <div className="text-center mt-4">
            <span className="text-sm text-gray-500">
              {mobileCurrentReview + 1} / {totalReviews}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
