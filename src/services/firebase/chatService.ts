// Firebase 채팅 서비스
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
    onSnapshot,
    writeBatch,
    Timestamp,
    DocumentData,
    QueryDocumentSnapshot
} from 'firebase/firestore';
import { auth } from '../firebase';
import { ChatMessage } from '@/stores/useUnifiedDataStore';

const db = getFirestore();

// Firebase 메시지 인터페이스
export interface FirebaseMessage {
    id: string;
    chatId: string;
    role: 'user' | 'Extion ai' | 'system';
    content: string;
    timestamp: Date;
    type: 'text' | 'file_upload' | 'formula' | 'artifact' | 'data_generation' | 'data_fix';
    mode?: 'normal' | 'formula' | 'artifact' | 'datageneration' | 'datafix';
    
    // 선택적 컨텍스트 정보
    sheetContext?: {
        sheetIndex?: number;
        sheetName: string;
        affectedCells?: string[];
        totalRows?: number;
        totalColumns?: number;
        headers?: string[];
    };
    formulaData?: {
        formula: string;
        cellAddress: string;
        functionType?: string;
        explanation?: any;
        examples?: any[];
        alternatives?: any[];
        warning?: string;
        sheetIndex?: number;
        crossSheetReference?: boolean;
    };
    artifactData?: {
        type: 'chart' | 'table' | 'analysis';
        title: string;
        codeSnippet?: string;
        artifactId: string;
        code: string;
        explanation?: string;
    };
    dataChangeInfo?: any;
    fileUploadInfo?: any;
    metadata?: any;
}

// Firebase 채팅 인터페이스
export interface FirebaseChat {
    id: string;
    userId: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    messageCount: number;
    lastMessage?: {
        content: string;
        timestamp: Date;
        role: 'user' | 'Extion ai';
        type: string;
    };
    spreadsheetData?: {
        hasSpreadsheet: boolean;
        fileName?: string;
        totalSheets: number;
        activeSheetIndex: number;
        sheetNames: string[];
        lastModifiedAt: Date;
    };
    status: 'active' | 'archived' | 'deleted';
    analytics: {
        formulaCount: number;
        artifactCount: number;
        dataGenerationCount: number;
        dataFixCount: number;
    };
    spreadsheetId?: string; // 연관된 스프레드시트 ID
}

// Firestore 문서를 Firebase 메시지로 변환
const convertDocToFirebaseMessage = (doc: QueryDocumentSnapshot<DocumentData>): FirebaseMessage => {
    const data = doc.data();
    return {
        id: doc.id,
        chatId: data.chatId,
        role: data.role,
        content: data.content,
        timestamp: data.timestamp?.toDate() || new Date(),
        type: data.type || 'text',
        mode: data.mode,
        sheetContext: data.sheetContext,
        formulaData: data.formulaData,
        artifactData: data.artifactData,
        dataChangeInfo: data.dataChangeInfo,
        fileUploadInfo: data.fileUploadInfo,
        metadata: data.metadata
    };
};

// Firestore 문서를 Firebase 채팅으로 변환
const convertDocToFirebaseChat = (doc: QueryDocumentSnapshot<DocumentData>): FirebaseChat => {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId,
        title: data.title,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        messageCount: data.messageCount || 0,
        lastMessage: data.lastMessage ? {
            ...data.lastMessage,
            timestamp: data.lastMessage.timestamp?.toDate() || new Date()
        } : undefined,
        spreadsheetData: data.spreadsheetData ? {
            ...data.spreadsheetData,
            lastModifiedAt: data.spreadsheetData.lastModifiedAt?.toDate() || new Date()
        } : undefined,
        status: data.status || 'active',
        analytics: data.analytics || {
            formulaCount: 0,
            artifactCount: 0,
            dataGenerationCount: 0,
            dataFixCount: 0
        },
        spreadsheetId: data.spreadsheetId
    };
};

