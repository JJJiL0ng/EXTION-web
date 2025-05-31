// Firebase 스프레드시트 서비스
import { 
    getFirestore, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    limit, 
    writeBatch,
    Timestamp,
    DocumentData,
    QueryDocumentSnapshot
} from 'firebase/firestore';
import { auth } from '../firebase';
import { XLSXData, SheetData } from '@/stores/useUnifiedDataStore';

const db = getFirestore();

// Firebase 스프레드시트 인터페이스
export interface FirebaseSpreadsheet {
    id: string;
    userId: string;
    chatId?: string;
    fileName: string;
    originalFileName: string;
    fileSize: number;
    fileType: string;
    sheets: SheetMetadata[];
    activeSheetIndex: number;
    dataStorageType: 'firestore' | 'cloud_storage' | 'encrypted';
    dataPath?: string;
    version: number;
    versionHistory: VersionHistoryItem[];
    permissions: {
        owner: string;
        shared: string[];
    };
    createdAt: Date;
    updatedAt: Date;
}

// 시트 메타데이터 인터페이스
export interface SheetMetadata {
    sheetName: string;
    sheetIndex: number;
    headers: string[];
    metadata: {
        rowCount: number;
        columnCount: number;
        headerRow: number;
        dataRange: {
            startRow: number;
            endRow: number;
            startCol: number;
            endCol: number;
            startColLetter: string;
            endColLetter: string;
        };
        hasFormulas: boolean;
        lastModified: Date;
        chunkCount: number;
        chunkSize: number;
    };
}

// 버전 히스토리 인터페이스
export interface VersionHistoryItem {
    version: number;
    timestamp: Date;
    changeDescription: string;
    changedBy: string;
}

// 시트 문서 인터페이스
export interface SheetDocument {
    sheetIndex: number;
    sheetName: string;
    spreadsheetId: string;
    headers: string[];
    rowCount: number;
    hasData: boolean;
    chunkCount: number;
    chunkSize: number;
    formulas: any[];
    computedData: any[];
    createdAt: Date;
    updatedAt: Date;
    source?: string;
    chatMetadata: {
        messageCount: number;
        lastActivityAt: Date;
        hasActiveFormulas: boolean;
        hasArtifacts: boolean;
    };
    dataReference?: {
        storagePath: string;
        format: 'json' | 'encrypted';
        size: number;
        checksum: string;
    };
}

// 청크 문서 인터페이스
export interface ChunkDocument {
    chunkIndex: number;
    startRowIndex: number;
    endRowIndex: number;
    rowCount: number;
    serializedRows?: {
        [key: string]: string[];
    };
    rows?: string[][]; // 새로운 구조 지원
    createdAt: Date;
    updatedAt: Date;
}

// Firestore 문서를 Firebase 스프레드시트로 변환
const convertDocToFirebaseSpreadsheet = (doc: QueryDocumentSnapshot<DocumentData>): FirebaseSpreadsheet => {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId,
        chatId: data.chatId,
        fileName: data.fileName,
        originalFileName: data.originalFileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
        sheets: data.sheets?.map((sheet: any) => ({
            ...sheet,
            metadata: {
                ...sheet.metadata,
                lastModified: sheet.metadata?.lastModified?.toDate() || new Date()
            }
        })) || [],
        activeSheetIndex: data.activeSheetIndex || 0,
        dataStorageType: data.dataStorageType || 'firestore',
        dataPath: data.dataPath,
        version: data.version || 1,
        versionHistory: data.versionHistory?.map((item: any) => ({
            ...item,
            timestamp: item.timestamp?.toDate() || new Date()
        })) || [],
        permissions: data.permissions || { owner: data.userId, shared: [] },
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
    };
};

// 스프레드시트 메타데이터 가져오기
export const getSpreadsheetMetadata = async (spreadsheetId: string): Promise<FirebaseSpreadsheet | null> => {
    try {
        const spreadsheetRef = doc(db, 'spreadsheets', spreadsheetId);
        const spreadsheetDoc = await getDoc(spreadsheetRef);

        if (!spreadsheetDoc.exists()) {
            return null;
        }

        return convertDocToFirebaseSpreadsheet(spreadsheetDoc as QueryDocumentSnapshot<DocumentData>);
    } catch (error) {
        console.error('스프레드시트 메타데이터 가져오기 오류:', error);
        throw error;
    }
};

