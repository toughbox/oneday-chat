import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StoredMessage {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
  roomId: string;
  status?: 'sending' | 'sent' | 'read';
}

export interface ChatRoom {
  roomId: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  createdAt: string;
}

class ChatStorageManager {
  private readonly MESSAGES_KEY = 'CHAT_MESSAGES';
  private readonly ROOMS_KEY = 'CHAT_ROOMS';

  // 메시지 저장
  async saveMessage(roomId: string, message: StoredMessage): Promise<void> {
    try {
      const existingMessages = await this.getMessages(roomId);
      const updatedMessages = [...existingMessages, message];
      
      const key = `${this.MESSAGES_KEY}_${roomId}`;
      await AsyncStorage.setItem(key, JSON.stringify(updatedMessages));
      
      console.log(`💾 로컬 저장: ${roomId}에 메시지 저장 완료`);
    } catch (error) {
      console.error('❌ 메시지 저장 실패:', error);
      throw error;
    }
  }

  // 특정 방의 모든 메시지 조회
  async getMessages(roomId: string): Promise<StoredMessage[]> {
    try {
      const key = `${this.MESSAGES_KEY}_${roomId}`;
      const messagesJson = await AsyncStorage.getItem(key);
      
      if (messagesJson) {
        const messages = JSON.parse(messagesJson) as StoredMessage[];
        console.log(`📚 로컬 조회: ${roomId}에서 ${messages.length}개 메시지 불러옴`);
        return messages;
      }
      
      return [];
    } catch (error) {
      console.error('❌ 메시지 조회 실패:', error);
      return [];
    }
  }

  // 메시지 상태 업데이트 (전송 상태 등)
  async updateMessageStatus(roomId: string, messageId: string, status: 'sending' | 'sent' | 'read'): Promise<void> {
    try {
      const messages = await this.getMessages(roomId);
      const updatedMessages = messages.map(msg => 
        msg.id === messageId ? { ...msg, status } : msg
      );
      
      const key = `${this.MESSAGES_KEY}_${roomId}`;
      await AsyncStorage.setItem(key, JSON.stringify(updatedMessages));
      
      console.log(`📝 메시지 상태 업데이트: ${messageId} -> ${status}`);
    } catch (error) {
      console.error('❌ 메시지 상태 업데이트 실패:', error);
    }
  }

  // 특정 방의 메시지 삭제
  async deleteRoomMessages(roomId: string): Promise<void> {
    try {
      const key = `${this.MESSAGES_KEY}_${roomId}`;
      await AsyncStorage.removeItem(key);
      
      console.log(`🗑️ 로컬 삭제: ${roomId}의 모든 메시지 삭제 완료`);
    } catch (error) {
      console.error('❌ 메시지 삭제 실패:', error);
    }
  }

  // 채팅방 정보 저장
  async saveChatRoom(room: ChatRoom): Promise<void> {
    try {
      const existingRooms = await this.getChatRooms();
      const updatedRooms = existingRooms.filter(r => r.roomId !== room.roomId);
      updatedRooms.push(room);
      
      await AsyncStorage.setItem(this.ROOMS_KEY, JSON.stringify(updatedRooms));
      
      console.log(`💾 채팅방 정보 저장: ${room.roomId}`);
    } catch (error) {
      console.error('❌ 채팅방 정보 저장 실패:', error);
    }
  }

  // 모든 채팅방 정보 조회
  async getChatRooms(): Promise<ChatRoom[]> {
    try {
      const roomsJson = await AsyncStorage.getItem(this.ROOMS_KEY);
      
      if (roomsJson) {
        const rooms = JSON.parse(roomsJson) as ChatRoom[];
        console.log(`📚 채팅방 목록 조회: ${rooms.length}개 방`);
        return rooms;
      }
      
      return [];
    } catch (error) {
      console.error('❌ 채팅방 목록 조회 실패:', error);
      return [];
    }
  }

