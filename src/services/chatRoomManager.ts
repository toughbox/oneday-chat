import AsyncStorage from '@react-native-async-storage/async-storage';
import { chatStorageService } from './chatStorageService';

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
  initialize: () => Promise<void>;
  getChatRooms: () => ChatRoom[];
  addChatRoom: (room: Omit<ChatRoom, 'lastMessage' | 'lastMessageTime' | 'unreadCount' | 'isActive'>) => Promise<void>;
  removeChatRoom: (roomId: string) => Promise<void>;
  updateLastMessage: (roomId: string, message: string, timestamp: Date) => Promise<void>;
  updateUnreadCount: (roomId: string, count: number) => Promise<void>;
  resetUnreadCount: (roomId: string) => Promise<void>;
  incrementUnreadCount: (roomId: string) => Promise<void>;
  deactivateChatRoom: (roomId: string) => Promise<void>;
  clearAllChatRooms: () => Promise<void>;
  onChatRoomsChange: (callback: (rooms: ChatRoom[]) => void) => void;
  offChatRoomsChange: (callback: (rooms: ChatRoom[]) => void) => void;
}

class ChatRoomManagerImpl implements ChatRoomManager {
  private chatRooms: ChatRoom[] = [];
  private changeCallbacks: ((rooms: ChatRoom[]) => void)[] = [];
  private readonly STORAGE_KEY = '@chat_rooms';
  private isInitialized = false;

