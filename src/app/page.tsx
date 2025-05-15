import MainSpreadSheet from "@/components/MainSpreadSheet";
import CSVChatComponent from "@/components/CSVChatComponent";
import ArtifactRenderContainer from "@/components/ArtifactRenderContainer";

export default function Home() {
  return (
      <div style={{ 
        display: 'flex', 
        width: '100%', 
        height: '100vh', 
        overflow: 'hidden' // 페이지 전체 스크롤 방지
      }}>
        {/* 왼쪽 영역 (위아래로 분할) */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          width: '50%', 
          height: '100%',
          borderRight: '1px solid #ddd',
          overflow: 'hidden' // 왼쪽 영역 스크롤 방지
        }}>
          {/* 왼쪽 상단: MainSpreadSheet (2사분면) */}
          <div style={{
            height: '50%',
            overflowY: 'auto', // 컴포넌트 내부 스크롤 유지
            overflowX: 'auto',
            borderBottom: '1px solid #ddd'
          }}>
            <MainSpreadSheet />
          </div>
          
          {/* 왼쪽 하단: CSVChatComponent (3사분면) */}
          <div style={{
            height: '50%',
            overflowY: 'auto', // 컴포넌트 내부 스크롤 유지
            overflowX: 'auto'
          }}>
            <CSVChatComponent />
          </div>
        </div>
        
        {/* 오른쪽 영역: ArtifactComponent (1사분면 및 4사분면 통합) */}
        <div style={{
          width: '50%',
          height: '100%',
          overflowY: 'auto', // 컴포넌트 내부 스크롤 유지
          overflowX: 'auto'
        }}>
          <ArtifactRenderContainer />
        </div>
      </div>
  );
}