// 사용자의 스프레드시트 목록 가져오기
export const getUserSpreadsheets = async (userId?: string): Promise<FirebaseSpreadsheet[]> => {
    try {
        const currentUser = auth.currentUser;
        const targetUserId = userId || currentUser?.uid;
        
        if (!targetUserId) {
            throw new Error('사용자 인증이 필요합니다.');
        }

        const spreadsheetsRef = collection(db, 'spreadsheets');
        const q = query(
            spreadsheetsRef,
            where('userId', '==', targetUserId),
            orderBy('updatedAt', 'desc'),
            limit(50)
        );

        const querySnapshot = await getDocs(q);
        const spreadsheets: FirebaseSpreadsheet[] = [];

        querySnapshot.forEach((doc) => {
            spreadsheets.push(convertDocToFirebaseSpreadsheet(doc));
        });

        return spreadsheets;
    } catch (error) {
        console.error('스프레드시트 목록 가져오기 오류:', error);
        throw error;
    }
};

// 시트 데이터 가져오기 (청크에서 복원)
export const getSheetData = async (spreadsheetId: string, sheetIndex: number): Promise<string[][] | null> => {
    try {
        // 스프레드시트 데이터 메타데이터 가져오기
        const dataDocRef = doc(db, 'spreadsheetData', `${spreadsheetId}_${sheetIndex}`);
        const dataDoc = await getDoc(dataDocRef);

        if (!dataDoc.exists()) {
            console.warn(`시트 데이터를 찾을 수 없습니다: ${spreadsheetId}_${sheetIndex}`);
            return null;
        }

        const dataMetadata = dataDoc.data();
        const totalChunks = dataMetadata.chunkCount || dataMetadata.totalChunks || 0;

        if (totalChunks === 0) {
            // 청크가 없는 경우 직접 데이터 확인
            if (dataMetadata.data && Array.isArray(dataMetadata.data)) {
                return dataMetadata.data;
            }
            return [];
        }

        // 모든 청크 가져오기
        const chunksRef = collection(db, 'spreadsheetData', `${spreadsheetId}_${sheetIndex}`, 'chunks');
        const chunksQuery = query(chunksRef, orderBy('chunkIndex', 'asc'));
        const chunksSnapshot = await getDocs(chunksQuery);

        const allRows: string[][] = [];

        chunksSnapshot.forEach((chunkDoc) => {
            const chunkData = chunkDoc.data() as ChunkDocument;
            
            // 청크 데이터 구조 확인
            if (chunkData.serializedRows) {
                // 기존 구조: serializedRows 사용
                for (let i = chunkData.startRowIndex; i <= chunkData.endRowIndex; i++) {
                    const rowKey = `row_${i}`;
                    if (chunkData.serializedRows[rowKey]) {
                        allRows[i] = chunkData.serializedRows[rowKey];
                    }
                }
            } else if (chunkData.rows && Array.isArray(chunkData.rows)) {
                // 새로운 구조: rows 배열 사용
                chunkData.rows.forEach((row, index) => {
                    const actualRowIndex = chunkData.startRowIndex + index;
                    allRows[actualRowIndex] = row;
                });
            }
        });

        // 빈 요소 제거하고 연속된 배열로 변환
        const filteredRows = allRows.filter(row => row !== undefined && row !== null);
        return filteredRows;
    } catch (error) {
        console.error('시트 데이터 가져오기 오류:', error);
        throw error;
    }
};