// Firebase 메시지를 ChatMessage로 변환
export const convertFirebaseMessageToChatMessage = (firebaseMessage: FirebaseMessage): ChatMessage => {
    return {
        id: firebaseMessage.id,
        type: firebaseMessage.role === 'system' ? 'Extion ai' : firebaseMessage.role,
        content: firebaseMessage.content,
        timestamp: firebaseMessage.timestamp,
        mode: firebaseMessage.mode === 'datageneration' ? 'normal' : firebaseMessage.mode,
        artifactData: firebaseMessage.artifactData ? {
            type: firebaseMessage.artifactData.type,
            title: firebaseMessage.artifactData.title,
            timestamp: firebaseMessage.timestamp,
            code: firebaseMessage.artifactData.code,
            artifactId: firebaseMessage.artifactData.artifactId,
            explanation: firebaseMessage.artifactData.explanation
        } : undefined
    };
};

// 사용자의 채팅 목록 가져오기
export const getUserChats = async (userId?: string): Promise<FirebaseChat[]> => {
    try {
        const currentUser = auth.currentUser;
        const targetUserId = userId || currentUser?.uid;
        
        if (!targetUserId) {
            throw new Error('사용자 인증이 필요합니다.');
        }

        const chatsRef = collection(db, 'chats');
        const q = query(
            chatsRef,
            where('userId', '==', targetUserId),
            where('status', '==', 'active'),
            orderBy('updatedAt', 'desc'),
            limit(50)
        );

        const querySnapshot = await getDocs(q);
        const chats: FirebaseChat[] = [];

        querySnapshot.forEach((doc) => {
            chats.push(convertDocToFirebaseChat(doc));
        });

        return chats;
    } catch (error) {
        console.error('채팅 목록 가져오기 오류:', error);
        throw error;
    }
};

// 특정 채팅 가져오기
export const getChat = async (chatId: string): Promise<FirebaseChat | null> => {
    try {
        const chatRef = doc(db, 'chats', chatId);
        const chatDoc = await getDoc(chatRef);

        if (!chatDoc.exists()) {
            return null;
        }

        return convertDocToFirebaseChat(chatDoc as QueryDocumentSnapshot<DocumentData>);
    } catch (error) {
        console.error('채팅 가져오기 오류:', error);
        throw error;
    }
};

