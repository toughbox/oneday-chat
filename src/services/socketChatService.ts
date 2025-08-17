import { socketService } from './socketService';
import { serverConfig } from '../config/serverConfig';

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
}

class SocketChatManager implements SocketChatService {
  private currentUserId: string;

  constructor() {
    this.currentUserId = this.generateUserId();
    this.initializeListeners();
  }

  // Socket 이벤트 리스너 초기화
  private initializeListeners(): void {
    // 메시지 수신
    socketService.onMessage((data) => {
      const message: Message = {
        id: data.messageId || Date.now().toString(),
        text: data.message,
        sender: data.userId === this.currentUserId ? 'me' : 'other',
        timestamp: data.timestamp || new Date().toISOString(),
        roomId: data.roomId,
      };

      if (this.messageCallback) {
        this.messageCallback(message);
      }
    });

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
    const message = {
      text,
      userId: this.currentUserId,
      timestamp: new Date().toISOString(),
      messageId: Date.now().toString(),
    };

    console.log('💬 Socket 메시지 전송:', message);
    socketService.sendMessage(roomId, message);
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
}

// 싱글톤 인스턴스
export const socketChatService = new SocketChatManager();

// 사용 예시:
// socketChatService.joinRoom('room123');
// socketChatService.sendMessage('room123', '안녕하세요!');
// socketChatService.onMessage((message) => console.log('새 메시지:', message));
// socketChatService.sendTyping('room123', true);
