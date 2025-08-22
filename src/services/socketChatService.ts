import { socketService } from './socketService';
import { serverConfig } from '../config/serverConfig';
import { userSessionManager } from './userSessionManager';
import { chatStorageService, StoredMessage } from './chatStorageService';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
  roomId: string;
}

interface SocketChatService {
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: (roomId: string) => void;
  sendMessage: (roomId: string, text: string) => void;
  onMessage: (callback: (message: Message) => void) => void;
  onTyping: (callback: (data: { roomId: string; isTyping: boolean }) => void) => void;
  sendTyping: (roomId: string, isTyping: boolean) => void;
  onUserJoined: (callback: (data: any) => void) => void;
  onUserLeft: (callback: (data: any) => void) => void;
  loadStoredMessages: (roomId: string) => Promise<Message[]>;
  saveMessageToStorage: (roomId: string, message: Message) => Promise<void>;
}

class SocketChatManager implements SocketChatService {
  private currentUserId: string = '';

  constructor() {
    // userId는 socketMatchingService와 동일하게 설정되어야 함
    this.initializeListeners();
  }

  // Socket 이벤트 리스너 초기화
  private initializeListeners(): void {
    // 메시지 수신은 globalMessageHandler에서 처리하므로 여기서는 제거
    console.log('🔍 socketChatService - 메시지 수신은 globalMessageHandler에서 처리');

    // 타이핑 상태 수신
    socketService.onTyping((data) => {
      if (data.userId !== this.currentUserId && this.typingCallback) {
        this.typingCallback({
          roomId: data.roomId,
          isTyping: data.isTyping,
        });
      }
    });

    // 사용자 입장/퇴장
    socketService.onUserJoined((data) => {
      if (this.userJoinedCallback) {
        this.userJoinedCallback(data);
      }
    });

    socketService.onUserLeft((data) => {
      if (this.userLeftCallback) {
        this.userLeftCallback(data);
      }
    });
  }

  private messageCallback?: (message: Message) => void;
  private typingCallback?: (data: { roomId: string; isTyping: boolean }) => void;
  private userJoinedCallback?: (data: any) => void;
  private userLeftCallback?: (data: any) => void;
  private previousMessagesCallback?: (data: { roomId: string; messages: any[] }) => void;
  private previousMessagesListenerRegistered: boolean = false;

  // 채팅방 입장
  async joinRoom(roomId: string): Promise<void> {
    console.log('🏠 Socket 채팅방 입장 시도:', roomId);
    
    // 먼저 서버에 연결
    if (!socketService.isConnected()) {
      console.log('🔌 서버 연결 시도...');
      const connected = await socketService.connect(serverConfig.socketUrl);
      if (!connected) {
        throw new Error('서버 연결 실패');
      }
    }
    
    // 전역 세션에서 userId 가져오기
    this.currentUserId = userSessionManager.getUserId();
    
    // 이전 메시지 리스너는 한 번만 등록 (중복 방지)
    if (!this.previousMessagesListenerRegistered) {
      socketService.onPreviousMessages((data) => {
        if (this.previousMessagesCallback) {
          this.previousMessagesCallback(data);
        }
      });
      this.previousMessagesListenerRegistered = true;
    }
    
    // 채팅방 입장
    socketService.joinRoom(roomId);
    console.log('✅ Socket 채팅방 입장 완료:', roomId);
  }

  // 채팅방 퇴장
  leaveRoom(roomId: string): void {
    console.log('🚪 Socket 채팅방 퇴장:', roomId);
    socketService.leaveRoom(roomId);
  }

  // 메시지 전송
  sendMessage(roomId: string, text: string): void {
    const messageId = Date.now().toString();
    const timestamp = new Date().toISOString();
    
    const socketMessage = {
      text,
      userId: this.currentUserId,
      timestamp,
      messageId,
    };

    // 내 메시지를 로컬 저장소에 저장
    const myMessage: Message = {
      id: messageId,
      text,
      sender: 'me',
      timestamp,
      roomId,
    };
    
    this.saveMessageToStorage(roomId, myMessage);

    console.log('💬 Socket 메시지 전송:', socketMessage);
    socketService.sendMessage(roomId, socketMessage);
  }

  // 메시지 수신 콜백
  onMessage(callback: (message: Message) => void): void {
    this.messageCallback = callback;
  }

  // 타이핑 상태 수신 콜백
  onTyping(callback: (data: { roomId: string; isTyping: boolean }) => void): void {
    this.typingCallback = callback;
  }

  // 타이핑 상태 전송
  sendTyping(roomId: string, isTyping: boolean): void {
    socketService.sendTyping(roomId, isTyping);
  }

  // 사용자 입장 콜백
  onUserJoined(callback: (data: any) => void): void {
    this.userJoinedCallback = callback;
  }

  // 사용자 퇴장 콜백
  onUserLeft(callback: (data: any) => void): void {
    this.userLeftCallback = callback;
  }

  // 이전 메시지 수신 콜백
  onPreviousMessages(callback: (data: { roomId: string; messages: any[] }) => void): void {
    this.previousMessagesCallback = callback;
  }

  // 사용자 ID 생성
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 현재 사용자 ID 반환
  getCurrentUserId(): string {
    return this.currentUserId;
  }

  // 연결 상태 확인
  isConnected(): boolean {
    return socketService.isConnected();
  }

  // 로컬 저장소에서 메시지 불러오기
  async loadStoredMessages(roomId: string): Promise<Message[]> {
    try {
      const storedMessages = await chatStorageService.getMessages(roomId);
      const messages: Message[] = storedMessages.map(stored => ({
        id: stored.id,
        text: stored.text,
        sender: stored.sender,
        timestamp: stored.timestamp,
        roomId: stored.roomId,
      }));
      
      console.log(`📚 로컬에서 ${roomId}의 메시지 ${messages.length}개 불러옴`);
      return messages;
    } catch (error) {
      console.error('❌ 로컬 메시지 불러오기 실패:', error);
      return [];
    }
  }

  // 메시지를 로컬 저장소에 저장
  async saveMessageToStorage(roomId: string, message: Message): Promise<void> {
    try {
      const storedMessage: StoredMessage = {
        id: message.id,
        text: message.text,
        sender: message.sender,
        timestamp: message.timestamp,
        roomId: message.roomId,
        status: 'read',
      };
      
      await chatStorageService.saveMessage(roomId, storedMessage);
      
      // 채팅방 마지막 메시지 업데이트
      await chatStorageService.updateLastMessage(roomId, message.text, message.timestamp);
      
      console.log(`💾 로컬 저장 완료: ${roomId}에 메시지 저장`);
    } catch (error) {
      console.error('❌ 로컬 메시지 저장 실패:', error);
    }
  }

  // 채팅방 나가기 시 로컬 데이터 삭제
  async deleteChatRoomData(roomId: string): Promise<void> {
    try {
      await chatStorageService.deleteChatRoom(roomId);
      console.log(`🗑️ 로컬 데이터 삭제 완료: ${roomId}`);
    } catch (error) {
      console.error('❌ 로컬 데이터 삭제 실패:', error);
    }
  }
}

// 싱글톤 인스턴스
export const socketChatService = new SocketChatManager();

// 사용 예시:
// socketChatService.joinRoom('room123');
// socketChatService.sendMessage('room123', '안녕하세요!');
// socketChatService.onMessage((message) => console.log('새 메시지:', message));
// socketChatService.sendTyping('room123', true);
