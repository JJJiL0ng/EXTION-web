import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '개인정보 처리방침 | Extion',
  description: 'Extion 개인정보 처리방침 - 고객님의 개인정보를 안전하게 보호합니다.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">개인정보 처리방침</h1>
          <p className="text-gray-600">
            <strong>Extion</strong>(이하 &ldquo;회사&rdquo;)은 고객님의 개인정보를 중요시하며, 「개인정보 보호법」을 준수하고 있습니다.
          </p>
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-none">
          
          {/* 1. 개인정보의 처리 목적 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">1. 개인정보의 처리 목적</h2>
            <p className="text-gray-700 mb-4">회사는 다음의 목적을 위하여 개인정보를 처리합니다.</p>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">1.1 서비스 제공</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Extion AI 엑셀 도구 서비스 제공</li>
                  <li>자연어 명령 처리 및 엑셀 자동화 기능 제공</li>
                  <li>클라우드 동기화 서비스 제공</li>
                  <li>고객 지원 및 문의 응답</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">1.2 회원 관리</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>회원 가입 및 본인 확인</li>
                  <li>개인 식별, 불량 회원의 부정 이용 방지</li>
                  <li>이용약관 위반 회원에 대한 이용 제한 조치</li>
                  <li>서비스 이용 내역 통지, 서비스 개선</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">1.3 마케팅 및 광고</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>이벤트 및 광고성 정보 제공 (동의 시에만)</li>
                  <li>베타 런칭 및 프로모션 안내</li>
                  <li>서비스 업데이트 및 새로운 기능 안내</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 2. 처리하는 개인정보 항목 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">2. 처리하는 개인정보 항목</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 필수 정보</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>회원가입 시</strong>: 이메일 주소, 비밀번호</li>
                  <li><strong>베타 신청 시</strong>: 이름, 이메일 주소, 휴대폰 번호</li>
                  <li><strong>서비스 이용 시</strong>: 접속 로그, 이용 기록, 쿠키</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 선택 정보</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>프로필 정보(닉네임, 프로필 사진)</li>
                  <li>마케팅 수신 동의 여부</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 자동 수집 정보</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>IP 주소, MAC 주소, 서비스 이용 기록</li>
                  <li>접속 로그, 쿠키, 접속 기기 정보</li>
                  <li>브라우저 정보, OS 정보</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. 개인정보의 처리 및 보유기간 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">3. 개인정보의 처리 및 보유기간</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 처리기간</h3>
                <p className="text-gray-700">개인정보는 수집·이용에 관한 동의일로부터 개인정보의 수집·이용목적을 달성할 때까지 처리됩니다.</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">3.2 보유기간</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>회원정보</strong>: 회원 탈퇴 시까지</li>
                  <li><strong>서비스 이용기록</strong>: 1년</li>
                  <li><strong>베타 신청 정보</strong>: 서비스 정식 출시 후 1년</li>
                  <li><strong>접속 로그</strong>: 3개월</li>
                  <li><strong>고객 상담 기록</strong>: 3년</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">3.3 예외사항</h3>
                <p className="text-gray-700">관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관합니다.</p>
              </div>
            </div>
          </section>

          {/* 4. 개인정보의 제3자 제공 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">4. 개인정보의 제3자 제공</h2>
            <p className="text-gray-700 mb-4">회사는 원칙적으로 고객님의 개인정보를 외부에 제공하지 않습니다.</p>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 제공하는 경우</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>고객님이 사전에 동의한 경우</li>
                <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              </ul>
            </div>
          </section>

          {/* 5. 개인정보 처리의 위탁 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">5. 개인정보 처리의 위탁</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 위탁업체 및 업무</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>클라우드 서비스</strong>: AWS, Google Cloud (데이터 저장 및 백업)</li>
                  <li><strong>이메일 발송</strong>: SendGrid, Mailchimp (서비스 안내 및 마케팅)</li>
                  <li><strong>결제 처리</strong>: 토스페이먼츠, 스트라이프 (결제 및 정산)</li>
                  <li><strong>고객 지원</strong>: 채널톡, 인터컴 (고객 상담)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">5.2 위탁 관리</h3>
                <p className="text-gray-700">위탁업체와 개인정보 보호 계약을 체결하여 안전하게 관리하고 있습니다.</p>
              </div>
            </div>
          </section>

          {/* 6. 정보주체의 권리·의무 및 행사방법 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">6. 정보주체의 권리·의무 및 행사방법</h2>
            <p className="text-gray-700 mb-4">고객님은 언제든지 다음과 같은 권리를 행사할 수 있습니다.</p>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">6.1 권리 내용</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>개인정보 처리현황 통지 요구</li>
                  <li>개인정보 열람 요구</li>
                  <li>개인정보 정정·삭제 요구</li>
                  <li>개인정보 처리정지 요구</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">6.2 권리 행사 방법</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>이메일</strong>: jihong9412@gmail.com</li>
                  <li><strong>고객센터</strong>: 서비스 내 문의하기 기능 이용</li>
                  <li><strong>처리기간</strong>: 요청일로부터 10일 이내</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 7. 개인정보의 안전성 확보조치 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">7. 개인정보의 안전성 확보조치</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">7.1 기술적 보호조치</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>개인정보 암호화 저장</li>
                  <li>해킹 등에 대비한 기술적 대책</li>
                  <li>백신 소프트웨어 등을 이용한 컴퓨터바이러스 방지</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">7.2 관리적 보호조치</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>개인정보 접근 권한 제한</li>
                  <li>개인정보 취급자 교육 실시</li>
                  <li>개인정보 보호책임자 지정</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">7.3 물리적 보호조치</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>전산실, 자료보관실 등의 접근통제</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 8. 개인정보 보호책임자 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">8. 개인정보 보호책임자</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">8.1 개인정보 보호책임자</h3>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>성명</strong>: jihong lee</li>
                  <li><strong>이메일</strong>: jihong9412@gmail.com</li>
                  <li><strong>전화</strong>: 010-9412-3957</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">8.2 개인정보 보호담당자</h3>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>성명</strong>: jihong lee</li>
                  <li><strong>이메일</strong>: jihong9412@gmail.com</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 9. 쿠키의 운영 및 거부 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">9. 쿠키의 운영 및 거부</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">9.1 쿠키 사용 목적</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>서비스 이용 환경 개선</li>
                  <li>맞춤형 서비스 제공</li>
                  <li>서비스 이용 통계 분석</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">9.2 쿠키 거부 방법</h3>
                <p className="text-gray-700">브라우저 설정을 통해 쿠키를 거부할 수 있으나, 일부 서비스 이용에 제한이 있을 수 있습니다.</p>
              </div>
            </div>
          </section>

          {/* 10. 개인정보 처리방침의 변경 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">10. 개인정보 처리방침의 변경</h2>
            <p className="text-gray-700">
              본 개인정보 처리방침은 2025년 6월 6일부터 적용되며, 법령·정책 또는 보안기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 시에는 변경사항의 시행 7일 전부터 웹사이트를 통하여 고지할 것입니다.
            </p>
          </section>

          {/* 시행일자 */}
          <section className="bg-gray-50 p-6 rounded-lg">
            <div className="text-center space-y-2">
              <p className="text-gray-800"><strong>시행일자</strong>: 2025년 6월 6일</p>
              <p className="text-gray-800"><strong>최종 수정일</strong>: 2025년 6월 4일</p>
              <p className="text-gray-600 text-sm mt-4">
                본 개인정보 처리방침에 대한 문의사항이 있으시면 privacy@extion.co로 연락주시기 바랍니다.
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}