// 채팅의 메시지 목록 가져오기 (최신순)
export const getChatMessages = async (chatId: string, limitCount: number = 50): Promise<FirebaseMessage[]> => {
    try {
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(
            messagesRef,
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        const messages: FirebaseMessage[] = [];

        querySnapshot.forEach((doc) => {
            messages.push(convertDocToFirebaseMessage(doc));
        });

        // 시간순으로 정렬 (오래된 것부터)
        return messages.reverse();
    } catch (error) {
        console.error('메시지 목록 가져오기 오류:', error);
        throw error;
    }
};

// 채팅의 메시지 목록 가져오기 (오래된 순)
export const getChatMessagesAsc = async (chatId: string, limitCount: number = 50): Promise<FirebaseMessage[]> => {
    try {
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(
            messagesRef,
            orderBy('timestamp', 'asc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        const messages: FirebaseMessage[] = [];

        querySnapshot.forEach((doc) => {
            messages.push(convertDocToFirebaseMessage(doc));
        });

        return messages;
    } catch (error) {
        console.error('메시지 목록 가져오기 오류:', error);
        throw error;
    }
};

// 실시간 메시지 구독
export const subscribeToChatMessages = (
    chatId: string, 
    callback: (messages: FirebaseMessage[]) => void,
    limitCount: number = 50
) => {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(
        messagesRef,
        orderBy('timestamp', 'asc'),
        limit(limitCount)
    );

    return onSnapshot(q, (querySnapshot) => {
        const messages: FirebaseMessage[] = [];
        querySnapshot.forEach((doc) => {
            messages.push(convertDocToFirebaseMessage(doc));
        });
        callback(messages);
    });
};

// 새 채팅 생성
export const createChat = async (title: string, userId?: string): Promise<string> => {
    try {
        const currentUser = auth.currentUser;
        const targetUserId = userId || currentUser?.uid;
        
        if (!targetUserId) {
            throw new Error('사용자 인증이 필요합니다.');
        }

        const chatData = {
            userId: targetUserId,
            title,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            messageCount: 0,
            status: 'active',
            analytics: {
                formulaCount: 0,
                artifactCount: 0,
                dataGenerationCount: 0,
                dataFixCount: 0
            }
        };

        const chatsRef = collection(db, 'chats');
        const docRef = await addDoc(chatsRef, chatData);
        
        return docRef.id;
    } catch (error) {
        console.error('채팅 생성 오류:', error);
        throw error;
    }
};

// 특정 ID로 채팅 생성
export const createChatWithId = async (chatId: string, title: string, userId?: string): Promise<void> => {
    try {
        const currentUser = auth.currentUser;
        const targetUserId = userId || currentUser?.uid;
        
        if (!targetUserId) {
            throw new Error('사용자 인증이 필요합니다.');
        }

        const chatData = {
            userId: targetUserId,
            title,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            messageCount: 0,
            status: 'active',
            analytics: {
                formulaCount: 0,
                artifactCount: 0,
                dataGenerationCount: 0,
                dataFixCount: 0
            }
        };

        const chatRef = doc(db, 'chats', chatId);
        await updateDoc(chatRef, chatData);
    } catch (error) {
        console.error('특정 ID로 채팅 생성 오류:', error);
        throw error;
    }
};

// 메시지 추가
export const addMessage = async (
    chatId: string, 
    message: Omit<FirebaseMessage, 'id' | 'chatId'>
): Promise<string> => {
    try {
        const batch = writeBatch(db);

        // 메시지 추가
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const messageRef = doc(messagesRef);
        
        const messageData = {
            ...message,
            chatId,
            timestamp: Timestamp.fromDate(message.timestamp)
        };
        
        batch.set(messageRef, messageData);

        // 채팅 메타데이터 업데이트
        const chatRef = doc(db, 'chats', chatId);
        const updateData: any = {
            updatedAt: Timestamp.now(),
            messageCount: (await getDoc(chatRef)).data()?.messageCount + 1 || 1,
            lastMessage: {
                content: message.content.length > 100 ? message.content.substring(0, 100) + '...' : message.content,
                timestamp: Timestamp.fromDate(message.timestamp),
                role: message.role,
                type: message.type
            }
        };

        // 분석 카운터 업데이트
        if (message.type === 'formula') {
            updateData['analytics.formulaCount'] = (await getDoc(chatRef)).data()?.analytics?.formulaCount + 1 || 1;
        } else if (message.type === 'artifact') {
            updateData['analytics.artifactCount'] = (await getDoc(chatRef)).data()?.analytics?.artifactCount + 1 || 1;
        } else if (message.type === 'data_generation') {
            updateData['analytics.dataGenerationCount'] = (await getDoc(chatRef)).data()?.analytics?.dataGenerationCount + 1 || 1;
        } else if (message.type === 'data_fix') {
            updateData['analytics.dataFixCount'] = (await getDoc(chatRef)).data()?.analytics?.dataFixCount + 1 || 1;
        }

        batch.update(chatRef, updateData);

        await batch.commit();
        return messageRef.id;
    } catch (error) {
        console.error('메시지 추가 오류:', error);
        throw error;
    }
};

// 채팅 삭제 (소프트 삭제)
export const deleteChat = async (chatId: string): Promise<void> => {
    try {
        const chatRef = doc(db, 'chats', chatId);
        await updateDoc(chatRef, {
            status: 'deleted',
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        console.error('채팅 삭제 오류:', error);
        throw error;
    }
};

// 채팅 제목 업데이트
export const updateChatTitle = async (chatId: string, title: string): Promise<void> => {
    try {
        const chatRef = doc(db, 'chats', chatId);
        await updateDoc(chatRef, {
            title,
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        console.error('채팅 제목 업데이트 오류:', error);
        throw error;
    }
};

// 채팅에 스프레드시트 데이터 연결
export const updateChatSpreadsheetData = async (
    chatId: string, 
    spreadsheetData: {
        hasSpreadsheet: boolean;
        fileName?: string;
        totalSheets: number;
        activeSheetIndex: number;
        sheetNames: string[];
        spreadsheetId?: string;
    }
): Promise<void> => {
    try {
        const chatRef = doc(db, 'chats', chatId);
        const updateData: any = {
            spreadsheetData: {
                ...spreadsheetData,
                lastModifiedAt: Timestamp.now()
            },
            updatedAt: Timestamp.now()
        };

        if (spreadsheetData.spreadsheetId) {
            updateData.spreadsheetId = spreadsheetData.spreadsheetId;
        }

        await updateDoc(chatRef, updateData);
    } catch (error) {
        console.error('채팅 스프레드시트 데이터 업데이트 오류:', error);
        throw error;
    }
}; 