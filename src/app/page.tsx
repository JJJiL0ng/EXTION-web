import MainSpreadSheet from "@/components/MainSpreadSheet";
import CSVChatComponent from "@/components/CSVChatComponent";
import { CSVProvider } from "@/contexts/CSVContext";
import ArtifactComponent from "@/components/ArtifactComponent";

export default function Home() {
  return (
    <CSVProvider>
      <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
        {/* 왼쪽 영역 (위아래로 분할) */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          width: '50%', 
          height: '100%',
          borderRight: '1px solid #ddd'
        }}>
          {/* 왼쪽 상단: MainSpreadSheet (2사분면) */}
          <div style={{
            height: '50%',
            overflowY: 'auto',
            overflowX: 'auto',
            borderBottom: '1px solid #ddd'
          }}>
            <MainSpreadSheet />
          </div>
          
          {/* 왼쪽 하단: CSVChatComponent (3사분면) */}
          <div style={{
            height: '50%',
            overflowY: 'auto',
            overflowX: 'auto'
          }}>
            <CSVChatComponent />
          </div>
        </div>
        
        {/* 오른쪽 영역: ArtifactComponent (1사분면 및 4사분면 통합) */}
        <div style={{
          width: '50%',
          height: '100%',
          overflowY: 'auto',
          overflowX: 'auto'
        }}>
          <ArtifactComponent />
        </div>
      </div>
    </CSVProvider>
  );
}
