import MainSpreadSheet from "@/components/MainSpreadSheet";
import CSVChatComponent from "@/components/CSVChatComponent";
export default function Home() {
  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
      <div style={{ 
        flex: '1', 
        width: '50%', 
        overflowY: 'auto', 
        overflowX: 'auto', 
        maxHeight: '100vh' 
      }}>
        <MainSpreadSheet />
      </div>
      <div style={{ 
        flex: '1', 
        width: '50%', 
        position: 'sticky', 
        top: 0,
        height: '100vh',
        overflowY: 'hidden'
      }}>
        <CSVChatComponent />
      </div>
    </div>
  );
}
