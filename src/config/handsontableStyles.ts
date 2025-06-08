import { createGlobalStyle } from 'styled-components';

export const HandsontableStyles = createGlobalStyle`
  /* 모달이 열렸을 때 Handsontable의 z-index 조정 */
  .modal-open .handsontable {
    z-index: 0 !important;
  }
  
  .modal-open .ht_master {  
    z-index: 0 !important;
  }
  
  .modal-open .ht_clone_top,
  .modal-open .ht_clone_left,
  .modal-open .ht_clone_top_left_corner,
  .modal-open .ht_clone_bottom,
  .modal-open .ht_clone_bottom_left_corner,
  .modal-open .ht_clone_right {
    z-index: 0 !important;
  }

  /* 내보내기 드롭다운 관련 스타일 */
  .export-dropdown {
    z-index: 9999 !important;
    position: absolute;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .xlsx-sheet-selector {
    z-index: 9999 !important;
    position: absolute;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  /* 핸드온테이블의 z-index 조정 */
  .handsontable {
    z-index: 50;
  }

  .ht_master {
    z-index: 50 !important;
  }

  .ht_clone_top,
  .ht_clone_left,
  .ht_clone_top_left_corner {
    z-index: 51 !important;
  }

  /* 시트 선택 드롭다운 스타일 */
  .sheet-selector {
    z-index: 0;
  }

  .sheet-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    max-height: 240px;
    overflow-y: auto;
    margin-top: 0.5rem;
  }

  .sheet-dropdown-item {
    padding: 0.85rem 1.2rem;
    cursor: pointer;
    border-bottom: 1px solid #f3f4f6;
    transition: all 0.2s ease;
  }

  .sheet-dropdown-item:hover {
    background-color: #F9F9F7;
  }

  .sheet-dropdown-item.active {
    background-color: rgba(0, 93, 233, 0.08);
    color: #005DE9;
    font-weight: 500;
  }

  /* === 핸즈온테이블 기본 스타일 개선 === */
  .handsontable {
    font-family: 'Segoe UI', 'Inter', 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 13px !important; /* 11px → 13px로 증가 */
    line-height: 1.4 !important; /* 1.2 → 1.4로 증가 */
  }

  /* === 헤더 스타일 개선 === */
  .handsontable th {
    background-color: #F9F9F7 !important;
    color: #333 !important;
    font-weight: 500 !important; /* 400 → 500으로 증가 */
    border-color: rgba(0, 0, 0, 0.08) !important;
    padding: 4px 6px !important; /* 2px 4px → 4px 6px로 증가 */
    height: 28px !important; /* 20px → 28px로 증가 */
    font-size: 12px !important; /* 11px → 12px로 증가 */
    text-align: center !important;
    line-height: 20px !important; /* 라인 높이 추가 */
  }

  /* 행/열 헤더 텍스트 개선 */
  .handsontable .ht_clone_left th,
  .handsontable .ht_clone_top th,
  .handsontable .ht_clone_top_left_corner th {
    font-weight: 500 !important;
    width: 60px !important; /* 50px → 60px로 증가 */
    min-width: 60px !important;
  }

  /* 행 헤더 너비 개선 */
  .handsontable .ht_clone_left th {
    width: 40px !important; /* 32px → 40px로 증가 */
    min-width: 40px !important;
  }

  /* 활성 헤더 스타일 */
  .handsontable th.ht__active_highlight {
    background-color: rgba(0, 93, 233, 0.08) !important;
    color: #005DE9 !important;
    font-weight: 600 !important; /* 400 → 600으로 증가 */
  }

  /* === 셀 스타일 개선 === */
  .handsontable td {
    border-color: rgba(0, 0, 0, 0.05) !important;
    padding: 4px 8px !important; /* 2px 6px → 4px 8px로 증가 */
    height: 28px !important; /* 20px → 28px로 증가 */
    font-size: 13px !important; /* 11px → 13px로 증가 */
    line-height: 20px !important; /* 16px → 20px로 증가 */
    vertical-align: middle !important;
    transition: background-color 0.2s ease;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* 기본 열 너비 설정 */
  .handsontable col {
    width: 80px !important; /* 64px → 80px로 증가 */
  }

  /* 선택된 셀 스타일 */
  .handsontable .ht__selection {
    background-color: rgba(0, 93, 233, 0.16) !important;
  }

  /* 선택된 셀 테두리 */
  .handsontable .ht__selection--highlight {
    border: 2px solid #005DE9 !important;
  }

  /* 행/열 헤더 하이라이트 */
  .handsontable th.ht__highlight {
    background-color: rgba(0, 93, 233, 0.08) !important;
    font-weight: 500 !important;
  }

  /* === 컨텍스트 메뉴 완전 개선 === */
  .htContextMenu.handsontable {
    border-radius: 8px !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12) !important;
    padding: 8px 0 !important;
    border: 1px solid rgba(0, 0, 0, 0.08) !important;
    min-width: 250px !important; /* 최소 너비 대폭 증가 */
    max-width: 400px !important; /* 최대 너비 증가 */
    width: auto !important; /* 자동 너비 */
    font-size: 14px !important;
    z-index: 10000 !important;
    font-family: 'Malgun Gothic', '맑은 고딕', 'Apple SD Gothic Neo', 'Segoe UI', 'Inter', sans-serif !important; /* 한글 폰트 우선 */
  }

  .htContextMenu.handsontable .ht_master .wtHolder {
    background-color: white !important;
    width: 100% !important; /* 전체 너비 사용 */
  }

  /* 컨텍스트 메뉴 테이블 전체 너비 조정 */
  .htContextMenu.handsontable .ht_master table {
    width: 100% !important;
    table-layout: auto !important; /* 고정 레이아웃 해제 */
    border-collapse: collapse !important;
  }

  /* 컨텍스트 메뉴 아이템 완전 개선 */
  .htContextMenu.handsontable table tbody tr td {
    padding: 12px 20px !important; /* 좌우 패딩 대폭 증가 */
    border: none !important;
    font-size: 14px !important;
    line-height: 1.4 !important;
    height: auto !important;
    min-height: 44px !important; /* 터치 친화적 높이 */
    white-space: nowrap !important; /* 텍스트 줄바꿈 방지 */
    overflow: visible !important; /* 오버플로우 표시 */
    text-overflow: clip !important; /* 텍스트 자르기 방지 */
    width: auto !important; /* 자동 너비 */
    max-width: none !important; /* 최대 너비 제한 해제 */
    word-break: keep-all !important; /* 한글 단어 분리 방지 */
    box-sizing: border-box !important;
  }

  .htContextMenu.handsontable table tbody tr td:hover {
    background-color: rgba(0, 93, 233, 0.06) !important; /* 호버 색상 개선 */
  }

  .htContextMenu.handsontable table tbody tr td.htDisabled {
    color: #999 !important;
    cursor: not-allowed !important;
  }

  .htContextMenu.handsontable table tbody tr td.htDisabled:hover {
    background-color: transparent !important;
  }

  /* 컨텍스트 메뉴 구분선 */
  .htContextMenu.handsontable table tbody tr td.htSeparator {
    height: 1px !important;
    background-color: rgba(0, 0, 0, 0.08) !important;
    padding: 0 !important;
    margin: 4px 0 !important; /* 구분선 여백 */
  }

  /* 컨텍스트 메뉴 서브메뉴 개선 */
  .htContextMenu.handsontable .ht_menu_indicator {
    font-size: 12px !important;
    color: #666 !important;
    margin-left: 10px !important;
    float: right !important;
  }

  /* 컨텍스트 메뉴 텍스트 완전 보호 */
  .htContextMenu.handsontable table tbody tr td .htContextMenuText {
    display: inline-block !important;
    width: auto !important;
    min-width: 0 !important;
    max-width: none !important;
    overflow: visible !important;
    text-overflow: clip !important;
    white-space: nowrap !important;
  }

  /* === 포뮬러 및 특수 셀 스타일 === */
  .handsontable td.formula {
    background-color: rgba(0, 93, 233, 0.05) !important;
  }

  /* 텍스트 정렬 스타일 */
  .handsontable td.htLeft {
    text-align: left !important;
  }

  .handsontable td.htCenter {
    text-align: center !important;
  }

  .handsontable td.htRight {
    text-align: right !important;
  }

  /* 숫자 셀 기본 우측 정렬 */
  .handsontable td.htNumeric {
    text-align: right !important;
  }

  /* === 시트 탭 바 스타일 === */
  .sheet-tabs-container {
    display: flex;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    position: relative;
    background-color: #F9F9F7;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    padding: 0 0.5rem;
    flex-grow: 1;
    min-height: 3rem;
    scroll-behavior: smooth;
  }

  .sheet-tabs-container::-webkit-scrollbar {
    display: none;
  }

  .sheet-tab {
    display: flex;
    align-items: center;
    padding: 0.75rem 1.25rem;
    white-space: nowrap;
    cursor: pointer;
    border: 1px solid transparent;
    border-bottom: none;
    border-radius: 0.5rem 0.5rem 0 0;
    margin-right: 0.25rem;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    position: relative;
    top: 1px;
  }

  .sheet-tab:hover {
    background-color: rgba(0, 93, 233, 0.04);
  }

  .sheet-tab.active {
    background-color: white;
    border-color: rgba(0, 0, 0, 0.08);
    color: #005DE9;
    font-weight: 500;
  }

  .sheet-tab .sheet-info {
    margin-left: 0.5rem;
    padding: 0.125rem 0.5rem;
    font-size: 0.7rem;
    border-radius: 1rem;
    background-color: rgba(0, 0, 0, 0.05);
    color: rgba(0, 0, 0, 0.5);
  }

  .sheet-tab.active .sheet-info {
    background-color: rgba(0, 93, 233, 0.08);
    color: rgba(0, 93, 233, 0.7);
  }

  .sheet-add-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem;
    border-radius: 0.5rem 0.5rem 0 0;
    border: 1px dashed rgba(0, 0, 0, 0.2);
    border-bottom: none;
    background-color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
    top: 1px;
    min-width: 2.5rem;
    min-height: 2.5rem;
  }

  .sheet-add-button:hover {
    background-color: rgba(0, 93, 233, 0.08);
    border-color: rgba(0, 93, 233, 0.3);
    color: #005DE9;
  }

  .empty-sheet-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    color: rgba(0, 0, 0, 0.5);
    font-size: 0.875rem;
  }

  .empty-sheet-text {
    margin-right: 0.75rem;
  }

  /* === 시트 생성 모달 === */
  .sheet-create-modal {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 0.5rem;
    background-color: white;
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(0, 0, 0, 0.08);
    padding: 1rem;
    width: 300px;
    z-index: 1000;
  }

  .sheet-create-modal input {
    width: 100%;
    padding: 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
  }

  .sheet-create-modal input:focus {
    outline: none;
    border-color: #005DE9;
    box-shadow: 0 0 0 2px rgba(0, 93, 233, 0.2);
  }

  .sheet-create-modal-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  .sheet-create-modal button {
    padding: 0.6rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .sheet-create-modal .cancel-button {
    background-color: white;
    border: 1px solid rgba(0, 0, 0, 0.1);
    color: rgba(0, 0, 0, 0.7);
  }

  .sheet-create-modal .cancel-button:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .sheet-create-modal .create-button {
    background-color: #005DE9;
    border: 1px solid #005DE9;
    color: white;
  }

  .sheet-create-modal .create-button:hover {
    background-color: #004ab8;
  }

  .sheet-create-modal .create-button:disabled {
    background-color: rgba(0, 93, 233, 0.5);
    cursor: not-allowed;
  }

  /* === 가상 스크롤바 === */
  .tab-scrollbar-container {
    position: relative;
    height: 8px;
    background-color: #f1f1f1;
    border-radius: 4px;
    margin: 4px 8px 4px 8px;
    cursor: pointer;
    transition: opacity 0.3s;
    opacity: 0.7;
  }

  .tab-scrollbar-container:hover {
    opacity: 1;
  }

  .tab-scrollbar-thumb {
    position: absolute;
    height: 100%;
    background-color: #c1c1c1;
    border-radius: 4px;
    min-width: 30px;
    transition: background-color 0.2s;
  }

  .tab-scrollbar-thumb:hover,
  .tab-scrollbar-thumb.dragging {
    background-color: #a1a1a1;
  }

  /* === 스크롤바 숨기기 === */
  .spreadsheet-main-container {
    overflow: hidden;
  }

  .spreadsheet-main-container::-webkit-scrollbar {
    display: none;
  }

  .spreadsheet-main-container {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  /* === 스프레드시트 컨테이너 === */
  .spreadsheet-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
    transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .spreadsheet-area {
    flex: 1;
    position: relative;
    min-height: 0;
    background-color: white;
  }

  .spreadsheet-area .handsontable {
    height: 100% !important;
    width: 100% !important;
  }

  /* === 반응형 디자인 개선 === */
  @media (max-width: 1024px) {
    .sheet-tabs-container {
      padding: 0 0.25rem;
    }
    
    .sheet-tab {
      padding: 0.5rem 0.75rem;
      font-size: 0.8rem;
    }
    
    .sheet-tab .sheet-info {
      font-size: 0.65rem;
      padding: 0.1rem 0.4rem;
    }

    /* 컨텍스트 메뉴 태블릿 대응 */
    .htContextMenu.handsontable {
      min-width: 220px !important;
    }

    .htContextMenu.handsontable table tbody tr td {
      padding: 10px 16px !important;
      font-size: 13px !important;
      min-height: 40px !important;
    }
  }

  @media (max-width: 768px) {
    .example-controls-container {
      padding: 0.5rem;
    }
    
    .example-controls-container .flex {
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    /* 셀 크기 모바일 조정 */
    .handsontable td {
      height: 32px !important;
      font-size: 14px !important;
      padding: 6px 8px !important;
    }

    .handsontable th {
      height: 32px !important;
      font-size: 13px !important;
      padding: 6px 8px !important;
    }

    /* 컨텍스트 메뉴 모바일 최적화 */
    .htContextMenu.handsontable {
      min-width: 200px !important; /* 모바일에서 최소 너비 */
      font-size: 15px !important; /* 터치 친화적 크기 */
    }

    .htContextMenu.handsontable table tbody tr td {
      padding: 14px 18px !important; /* 터치 영역 확대 */
      font-size: 15px !important;
      min-height: 48px !important; /* 터치 친화적 높이 */
    }
  }
`;