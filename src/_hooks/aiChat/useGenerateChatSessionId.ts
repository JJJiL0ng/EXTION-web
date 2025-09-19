// import { useCallback } from 'react';
// import { v4 as uuidv4 } from 'uuid';

// /**
//  * ChatSession ID를 생성하는 커스텀 훅
//  * UUID v4를 사용하여 고유한 ChatSession ID를 생성합니다.
//  */
// export const useGenerateChatSessionId = () => {
//   /**
//    * 새로운 ChatSession ID를 생성합니다
//    * @returns {string} 생성된 ChatSession ID (형식: chat_uuid)
//    */
//   const generateChatSessionId = useCallback(() => {
//     const uuid = uuidv4();
//     return `${uuid}`;
//   }, []);
//   return {
//     generateChatSessionId
//   };
// };

// export default useGenerateChatSessionId;
