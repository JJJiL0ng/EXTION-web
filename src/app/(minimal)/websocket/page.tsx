'use client';

import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function Home() {
  // socket 인스턴스를 상태로 관리합니다. (null일 수 있음)
  const [socket, setSocket] = useState<Socket | null>(null); 
  const [isConnected, setIsConnected] = useState(false); // 연결 상태 추가
  const [message, setMessage] = useState('');
  const [receivedMessages, setReceivedMessages] = useState<string[]>([]);

  // 연결 함수
  const connectToServer = () => {
    const newSocket = io(SOCKET_URL);

    newSocket.on('connect', () => {
      console.log('✅ 서버에 연결되었습니다. ID:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 서버와의 연결이 끊겼습니다.');
      setIsConnected(false);
    });

    newSocket.on('message', (newMessage: string) => {
      setReceivedMessages((prev) => [...prev, newMessage]);
    });

    setSocket(newSocket);
  };

  // 연결 끊기 함수
  const disconnectFromServer = () => {
    if (socket) {
      socket.disconnect(); // ✨ 이 부분이 핵심입니다!
    }
  };

  const sendMessage = () => {
    if (socket && message.trim() !== '') {
      socket.emit('message', message);
      setMessage('');
    }
  };

  // 컴포넌트가 처음 렌더링될 때 자동으로 연결
  useEffect(() => {
    connectToServer();

    // 컴포넌트가 사라질 때(unmount) 자동으로 연결을 끊도록 설정 (메모리 누수 방지)
    return () => {
      if(socket) {
        socket.disconnect();
      }
    };
  }, []); // [] 의존성 배열로 최초 한 번만 실행

  return (
    <div>
      <h1>WebSocket 테스트</h1>
      <p>연결 상태: {isConnected ? '🟢 온라인' : '🔴 오프라인'}</p>
      
      {/* 연결/해제 버튼 추가 */}
      {!isConnected ? (
        <button onClick={connectToServer}>연결하기</button>
      ) : (
        <button onClick={disconnectFromServer}>연결 끊기</button>
      )}

      <hr />

      {isConnected && (
        <div>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage}>전송</button>
        </div>
      )}
      
      <h2>수신된 메시지:</h2>
      <ul>
        {receivedMessages.map((msg, index) => (
          <li key={index}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}