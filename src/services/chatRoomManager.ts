// 대화방 관리 서비스
export interface ChatRoom {
  id: string;
  partnerName: string;
  partnerNickname: string;
  partnerUserId?: string; // 파트너의 고유 ID 추가
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
  updateUnreadCount: (roomId: string, count: number) => void;
  resetUnreadCount: (roomId: string) => void;
  clearAllChatRooms: () => void;
  onChatRoomsChange: (callback: (rooms: ChatRoom[]) => void) => void;
  offChatRoomsChange: (callback: (rooms: ChatRoom[]) => void) => void;
}

class ChatRoomManagerImpl implements ChatRoomManager {
  private chatRooms: ChatRoom[] = [];
  private changeCallbacks: ((rooms: ChatRoom[]) => void)[] = [];

  // 대화방 목록 가져오기
  getChatRooms(): ChatRoom[] {
    return [...this.chatRooms];
  }

  // 새 대화방 추가
  addChatRoom(room: Omit<ChatRoom, 'lastMessage' | 'lastMessageTime' | 'unreadCount' | 'isActive'>): void {
    // 중복 체크
    const existingRoom = this.chatRooms.find(r => r.roomId === room.roomId);
    if (existingRoom) {
      console.log('⚠️ 이미 존재하는 대화방:', room.roomId);
      return;
    }

    const newRoom: ChatRoom = {
      ...room,
      lastMessage: '',
      lastMessageTime: new Date(),
      unreadCount: 0,
      isActive: true, // 새로 추가된 방은 활성 상태
    };

    this.chatRooms.push(newRoom);
    console.log('✅ 새 대화방 추가:', newRoom);
    this.notifyChange();
  }

  // 대화방 제거
  removeChatRoom(roomId: string): void {
    const initialLength = this.chatRooms.length;
    this.chatRooms = this.chatRooms.filter(room => room.roomId !== roomId);
    
    if (this.chatRooms.length < initialLength) {
      console.log('✅ 대화방 제거 완료:', roomId);
      this.notifyChange();
    }
  }

  // 마지막 메시지 업데이트
  updateLastMessage(roomId: string, message: string, timestamp: Date): void {
    const room = this.chatRooms.find(r => r.roomId === roomId);
    if (room) {
      room.lastMessage = message;
      room.lastMessageTime = timestamp;
      this.notifyChange();
    }
  }

  // 읽지 않은 메시지 수 업데이트
  updateUnreadCount(roomId: string, count: number): void {
    const room = this.chatRooms.find(r => r.roomId === roomId);
    if (room) {
      room.unreadCount = count;
      this.notifyChange();
    }
  }

  // 읽지 않은 메시지 수 초기화
  resetUnreadCount(roomId: string): void {
    const room = this.chatRooms.find(r => r.roomId === roomId);
    if (room) {
      room.unreadCount = 0;
      this.notifyChange();
    }
  }

  // 모든 대화방 삭제
  clearAllChatRooms(): void {
    this.chatRooms = [];
    console.log('🧹 모든 대화방 삭제 완료');
    this.notifyChange();
  }

  // 변경 사항 알림 등록
  onChatRoomsChange(callback: (rooms: ChatRoom[]) => void): void {
    this.changeCallbacks.push(callback);
  }

  // 변경 사항 알림 해제
  offChatRoomsChange(callback: (rooms: ChatRoom[]) => void): void {
    this.changeCallbacks = this.changeCallbacks.filter(cb => cb !== callback);
  }

  // 변경 사항 알림
  private notifyChange(): void {
    const rooms = this.getChatRooms();
    this.changeCallbacks.forEach(callback => {
      try {
        callback(rooms);
      } catch (error) {
        console.error('❌ 대화방 변경 콜백 실행 오류:', error);
      }
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

  // 특정 파트너와의 활성 대화방이 있는지 확인 (ID 기반)
  hasActiveRoomWithPartner(partnerUserId: string): boolean {
    return this.chatRooms.some(room => 
      room.partnerUserId === partnerUserId && room.isActive
    );
  }

  // 특정 파트너와의 활성 대화방이 있는지 확인 (닉네임 기반)
  hasActiveRoomWithPartnerNickname(partnerNickname: string): boolean {
    return this.chatRooms.some(room => 
      room.partnerNickname === partnerNickname && room.isActive
    );
  }

  // 활성 대화방 개수 확인
  getActiveRoomCount(): number {
    return this.chatRooms.filter(room => room.isActive).length;
  }

  // 최대 대화방 개수
  getMaxRoomCount(): number {
    return 5;
  }

  // 특정 대화방 비활성화
  deactivateChatRoom(roomId: string): void {
    const room = this.chatRooms.find(r => r.roomId === roomId);
    if (room) {
      room.isActive = false;
      console.log('🔒 대화방 비활성화:', roomId);
      this.notifyChange();
    }
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