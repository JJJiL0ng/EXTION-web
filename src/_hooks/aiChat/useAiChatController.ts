import { useAiChatApiConnector } from "./useAiChatApiConnector";
import { aiChatStore } from "@/_store/aiChat/aiChatStore";
import useChatStore from '@/_store/chat/chatIdStore'
import useSpreadsheetIdStore from '@/_store/sheet/spreadSheetIdStore'
import useSpreadsheetNamesStore from '@/_store/sheet/spreadSheetNamesStore'  
import { getOrCreateGuestId } from '../../_utils/guestUtils'

import { aiChatApiReq } from "@/_types/ai-chat-api/aiChatApi.types";