import { socketService } from './socketService';
import { fcmService } from './fcmService';
import { userSessionManager } from './userSessionManager';
import { Alert } from 'react-native';

interface SocketMatchingService {
  requestMatch: (interests: string[], mood: string) => Promise<boolean>;
  cancelMatch: () => Promise<void>;
  onMatchFound: (callback: (matchData: any) => void) => void;
  isMatching: boolean;
}

class SocketMatchingManager implements SocketMatchingService {
  public isMatching: boolean = false;
  private matchFoundCallback?: (matchData: any) => void;
  private serverUrl: string = 'http://toughbox.iptime.org:3000'; // 홈서버 DDNS 주소
  private currentUserId: string = ''; // 앱 세션 동안 고정
  private currentNickname: string = ''; // 앱 세션 동안 고정

  constructor() {
    // 초기화는 연결 시에 수행
  }

  // Socket 이벤트 리스너 초기화 (연결 후)
  private initializeListeners(): void {
    console.log('🎧 Socket 매칭 서비스 리스너 초기화');
    
    // 매칭 성공 리스너
    socketService.onMatchFound((data) => {
      console.log('💫 Socket 매칭 성공 이벤트 수신:', data);
      this.isMatching = false;
      
      if (this.matchFoundCallback) {
        console.log('📞 매칭 콜백 실행');
        this.matchFoundCallback(data);
      } else {
        console.warn('⚠️ 매칭 콜백이 등록되지 않았습니다!');
      }

      // FCM 알림 발송
      this.sendMatchNotification(data.partnerNickname || '익명');
    });

    // 매칭 에러 리스너
    socketService.onMatchError((error) => {
      console.error('❌ Socket 매칭 에러:', error);
      this.isMatching = false;
      
      // 에러 메시지를 사용자에게 표시
      if (error.code === 'DUPLICATE_REQUEST') {
        Alert.alert('매칭 오류', '이미 매칭 대기 중입니다.');
      } else if (error.code === 'ALREADY_IN_ROOM') {
        Alert.alert('매칭 오류', '이미 대화방에 참여 중입니다.');
      } else {
        Alert.alert('매칭 오류', error.message || '알 수 없는 오류가 발생했습니다.');
      }
    });

    // 연결 해제시 매칭 상태 리셋
    // socketService에서 disconnect 이벤트 처리
  }

  // 매칭 요청
  async requestMatch(interests: string[] = [], mood: string = ''): Promise<boolean> {
    try {
      console.log('🔍 Socket 매칭 요청 시작');

      // 이미 매칭 중인지 확인
      if (this.isMatching) {
        console.log('⚠️ 이미 매칭 중입니다');
        return false;
      }

      // 서버 연결 확인/시도
      if (!socketService.isConnected()) {
        console.log('🔌 서버 연결 시도:', this.serverUrl);
        const connected = await socketService.connect(this.serverUrl);
        
        if (!connected) {
          console.error('❌ Socket 서버 연결 실패');
          return false;
        }
        
        // 연결 성공 후 이벤트 리스너 초기화
        this.initializeListeners();
      }

      // 사용자 정보 준비 (전역 세션에서 가져오기)
      const userId = userSessionManager.getUserId();
      const nickname = userSessionManager.getNickname();
      
      const userInfo = {
        userId,
        nickname,
        interests,
        mood,
        timestamp: Date.now(),
      };

      // 매칭 요청
      this.isMatching = true;
      socketService.requestMatch(userInfo);
      
      console.log('✅ Socket 매칭 요청 완료:', userInfo);
      return true;

    } catch (error) {
      console.error('❌ Socket 매칭 요청 실패:', error);
      this.isMatching = false;
      return false;
    }
  }

  // 매칭 취소
  async cancelMatch(): Promise<void> {
    try {
      if (this.isMatching) {
        console.log('❌ Socket 매칭 취소');
        socketService.cancelMatch();
        this.isMatching = false;
      }
    } catch (error) {
      console.error('❌ Socket 매칭 취소 실패:', error);
    }
  }

  // 매칭 결과 콜백 등록
  onMatchFound(callback: (matchData: any) => void): void {
    this.matchFoundCallback = callback;
  }

  // 매칭 성공 알림 발송
  private async sendMatchNotification(partnerNickname: string): Promise<void> {
    try {
      await fcmService.showLocalNotification(
        '💫 매칭 성공!',
        `${partnerNickname}님과 연결되었습니다!`
      );
    } catch (error) {
      console.error('❌ 매칭 알림 발송 실패:', error);
    }
  }

  // 임시 사용자 ID 생성
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 임시 닉네임 생성
  private generateNickname(): string {
    const adjectives = ['밤하늘', '새벽', '황혼', '달빛', '별빛'];
    const nouns = ['여행자', '방랑자', '탐험가', '몽상가', '관찰자'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 900) + 100;
    return `${adj}${noun}${num}`;
  }

  // 서버 URL 설정 (홈서버 IP 변경시)
  setServerUrl(url: string): void {
    this.serverUrl = url;
    console.log('🏠 홈서버 URL 변경:', url);
  }

  // 연결 상태 확인
  isConnected(): boolean {
    return socketService.isConnected();
  }

  // 서버 연결 해제
  disconnect(): void {
    socketService.disconnect();
    this.isMatching = false;
  }
}

// 싱글톤 인스턴스
export const socketMatchingService = new SocketMatchingManager();

// 사용 예시:
// socketMatchingService.setServerUrl('http://192.168.1.100:3000');
// await socketMatchingService.requestMatch(['음악', '영화'], '좋음');
// socketMatchingService.onMatchFound((data) => console.log('매칭됨:', data));
