import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '이용약관 | Extion',
  description: 'Extion 서비스 이용약관 - AI 엑셀 자동화 도구 서비스 이용에 관한 약관입니다.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">이용약관</h1>
          <p className="text-gray-600">
            <strong>Extion</strong> 서비스 이용약관에 오신 것을 환영합니다.
          </p>
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-none">
          
          {/* 제1조 (목적) */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">제1조 (목적)</h2>
            <p className="text-gray-700">
              본 약관은 Extion(이하 &ldquo;회사&rdquo;)이 제공하는 AI 엑셀 자동화 도구 서비스(이하 &ldquo;서비스&rdquo;)의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          {/* 제2조 (정의) */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">제2조 (정의)</h2>
            <p className="text-gray-700 mb-4">본 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
            
            <div className="space-y-3 text-gray-700">
              <div><strong>1. &ldquo;서비스&rdquo;</strong>: 회사가 제공하는 Extion AI 엑셀 자동화 도구 및 관련 서비스</div>
              <div><strong>2. &ldquo;이용자&rdquo;</strong>: 본 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원</div>
              <div><strong>3. &ldquo;회원&rdquo;</strong>: 회사에 개인정보를 제공하여 회원등록을 한 자</div>
              <div><strong>4. &ldquo;자연어 명령&rdquo;</strong>: 이용자가 일상 언어로 입력하는 엑셀 작업 지시사항</div>
              <div><strong>5. &ldquo;AI 처리&rdquo;</strong>: 자연어를 분석하여 엑셀 작업을 자동으로 수행하는 기능</div>
            </div>
          </section>

          {/* 제3조 (약관의 효력 및 변경) */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">제3조 (약관의 효력 및 변경)</h2>
            <div className="space-y-4 text-gray-700">
              <div><strong>1.</strong> 본 약관은 서비스 화면에 게시하여 공시합니다.</div>
              <div><strong>2.</strong> 회사는 관련법을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</div>
              <div><strong>3.</strong> 약관이 변경되는 경우, 변경된 약관의 적용일자 및 개정사유를 명시하여 적용일자 7일 이전부터 공지합니다.</div>
              <div><strong>4.</strong> 변경된 약관에 동의하지 않을 권리가 있으며, 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</div>
            </div>
          </section>

          {/* 제4조 (서비스의 제공) */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">제4조 (서비스의 제공)</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 제공 서비스</h3>
                <p className="text-gray-700 mb-3">회사는 다음과 같은 서비스를 제공합니다:</p>
                <ul className="list-decimal pl-6 space-y-2 text-gray-700">
                  <li><strong>자연어 엑셀 자동화</strong>: &ldquo;정렬해줘&rdquo;, &ldquo;차트 만들어줘&rdquo; 등의 명령어로 엑셀 작업 자동 실행</li>
                  <li><strong>표 자동 정리</strong>: 데이터 정리, 중복 제거, 표 스타일 적용</li>
                  <li><strong>시각화 기능</strong>: 데이터 분석 후 적절한 그래프 자동 생성</li>
                  <li><strong>멀티플랫폼 지원</strong>: 웹, Windows, macOS, Google Sheets, Microsoft 365 지원</li>
                  <li><strong>클라우드 동기화</strong>: 모든 디바이스 간 실시간 데이터 동기화</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">6.2 이용 시간</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>서비스는 연중무휴, 1일 24시간 제공됩니다</li>
                  <li>단, 시스템 점검 등의 사유로 서비스가 일시 중단될 수 있습니다</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">6.3 서비스 요금</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>무료 버전과 유료 프로 버전을 제공합니다</li>
                  <li>프로 버전 정가: 월 12,900원 (베타 기간 할인 적용)</li>
                  <li>요금제 변경 시 즉시 적용됩니다</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 제7조 (이용자의 의무) */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">제7조 (이용자의 의무)</h2>
            <p className="text-gray-700 mb-4">이용자는 다음 행위를 하여서는 안 됩니다:</p>
            
            <ul className="list-decimal pl-6 space-y-2 text-gray-700">
              <li>타인의 개인정보 도용 또는 허위 정보 입력</li>
              <li>회사가 게시한 정보의 변경</li>
              <li>서비스의 안정적 운영을 방해하는 행위</li>
              <li>다른 이용자의 서비스 이용을 방해하거나 정보를 도용하는 행위</li>
              <li>컴퓨터 바이러스, 악성코드 등을 유포하는 행위</li>
              <li>회사의 지적재산권을 침해하는 행위</li>
              <li>음란, 폭력적, 반사회적 내용의 정보 유포</li>
              <li>자연어 명령을 통해 불법적이거나 부적절한 콘텐츠 생성 시도</li>
            </ul>
          </section>

          {/* 제8조 (회사의 의무) */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">제8조 (회사의 의무)</h2>
            <div className="space-y-4 text-gray-700">
              <div><strong>1.</strong> 회사는 관련법과 본 약관이 금지하거나 미풍양속에 반하는 행위를 하지 않으며, 지속적이고 안정적으로 서비스를 제공하기 위해 노력합니다.</div>
              <div><strong>2.</strong> 회사는 이용자의 개인정보 보호를 위해 보안시스템을 구축하며 개인정보 처리방침을 공시하고 준수합니다.</div>
              <div><strong>3.</strong> 회사는 서비스 이용과 관련하여 이용자로부터 제기된 의견이나 불만이 정당하다고 인정될 경우 즉시 처리합니다.</div>
            </div>
          </section>

          {/* 제9조 (AI 서비스 관련 특약) */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">제9조 (AI 서비스 관련 특약)</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">9.1 AI 처리 결과</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>AI가 생성한 엑셀 작업 결과의 정확성은 100% 보장되지 않습니다</li>
                  <li>중요한 데이터 작업 전 반드시 백업을 권장합니다</li>
                  <li>AI 처리 결과에 대한 최종 책임은 이용자에게 있습니다</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">9.2 데이터 처리</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>이용자가 입력한 엑셀 데이터는 AI 처리를 위해 임시적으로 서버에 저장됩니다</li>
                  <li>처리 완료 후 서버에서 자동 삭제됩니다 (최대 24시간 이내)</li>
                  <li>민감한 개인정보나 기밀 데이터 처리 시 각별한 주의가 필요합니다</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 제10조 (지적재산권) */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">제10조 (지적재산권)</h2>
            <div className="space-y-4 text-gray-700">
              <div><strong>1.</strong> 서비스에 대한 저작권 및 지적재산권은 회사에 귀속됩니다.</div>
              <div><strong>2.</strong> 이용자는 서비스를 이용함으로써 얻은 정보 중 회사에 지적재산권이 귀속된 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.</div>
            </div>
          </section>

          {/* 제11조 (책임제한) */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">제11조 (책임제한)</h2>
            <div className="space-y-4 text-gray-700">
              <div><strong>1.</strong> 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</div>
              <div><strong>2.</strong> 회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.</div>
              <div><strong>3.</strong> 회사는 이용자가 서비스를 이용하여 기대하는 수익을 상실한 것이나 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.</div>
              <div><strong>4.</strong> 회사는 AI 처리 결과로 인한 데이터 손실이나 손해에 대해 고의 또는 중대한 과실이 없는 한 책임을 지지 않습니다.</div>
            </div>
          </section>

          {/* 제12조 (분쟁해결) */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">제12조 (분쟁해결)</h2>
            <div className="space-y-4 text-gray-700">
              <div><strong>1.</strong> 회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해의 보상 등에 관하여 처리하기 위하여 피해보상처리기구를 설치·운영합니다.</div>
              <div><strong>2.</strong> 서비스 이용으로 발생한 분쟁에 대해 소송이 제기될 경우, 회사의 본사 소재지를 관할하는 법원을 관할 법원으로 합니다.</div>
            </div>
          </section>

          {/* 제13조 (기타) */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">제13조 (기타)</h2>
            <div className="space-y-4 text-gray-700">
              <div><strong>1.</strong> 본 약관은 대한민국 법령에 의하여 규정되고 이행됩니다.</div>
              <div><strong>2.</strong> 본 약관에서 정하지 아니한 사항과 본 약관의 해석에 관하여는 관련법령 또는 상관례에 따릅니다.</div>
            </div>
          </section>

          {/* 부칙 */}
          <section className="bg-gray-50 p-6 rounded-lg">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-gray-900 mb-4">부칙</h2>
              <p className="text-gray-800">본 약관은 2025년 6월 6일부터 적용됩니다.</p>
              <p className="text-gray-600 text-sm mt-4">
                서비스 이용 관련 문의사항이 있으시면 support@extion.co로 연락주시기 바랍니다.
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}