// 전체 스프레드시트 데이터 가져오기 (XLSXData 형식으로 변환)
export const getSpreadsheetData = async (spreadsheetId: string): Promise<XLSXData | null> => {
    try {
        console.log('스프레드시트 데이터 로딩 시작:', spreadsheetId);
        
        // 스프레드시트 메타데이터 가져오기
        const metadata = await getSpreadsheetMetadata(spreadsheetId);
        if (!metadata) {
            console.warn('스프레드시트 메타데이터를 찾을 수 없습니다:', spreadsheetId);
            return null;
        }

        console.log('스프레드시트 메타데이터:', {
            id: metadata.id,
            fileName: metadata.fileName,
            sheetsCount: metadata.sheets.length,
            sheets: metadata.sheets.map(s => ({ name: s.sheetName, index: s.sheetIndex }))
        });

        // 각 시트의 데이터 가져오기
        const sheets: SheetData[] = [];
        
        for (const sheetMeta of metadata.sheets) {
            console.log(`시트 데이터 로딩: ${sheetMeta.sheetName} (인덱스: ${sheetMeta.sheetIndex})`);
            
            const sheetData = await getSheetData(spreadsheetId, sheetMeta.sheetIndex);
            
            if (!sheetData || sheetData.length === 0) {
                console.warn(`시트 데이터가 비어있음: ${sheetMeta.sheetName}`);
                // 빈 시트라도 구조는 유지
                const sheet: SheetData = {
                    sheetName: sheetMeta.sheetName,
                    headers: sheetMeta.headers || [],
                    data: [],
                    rawData: [sheetMeta.headers || []],
                    metadata: {
                        rowCount: 0,
                        columnCount: sheetMeta.headers?.length || 0,
                        headerRow: sheetMeta.metadata.headerRow,
                        dataRange: sheetMeta.metadata.dataRange,
                        lastModified: sheetMeta.metadata.lastModified,
                        preserveOriginalStructure: true
                    }
                };
                sheets.push(sheet);
                continue;
            }

            // 헤더와 데이터 분리
            const headers = sheetMeta.headers || [];
            let data: string[][] = [];
            let rawData: string[][] = sheetData;

            // 헤더가 있는 경우 데이터에서 헤더 행 제거
            if (headers.length > 0 && sheetData.length > 0) {
                // 첫 번째 행이 헤더인지 확인
                const firstRow = sheetData[0];
                const isFirstRowHeader = headers.every((header, index) => 
                    firstRow[index] === header
                );

                if (isFirstRowHeader) {
                    data = sheetData.slice(1); // 헤더 제외한 데이터
                } else {
                    data = sheetData; // 전체가 데이터
                    rawData = [headers, ...sheetData]; // 헤더 추가
                }
            } else {
                data = sheetData;
            }

            const sheet: SheetData = {
                sheetName: sheetMeta.sheetName,
                headers,
                data,
                rawData,
                metadata: {
                    rowCount: data.length,
                    columnCount: headers.length,
                    headerRow: sheetMeta.metadata.headerRow,
                    dataRange: sheetMeta.metadata.dataRange,
                    lastModified: sheetMeta.metadata.lastModified,
                    preserveOriginalStructure: true
                }
            };

            console.log(`시트 로딩 완료: ${sheetMeta.sheetName}`, {
                headers: headers.length,
                dataRows: data.length,
                rawDataRows: rawData.length
            });

            sheets.push(sheet);
        }

        const xlsxData: XLSXData = {
            fileName: metadata.fileName,
            sheets,
            activeSheetIndex: metadata.activeSheetIndex,
            spreadsheetId: metadata.id
        };

        console.log('스프레드시트 데이터 로딩 완료:', {
            fileName: xlsxData.fileName,
            sheetsCount: xlsxData.sheets.length,
            activeSheetIndex: xlsxData.activeSheetIndex
        });

        return xlsxData;
    } catch (error) {
        console.error('스프레드시트 데이터 가져오기 오류:', error);
        throw error;
    }
};

// 채팅 ID로 스프레드시트 가져오기 (개선된 버전)
export const getSpreadsheetByChatId = async (chatId: string): Promise<XLSXData | null> => {
    try {
        console.log('채팅 ID로 스프레드시트 조회:', chatId);
        
        const spreadsheetsRef = collection(db, 'spreadsheets');
        const q = query(
            spreadsheetsRef,
            where('chatId', '==', chatId),
            orderBy('updatedAt', 'desc'),
            limit(1)
        );

        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            console.log('채팅 ID에 연결된 스프레드시트가 없습니다:', chatId);
            return null;
        }

        const spreadsheetDoc = querySnapshot.docs[0];
        const spreadsheetId = spreadsheetDoc.id;
        
        console.log('스프레드시트 발견:', spreadsheetId);

        return await getSpreadsheetData(spreadsheetId);
    } catch (error) {
        console.error('채팅 ID로 스프레드시트 가져오기 오류:', error);
        throw error;
    }
};

// 스프레드시트 삭제
export const deleteSpreadsheet = async (spreadsheetId: string): Promise<void> => {
    try {
        const batch = writeBatch(db);

        // 스프레드시트 메타데이터 삭제
        const spreadsheetRef = doc(db, 'spreadsheets', spreadsheetId);
        batch.delete(spreadsheetRef);

        // 스프레드시트의 모든 시트 데이터 삭제
        const metadata = await getSpreadsheetMetadata(spreadsheetId);
        if (metadata) {
            for (const sheet of metadata.sheets) {
                const dataDocRef = doc(db, 'spreadsheetData', `${spreadsheetId}_${sheet.sheetIndex}`);
                batch.delete(dataDocRef);

                // 청크들도 삭제 (별도 배치로 처리 필요)
                const chunksRef = collection(db, 'spreadsheetData', `${spreadsheetId}_${sheet.sheetIndex}`, 'chunks');
                const chunksSnapshot = await getDocs(chunksRef);
                
                chunksSnapshot.forEach((chunkDoc) => {
                    batch.delete(chunkDoc.ref);
                });
            }
        }

        await batch.commit();
    } catch (error) {
        console.error('스프레드시트 삭제 오류:', error);
        throw error;
    }
}; 