import { socketService } from './socketService';
import { chatStorageService, StoredMessage } from './chatStorageService';
import { chatRoomManager } from './chatRoomManager';
import { userSessionManager } from './userSessionManager';

interface GlobalMessage {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
  roomId: string;
  userId?: string;
}

class GlobalMessageHandler {
  private isInitialized = false;
  private messageListeners: Map<string, (message: GlobalMessage) => void> = new Map();

  // 글로벌 메시지 핸들러 초기화
  initialize(): void {
    if (this.isInitialized) {
      console.log('🔄 GlobalMessageHandler 이미 초기화됨');
      return;
    }

    console.log('🌐 GlobalMessageHandler 초기화 시작...');

    // 소켓 메시지 수신 리스너 등록
    socketService.onMessage(async (data) => {
      console.log('🌐📨 글로벌 메시지 수신:', JSON.stringify(data, null, 2));
      console.log('🔥🔥🔥 GLOBAL MESSAGE HANDLER RECEIVED MESSAGE 🔥🔥🔥');
      
      const currentUserId = userSessionManager.getUserId();
      
      const message: GlobalMessage = {
        id: data.messageId || Date.now().toString(),
        text: data.message,
        sender: data.userId === currentUserId ? 'me' : 'other',
        timestamp: data.timestamp || new Date().toISOString(),
        roomId: data.roomId,
        userId: data.userId,
      };

      // 로컬 저장소에 메시지 저장
      await this.saveMessageToStorage(message);

      // 대화방 목록의 마지막 메시지 업데이트
      if (message.sender === 'other') {
        chatRoomManager.updateLastMessage(message.roomId, message.text, new Date(message.timestamp));
        
        // 현재 해당 대화방에 있지 않다면 읽지 않은 메시지 수 증가
        const isInCurrentRoom = this.isCurrentlyInRoom(message.roomId);
        if (!isInCurrentRoom) {
          chatRoomManager.incrementUnreadCount(message.roomId);
        }
      }

      // 특정 대화방 리스너에게 메시지 전달
      const roomListener = this.messageListeners.get(message.roomId);
      if (roomListener) {
        console.log(`🎯 대화방 ${message.roomId}의 리스너에게 메시지 전달`);
        roomListener(message);
      } else {
        console.log(`📝 대화방 ${message.roomId}에 활성 리스너 없음 (로컬 저장만 완료)`);
      }
    });

    this.isInitialized = true;
    console.log('✅ GlobalMessageHandler 초기화 완료');
  }

  // 특정 대화방의 메시지 리스너 등록
  addRoomListener(roomId: string, callback: (message: GlobalMessage) => void): void {
    console.log(`🎯 대화방 ${roomId} 리스너 등록`);
    this.messageListeners.set(roomId, callback);
  }

  // 특정 대화방의 메시지 리스너 제거
  removeRoomListener(roomId: string): void {
    console.log(`🗑️ 대화방 ${roomId} 리스너 제거`);
    this.messageListeners.delete(roomId);
  }

  // 현재 활성 대화방인지 확인
  private isCurrentlyInRoom(roomId: string): boolean {
    // 현재 활성 리스너가 있으면 해당 대화방에 있다고 판단
    return this.messageListeners.has(roomId);
  }

  // 메시지를 로컬 저장소에 저장
  private async saveMessageToStorage(message: GlobalMessage): Promise<void> {
    try {
      const storedMessage: StoredMessage = {
        id: message.id,
        text: message.text,
        sender: message.sender,
        timestamp: message.timestamp,
        roomId: message.roomId,
        status: 'read',
      };
      
      await chatStorageService.saveMessage(message.roomId, storedMessage);
      
      // 채팅방 마지막 메시지 업데이트
      await chatStorageService.updateLastMessage(message.roomId, message.text, message.timestamp);
      
      console.log(`💾 글로벌 저장 완료: ${message.roomId}에 메시지 저장`);
    } catch (error) {
      console.error('❌ 글로벌 메시지 저장 실패:', error);
    }
  }

  // 정리 함수
  cleanup(): void {
    console.log('🧹 GlobalMessageHandler 정리');
    this.messageListeners.clear();
    this.isInitialized = false;
  }

  // 상태 확인
  getStatus(): { isInitialized: boolean; activeListeners: number } {
    return {
      isInitialized: this.isInitialized,
      activeListeners: this.messageListeners.size,
    };
  }
}

// 싱글톤 인스턴스
export const globalMessageHandler = new GlobalMessageHandler();
