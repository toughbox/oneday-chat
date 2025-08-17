// 대화방 관리 서비스
export interface ChatRoom {
  id: string;
  partnerName: string;
  partnerNickname: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isActive: boolean;
  avatar: string;
  roomId: string; // Socket.io room ID
}

interface ChatRoomManager {
  getChatRooms: () => ChatRoom[];
  addChatRoom: (room: Omit<ChatRoom, 'lastMessage' | 'lastMessageTime' | 'unreadCount' | 'isActive'>) => void;
  removeChatRoom: (roomId: string) => void;
  updateLastMessage: (roomId: string, message: string, timestamp: Date) => void;
  incrementUnreadCount: (roomId: string) => void;
  resetUnreadCount: (roomId: string) => void;
  onChatRoomsChange: (callback: (rooms: ChatRoom[]) => void) => void;
  clearAllChatRooms: () => void;
}

class ChatRoomManagerImpl implements ChatRoomManager {
  private chatRooms: ChatRoom[] = [];
  private changeCallback?: (rooms: ChatRoom[]) => void;

  getChatRooms(): ChatRoom[] {
    // 최근 메시지 시간 순으로 정렬
    return [...this.chatRooms].sort((a, b) => 
      b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
    );
  }

  addChatRoom(room: Omit<ChatRoom, 'lastMessage' | 'lastMessageTime' | 'unreadCount' | 'isActive'>): void {
    // 이미 존재하는 방인지 확인
    const existingRoom = this.chatRooms.find(r => r.roomId === room.roomId);
    if (existingRoom) {
      console.log('⚠️ 이미 존재하는 대화방:', room.roomId);
      return;
    }

    const newChatRoom: ChatRoom = {
      ...room,
      lastMessage: '대화를 시작해보세요! 💬',
      lastMessageTime: new Date(),
      unreadCount: 0,
      isActive: true,
    };

    this.chatRooms.push(newChatRoom);
    console.log('🏠 새 대화방 추가:', newChatRoom);
    this.notifyChange();
  }

  removeChatRoom(roomId: string): void {
    const initialLength = this.chatRooms.length;
    this.chatRooms = this.chatRooms.filter(room => room.roomId !== roomId);
    
    if (this.chatRooms.length < initialLength) {
      console.log('🗑️ 대화방 삭제:', roomId);
      this.notifyChange();
    }
  }

  updateLastMessage(roomId: string, message: string, timestamp: Date): void {
    const room = this.chatRooms.find(r => r.roomId === roomId);
    if (room) {
      room.lastMessage = message;
      room.lastMessageTime = timestamp;
      console.log('💬 마지막 메시지 업데이트:', roomId, message);
      this.notifyChange();
    }
  }

  incrementUnreadCount(roomId: string): void {
    const room = this.chatRooms.find(r => r.roomId === roomId);
    if (room) {
      room.unreadCount += 1;
      console.log('📬 읽지 않은 메시지 증가:', roomId, room.unreadCount);
      this.notifyChange();
    }
  }

  resetUnreadCount(roomId: string): void {
    const room = this.chatRooms.find(r => r.roomId === roomId);
    if (room) {
      room.unreadCount = 0;
      console.log('📭 읽지 않은 메시지 초기화:', roomId);
      this.notifyChange();
    }
  }

  onChatRoomsChange(callback: (rooms: ChatRoom[]) => void): void {
    this.changeCallback = callback;
  }

  clearAllChatRooms(): void {
    console.log('🧹 모든 대화방 삭제');
    this.chatRooms = [];
    this.notifyChange();
  }

  private notifyChange(): void {
    if (this.changeCallback) {
      this.changeCallback(this.getChatRooms());
    }
  }

  // 개발용: 대화방 목록 로그 출력
  logChatRooms(): void {
    console.log('📋 현재 대화방 목록:');
    this.chatRooms.forEach((room, index) => {
      console.log(`${index + 1}. ${room.partnerName} (${room.roomId}) - ${room.lastMessage}`);
    });
  }

  // 대화방 존재 여부 확인
  hasChatRoom(roomId: string): boolean {
    return this.chatRooms.some(room => room.roomId === roomId);
  }

  // 특정 대화방 정보 가져오기
  getChatRoom(roomId: string): ChatRoom | undefined {
    return this.chatRooms.find(room => room.roomId === roomId);
  }
}

// 싱글톤 인스턴스
export const chatRoomManager = new ChatRoomManagerImpl();

// 자정 리셋 서비스와 연동
import { midnightResetService } from '../utils/midnightReset';

// 자정에 모든 대화방 삭제
const originalOnDataClear = midnightResetService.onDataClear;
midnightResetService.onDataClear = () => {
  chatRoomManager.clearAllChatRooms();
  if (originalOnDataClear) {
    originalOnDataClear();
  }
};
