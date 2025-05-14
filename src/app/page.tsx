// import MainSpreadSheet from "@/components/MainSpreadSheet";
import CSVChatComponent from "@/components/CSVChatComponent";
import { CSVProvider } from "@/contexts/CSVContext";
import ArtifactComponent from "@/components/ArtifactComponent";

export default function Home() {
  return (
    <CSVProvider>
      <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
        <div style={{
          flex: '1',
          width: '50%',
          overflowY: 'auto',
          overflowX: 'auto',
          maxHeight: '100vh'
        }}>
          {/* <MainSpreadSheet /> */}
          <ArtifactComponent />
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
    </CSVProvider>

  );
}