  // 채팅방 마지막 메시지 업데이트
  async updateLastMessage(roomId: string, lastMessage: string, timestamp: string): Promise<void> {
    try {
      const rooms = await this.getChatRooms();
      const existingRoom = rooms.find(r => r.roomId === roomId);
      
      if (existingRoom) {
        existingRoom.lastMessage = lastMessage;
        existingRoom.lastMessageTime = timestamp;
        await this.saveChatRoom(existingRoom);
      } else {
        // 새 채팅방 생성
        const newRoom: ChatRoom = {
          roomId,
          lastMessage,
          lastMessageTime: timestamp,
          unreadCount: 0,
          createdAt: new Date().toISOString()
        };
        await this.saveChatRoom(newRoom);
      }
      
      console.log(`📝 마지막 메시지 업데이트: ${roomId}`);
    } catch (error) {
      console.error('❌ 마지막 메시지 업데이트 실패:', error);
    }
  }

  // 채팅방 삭제
  async deleteChatRoom(roomId: string): Promise<void> {
    try {
      // 메시지 삭제
      await this.deleteRoomMessages(roomId);
      
      // 채팅방 목록에서 제거
      const rooms = await this.getChatRooms();
      const updatedRooms = rooms.filter(r => r.roomId !== roomId);
      await AsyncStorage.setItem(this.ROOMS_KEY, JSON.stringify(updatedRooms));
      
      console.log(`🗑️ 채팅방 완전 삭제: ${roomId}`);
    } catch (error) {
      console.error('❌ 채팅방 삭제 실패:', error);
    }
  }

  // 읽지 않은 메시지 수 업데이트
  async updateUnreadCount(roomId: string, count: number): Promise<void> {
    try {
      const rooms = await this.getChatRooms();
      const room = rooms.find(r => r.roomId === roomId);
      
      if (room) {
        room.unreadCount = count;
        await this.saveChatRoom(room);
        console.log(`📝 읽지 않은 메시지 수 업데이트: ${roomId} -> ${count}`);
      }
    } catch (error) {
      console.error('❌ 읽지 않은 메시지 수 업데이트 실패:', error);
    }
  }

  // 모든 데이터 삭제 (자정 리셋용)
  async clearAllData(): Promise<void> {
    try {
      // 모든 채팅방 조회
      const rooms = await this.getChatRooms();
      
      // 각 방의 메시지 삭제
      for (const room of rooms) {
        await this.deleteRoomMessages(room.roomId);
      }
      
      // 채팅방 목록 삭제
      await AsyncStorage.removeItem(this.ROOMS_KEY);
      
      console.log('🌙 자정 리셋: 모든 로컬 데이터 삭제 완료');
    } catch (error) {
      console.error('❌ 전체 데이터 삭제 실패:', error);
    }
  }

  // 디버그용: 저장된 모든 키 조회
  async getAllStorageKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const chatKeys = keys.filter(key => 
        key.startsWith(this.MESSAGES_KEY) || key === this.ROOMS_KEY
      );
      
      console.log('🔍 채팅 관련 저장소 키들:', chatKeys);
      return chatKeys;
    } catch (error) {
      console.error('❌ 저장소 키 조회 실패:', error);
      return [];
    }
  }

  // 디버그용: 전체 저장소 상태 출력
  async debugStorageState(): Promise<void> {
    try {
      const rooms = await this.getChatRooms();
      console.log('🔍 [DEBUG] 저장된 채팅방들:', rooms);
      
      for (const room of rooms) {
        const messages = await this.getMessages(room.roomId);
        console.log(`🔍 [DEBUG] ${room.roomId}의 메시지 수: ${messages.length}`);
      }
    } catch (error) {
      console.error('❌ 디버그 상태 조회 실패:', error);
    }
  }
}

// 싱글톤 인스턴스
export const chatStorageService = new ChatStorageManager();
