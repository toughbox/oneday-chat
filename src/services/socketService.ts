import { io, Socket } from 'socket.io-client';
import { userSessionManager } from './userSessionManager';

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
          
          // 모든 이벤트 감지를 위한 와일드카드 리스너
          if (this.socket) {
            this.socket.onAny((eventName, ...args) => {
              console.log(`🎯 서버에서 받은 이벤트: ${eventName}`, args);
              console.log('🔥🔥🔥 SERVER EVENT RECEIVED 🔥🔥🔥', eventName);
            });
          }
          
          // 연결 성공 후 사용자 등록
          if (this.socket) {
            const userInfo = {
              userId: userSessionManager.getUserId(),
              nickname: userSessionManager.getNickname(),
              mood: 'neutral'
            };
            this.socket.emit('register_user', userInfo);
            console.log('👤 사용자 등록 완료:', userInfo);
          }
          
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
    console.log('🔍 소켓 상태 확인:', {
      socket: !!this.socket,
      connected: this.socket?.connected,
      roomId,
      message
    });
    
    if (this.socket && this.socket.connected) {
      const messageData = {
        roomId,
        message: message.text,
        timestamp: new Date().toISOString(),
        messageId: Date.now().toString(),
        sender: message.userId, // sender 정보 추가
        ...message
      };
      
      console.log('💬 메시지 전송:', messageData);
      this.socket.emit('send_message', messageData);
      console.log('🔥🔥🔥 MESSAGE EMITTED TO SERVER 🔥🔥🔥');
    } else {
      console.error('❌ Socket 연결되지 않음 - 메시지 전송 실패');
      console.error('🔥🔥🔥 SOCKET NOT CONNECTED 🔥🔥🔥');
    }
  }

  // 메시지 수신 리스너
  onMessage(callback: (data: any) => void): void {
    if (this.socket) {
      // 가능한 모든 메시지 이벤트 리스닝 (서버에서 사용할 수 있는 모든 이벤트명)
      const messageEvents = [
        'receive_message', 'message', 'new_message', 'chat_message', 
        'send_message', 'message_received', 'room_message', 'user_message'
      ];
      
      messageEvents.forEach(eventName => {
        this.socket.off(eventName);
        this.socket.on(eventName, (data) => {
          console.log(`📨 socketService ${eventName} 수신:`, data);
          console.log('🔥🔥🔥 SOCKET SERVICE RECEIVED MESSAGE 🔥🔥🔥');
          callback(data);
        });
      });
    }
  }

  // 사용자 입장 리스너
  onUserJoined(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('user_joined');
      this.socket.on('user_joined', (data) => {
        console.log('👋 사용자 입장:', data);
        callback(data);
      });
    }
  }

  // 사용자 퇴장 리스너
  onUserLeft(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('user_left');
      this.socket.on('user_left', (data) => {
        console.log('👋 사용자 퇴장:', data);
        callback(data);
      });
    }
  }

  // 매칭 성공 리스너
  onMatchFound(callback: (data: any) => void): void {
    if (this.socket) {
      // 기존 리스너 제거 후 새로 등록
      this.socket.off('match_found');
      this.socket.on('match_found', (data) => {
        console.log('💫 매칭 성공:', data);
        callback(data);
      });
    }
  }

  // 매칭 에러 리스너
  onMatchError(callback: (error: any) => void): void {
    if (this.socket) {
      // 기존 리스너 제거 후 새로 등록
      this.socket.off('match_error');
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
      this.socket.off('user_typing');
      this.socket.on('user_typing', callback);
    }
  }

  // 이전 메시지 수신 리스너
  onPreviousMessages(callback: (data: { roomId: string; messages: any[] }) => void): void {
    if (this.socket) {
      this.socket.on('previous_messages', (data) => {
        console.log('📚 이전 메시지 수신:', data);
        callback(data);
      });
    }
  }

  // 서버에 이전 메시지 요청
  requestPreviousMessages(roomId: string): void {
    if (this.socket && this.socket.connected) {
      console.log('📚 이전 메시지 요청:', roomId);
      this.socket.emit('request_previous_messages', { roomId });
    } else {
      console.error('❌ Socket 연결되지 않음 - 이전 메시지 요청 실패');
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
