import { io, Socket } from 'socket.io-client';

interface SocketService {
  connect: (serverUrl: string) => Promise<boolean>;
  disconnect: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (roomId: string, message: any) => void;
  onMessage: (callback: (data: any) => void) => void;
  onUserJoined: (callback: (data: any) => void) => void;
  onUserLeft: (callback: (data: any) => void) => void;
  onMatchFound: (callback: (data: any) => void) => void;
  onMatchError: (callback: (error: any) => void) => void;
  requestMatch: (userInfo: any) => void;
  cancelMatch: () => void;
  isConnected: () => boolean;
}

class SocketManager implements SocketService {
  private socket: Socket | null = null;
  private currentRooms: Set<string> = new Set();

  // 서버 연결
  async connect(serverUrl: string): Promise<boolean> {
    try {
      console.log('🔌 Socket.io 서버 연결 시도:', serverUrl);
      
      this.socket = io(serverUrl, {
        timeout: 5000,
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });

      return new Promise((resolve) => {
        if (!this.socket) {
          resolve(false);
          return;
        }

        this.socket.on('connect', () => {
          console.log('✅ Socket.io 연결 성공:', this.socket?.id);
          resolve(true);
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Socket.io 연결 실패:', error);
          resolve(false);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 Socket.io 연결 해제:', reason);
        });

        // 5초 타임아웃
        setTimeout(() => {
          if (!this.socket?.connected) {
            console.log('⏰ Socket.io 연결 타임아웃');
            resolve(false);
          }
        }, 5000);
      });
    } catch (error) {
      console.error('❌ Socket.io 연결 오류:', error);
      return false;
    }
  }

  // 연결 해제
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Socket.io 연결 해제');
      this.socket.disconnect();
      this.socket = null;
      this.currentRooms.clear();
    }
  }

  // 채팅방 입장
  joinRoom(roomId: string): void {
    if (this.socket && this.socket.connected) {
      console.log('🏠 채팅방 입장:', roomId);
      this.socket.emit('join_room', { roomId });
      this.currentRooms.add(roomId);
    } else {
      console.error('❌ Socket 연결되지 않음 - 채팅방 입장 실패');
    }
  }

  // 채팅방 퇴장
  leaveRoom(roomId: string): void {
    if (this.socket && this.socket.connected) {
      console.log('🚪 채팅방 퇴장:', roomId);
      this.socket.emit('leave_room', { roomId });
      this.currentRooms.delete(roomId);
    }
  }

  // 메시지 전송
  sendMessage(roomId: string, message: any): void {
    if (this.socket && this.socket.connected) {
      const messageData = {
        roomId,
        message: message.text,
        timestamp: new Date().toISOString(),
        messageId: Date.now().toString(),
        ...message
      };
      
      console.log('💬 메시지 전송:', messageData);
      this.socket.emit('send_message', messageData);
    } else {
      console.error('❌ Socket 연결되지 않음 - 메시지 전송 실패');
    }
  }

  // 메시지 수신 리스너
  onMessage(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('receive_message', (data) => {
        console.log('📨 메시지 수신:', data);
        callback(data);
      });
    }
  }

  // 사용자 입장 리스너
  onUserJoined(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('user_joined', (data) => {
        console.log('👋 사용자 입장:', data);
        callback(data);
      });
    }
  }

  // 사용자 퇴장 리스너
  onUserLeft(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('user_left', (data) => {
        console.log('👋 사용자 퇴장:', data);
        callback(data);
      });
    }
  }

  // 매칭 성공 리스너
  onMatchFound(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('match_found', (data) => {
        console.log('💫 매칭 성공:', data);
        callback(data);
      });
    }
  }

  // 매칭 에러 리스너
  onMatchError(callback: (error: any) => void): void {
    if (this.socket) {
      this.socket.on('match_error', (error) => {
        console.log('❌ 매칭 에러:', error);
        callback(error);
      });
    }
  }

  // 매칭 요청
  requestMatch(userInfo: any): void {
    if (this.socket && this.socket.connected) {
      console.log('🔍 매칭 요청:', userInfo);
      this.socket.emit('request_match', userInfo);
    } else {
      console.error('❌ Socket 연결되지 않음 - 매칭 요청 실패');
    }
  }

  // 매칭 취소
  cancelMatch(): void {
    if (this.socket && this.socket.connected) {
      console.log('❌ 매칭 취소');
      this.socket.emit('cancel_match');
    }
  }

  // 연결 상태 확인
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // 현재 참여중인 방 목록
  getCurrentRooms(): string[] {
    return Array.from(this.currentRooms);
  }

  // 타이핑 상태 전송
  sendTyping(roomId: string, isTyping: boolean): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing', { roomId, isTyping });
    }
  }

  // 타이핑 상태 수신
  onTyping(callback: (data: { roomId: string; userId: string; isTyping: boolean }) => void): void {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }
}

// 싱글톤 인스턴스
export const socketService = new SocketManager();

// 사용 예시:
// await socketService.connect('http://localhost:3000');
// socketService.joinRoom('room123');
// socketService.sendMessage('room123', { text: '안녕하세요!' });
// socketService.onMessage((data) => console.log('새 메시지:', data));
