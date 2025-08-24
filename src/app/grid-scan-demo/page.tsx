import ExcelGridScanner from '@/components/ExcelGridScanner';
import SimpleGridScan from '@/components/SimpleGridScan';
import ReactGridScan from '@/components/ReactGridScan';

export default function GridScanDemo() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 space-y-12">
        <ReactGridScan />
        <div className="border-t border-gray-300 pt-8">
          <SimpleGridScan />
        </div>
        <div className="border-t border-gray-300 pt-8">
          <ExcelGridScanner />
        </div>
      </div>
    </div>
  );
}
