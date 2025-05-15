import MainSpreadSheet from "@/components/MainSpreadSheet";
import CSVChatComponent from "@/components/CSVChatComponent";

export default function Home() {
  return (
      <div style={{ 
        display: 'flex', 
        width: '100%', 
        height: '100vh', 
        overflow: 'hidden' // 페이지 전체 스크롤 방지
      }}>
        {/* 왼쪽 영역: MainSpreadSheet */}
        <div style={{ 
          width: '50%', 
          height: '100%',
          borderRight: '1px solid #ddd',
          overflowY: 'auto',
          overflowX: 'auto'
        }}>
          <MainSpreadSheet />
        </div>
        
        {/* 오른쪽 영역: CSVChatComponent */}
        <div style={{
          width: '50%',
          height: '100%',
          overflowY: 'auto',
          overflowX: 'auto'
        }}>
          <CSVChatComponent />
        </div>
      </div>
  );
}
