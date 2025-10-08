import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface SpreadsheetUploadState {
  isFileUploaded: boolean;
  uploadedFileName: string | null;
  uploadedAt: Date | null;
  setIsFileUploaded: (uploaded: boolean, fileName?: string) => void;
  resetUploadState: () => void;
}

export const useSpreadsheetUploadStore = create<SpreadsheetUploadState>()(
  devtools(
    (set) => ({
      isFileUploaded: false,
      uploadedFileName: null,
      uploadedAt: null,
      
      setIsFileUploaded: (uploaded: boolean, fileName?: string) => 
        set(
          { 
            isFileUploaded: uploaded,
            uploadedFileName: uploaded ? (fileName || null) : null,
            uploadedAt: uploaded ? new Date() : null
          }, 
          false, 
          'setIsFileUploaded'
        ),
      
      resetUploadState: () => 
        set(
          { 
            isFileUploaded: false,
            uploadedFileName: null,
            uploadedAt: null
          }, 
          false, 
          'resetUploadState'
        ),
    }),
    {
      name: 'spreadsheet-upload-store',
      enabled: process.env.NODE_ENV === 'development',
      trace: true,
    }
  )
);