  // 초기화 (앱 시작 시 호출)
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await this.loadFromStorage();
      this.isInitialized = true;
      console.log('✅ ChatRoomManager 초기화 완료');
    } catch (error) {
      console.error('❌ ChatRoomManager 초기화 실패:', error);
      this.isInitialized = true; // 실패해도 초기화 완료로 처리
    }
  }

  // 로컬 저장소에서 대화방 목록 불러오기
  private async loadFromStorage(): Promise<void> {
    try {
      const storedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (storedData) {
        const parsedRooms = JSON.parse(storedData);
        // Date 객체 복원
        this.chatRooms = parsedRooms.map((room: any) => ({
          ...room,
          lastMessageTime: new Date(room.lastMessageTime),
        }));
        console.log(`📚 로컬에서 ${this.chatRooms.length}개 대화방 불러옴`);
      }
    } catch (error) {
      console.error('❌ 대화방 목록 불러오기 실패:', error);
    }
  }

  // 로컬 저장소에 대화방 목록 저장
  private async saveToStorage(): Promise<void> {
    try {
      const dataToStore = JSON.stringify(this.chatRooms);
      await AsyncStorage.setItem(this.STORAGE_KEY, dataToStore);
      console.log(`💾 ${this.chatRooms.length}개 대화방 저장 완료`);
    } catch (error) {
      console.error('❌ 대화방 목록 저장 실패:', error);
    }
  }

  // 대화방 목록 가져오기
  getChatRooms(): ChatRoom[] {
    return [...this.chatRooms];
  }

  // 새 대화방 추가
  async addChatRoom(room: Omit<ChatRoom, 'lastMessage' | 'lastMessageTime' | 'unreadCount' | 'isActive'>): Promise<void> {
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
    await this.saveToStorage(); // 저장소에 저장
    this.notifyChange();
  }

  // 대화방 제거
  async removeChatRoom(roomId: string): Promise<void> {
    const initialLength = this.chatRooms.length;
    
    // roomId와 id 모두 확인하여 제거
    const roomToRemove = this.chatRooms.find(room => 
      room.roomId === roomId || room.id === roomId
    );
    
    if (roomToRemove) {
      console.log('🗑️ 제거할 대화방 찾음:', {
        roomId: roomToRemove.roomId,
        id: roomToRemove.id,
        partnerNickname: roomToRemove.partnerNickname,
        partnerUserId: roomToRemove.partnerUserId
      });
      
      // 1. chatStorageService에서도 대화방 데이터 완전 삭제
      try {
        await chatStorageService.deleteChatRoom(roomId);
        console.log('✅ chatStorageService에서 대화방 데이터 삭제 완료:', roomId);
      } catch (error) {
        console.error('❌ chatStorageService 삭제 실패:', error);
      }
      
      // 2. 메모리에서 대화방 제거
      this.chatRooms = this.chatRooms.filter(room => 
        !(room.roomId === roomId || room.id === roomId)
      );
      
      console.log('✅ 대화방 제거 완료:', roomId);
      console.log('📊 제거 후 대화방 개수:', this.chatRooms.length);
      
      // 현재 활성 대화방 상태 로그
      const activeRooms = this.chatRooms.filter(room => room.isActive);
      console.log('🔍 현재 활성 대화방:', activeRooms.map(r => ({
        roomId: r.roomId,
        partnerNickname: r.partnerNickname,
        partnerUserId: r.partnerUserId
      })));
      
      // 3. AsyncStorage에 저장 (chatRoomManager용 키)
      await this.saveToStorage();
      
      // 4. 추가로 @chat_rooms 키도 직접 확인하여 완전 삭제
      try {
        const remainingData = await AsyncStorage.getItem(this.STORAGE_KEY);
        if (remainingData) {
          const remainingRooms = JSON.parse(remainingData);
          console.log('🔍 AsyncStorage에 남아있는 대화방:', remainingRooms.length);
          
          // 만약 여전히 데이터가 남아있다면 강제로 삭제
          if (remainingRooms.length > 0) {
            await AsyncStorage.removeItem(this.STORAGE_KEY);
            console.log('🗑️ @chat_rooms 키 완전 삭제 완료');
          }
        }
      } catch (error) {
        console.error('❌ AsyncStorage 확인/삭제 실패:', error);
      }
      
      this.notifyChange();
    } else {
      console.warn('⚠️ 제거할 대화방을 찾을 수 없음:', roomId);
      console.log('🔍 현재 대화방 목록:', this.chatRooms.map(r => ({
        roomId: r.roomId,
        id: r.id,
        partnerNickname: r.partnerNickname
      })));
    }
  }

  // 마지막 메시지 업데이트
  async updateLastMessage(roomId: string, message: string, timestamp: Date): Promise<void> {
    const room = this.chatRooms.find(r => r.roomId === roomId);
    if (room) {
      room.lastMessage = message;
      room.lastMessageTime = timestamp;
      await this.saveToStorage(); // 저장소에 저장
      this.notifyChange();
    }
  }

  // 읽지 않은 메시지 수 업데이트
  async updateUnreadCount(roomId: string, count: number): Promise<void> {
    const room = this.chatRooms.find(r => r.roomId === roomId);
    if (room) {
      room.unreadCount = count;
      await this.saveToStorage(); // 저장소에 저장
      this.notifyChange();
    }
  }

  // 읽지 않은 메시지 수 초기화
  async resetUnreadCount(roomId: string): Promise<void> {
    const room = this.chatRooms.find(r => r.roomId === roomId);
    if (room) {
      room.unreadCount = 0;
      await this.saveToStorage(); // 저장소에 저장
      this.notifyChange();
    }
  }

  // 읽지 않은 메시지 수 증가
  async incrementUnreadCount(roomId: string): Promise<void> {
    const room = this.chatRooms.find(r => r.roomId === roomId);
    if (room) {
      room.unreadCount += 1;
      console.log(`📬 대화방 ${roomId} 읽지 않은 메시지 수: ${room.unreadCount}`);
      await this.saveToStorage(); // 저장소에 저장
      this.notifyChange();
    }
  }

  // 모든 대화방 삭제
  async clearAllChatRooms(): Promise<void> {
    this.chatRooms = [];
    console.log('🧹 모든 대화방 삭제 완료');
    await this.saveToStorage(); // 저장소에 저장
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
    const hasActiveRoom = this.chatRooms.some(room => 
      room.partnerUserId === partnerUserId && room.isActive
    );
    
    console.log('🔍 ID 기반 활성 대화방 확인:', {
      partnerUserId,
      hasActiveRoom,
      totalRooms: this.chatRooms.length,
      activeRooms: this.chatRooms.filter(r => r.isActive).map(r => ({
        roomId: r.roomId,
        partnerUserId: r.partnerUserId,
        partnerNickname: r.partnerNickname
      }))
    });
    
    return hasActiveRoom;
  }

  // 특정 파트너와의 활성 대화방이 있는지 확인 (닉네임 기반)
  hasActiveRoomWithPartnerNickname(partnerNickname: string): boolean {
    const hasActiveRoom = this.chatRooms.some(room => 
      room.partnerNickname === partnerNickname && room.isActive
    );
    
    console.log('🔍 닉네임 기반 활성 대화방 확인:', {
      partnerNickname,
      hasActiveRoom,
      totalRooms: this.chatRooms.length,
      activeRooms: this.chatRooms.filter(r => r.isActive).map(r => ({
        roomId: r.roomId,
        partnerUserId: r.partnerUserId,
        partnerNickname: r.partnerNickname
      }))
    });
    
    return hasActiveRoom;
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
  async deactivateChatRoom(roomId: string): Promise<void> {
    const room = this.chatRooms.find(r => r.roomId === roomId);
    if (room) {
      room.isActive = false;
      console.log('🔒 대화방 비활성화:', roomId);
      await this.saveToStorage(); // 저장소에 저장
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