import { getDatabase, ref, set, get, remove, onValue } from '@react-native-firebase/database';
import { fcmService } from './fcmService';

export interface MatchingUser {
  id: string;
  nickname: string;
  timestamp: number;
  fcmToken?: string;
  interests?: string[];
  mood?: string;
}

export interface MatchResult {
  roomId: string;
  partnerId: string;
  partnerNickname: string;
  partnerFcmToken?: string;
}

class MatchingManager {
  private userId: string = '';
  private userNickname: string = '';
  private fcmToken: string = '';
  private isMatching: boolean = false;
  private unsubscribeMatchListener: (() => void) | null = null;
  private db: any;

  constructor() {
    // Firebase Database 인스턴스 초기화 (Modular SDK)
    this.db = getDatabase();
  }

  // 사용자 정보 설정
  setUserInfo(userId: string, nickname: string) {
    this.userId = userId;
    this.userNickname = nickname;
  }

  // FCM 토큰 설정
  async setFcmToken() {
    this.fcmToken = await fcmService.getToken() || '';
  }

  // 매칭 요청
  async requestMatch(interests: string[] = [], mood: string = ''): Promise<boolean> {
    try {
      if (this.isMatching) {
        console.log('⚠️ 이미 매칭 중입니다');
        return false;
      }

      await this.setFcmToken();
      
      const userMatchData: MatchingUser = {
        id: this.userId,
        nickname: this.userNickname,
        timestamp: Date.now(),
        fcmToken: this.fcmToken,
        interests,
        mood
      };

      // 대기열에 추가 - Modular SDK 방식
      const waitingRef = ref(this.db, `waiting/${this.userId}`);
      await set(waitingRef, userMatchData);
      
      this.isMatching = true;
      console.log('📡 매칭 요청 완료:', this.userNickname);

      // 다른 대기자와 매칭 시도
      await this.tryMatch();
      
      // 매칭 결과 리스너 설정
      this.setupMatchListener();

      return true;
    } catch (error) {
      console.error('❌ 매칭 요청 실패:', error);
      this.isMatching = false;
      return false;
    }
  }

  // 매칭 시도
  private async tryMatch() {
    try {
      const waitingRef = ref(this.db, 'waiting');
      const waitingSnapshot = await get(waitingRef);
      const waitingUsers = waitingSnapshot.val();

      if (!waitingUsers) return;

      const userList = Object.values(waitingUsers) as MatchingUser[];
      
      // 자신 제외하고 가장 오래 기다린 사용자 찾기
      const otherUsers = userList.filter(user => user.id !== this.userId);
      
      if (otherUsers.length === 0) {
        console.log('⏳ 매칭 대기 중... (다른 사용자 없음)');
        return;
      }

      // 가장 오래 기다린 사용자와 매칭
      const partner = otherUsers.sort((a, b) => a.timestamp - b.timestamp)[0];
      
      // 매칭 성공 처리
      await this.createMatch(partner);

    } catch (error) {
      console.error('❌ 매칭 시도 실패:', error);
    }
  }

  // 매칭 성공 처리
  private async createMatch(partner: MatchingUser) {
    try {
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const matchData = {
        roomId,
        users: [this.userId, partner.id],
        userNicknames: [this.userNickname, partner.nickname],
        createdAt: Date.now(),
        status: 'active'
      };

      // 매칭 결과 저장 - Modular SDK
      const matchesRef = ref(this.db, `matches/${roomId}`);
      await set(matchesRef, matchData);

      // 양쪽 사용자에게 매칭 결과 전달
      const userResultRef = ref(this.db, `matchResults/${this.userId}`);
      await set(userResultRef, {
        roomId,
        partnerId: partner.id,
        partnerNickname: partner.nickname,
        partnerFcmToken: partner.fcmToken || '',
        timestamp: Date.now()
      });

      const partnerResultRef = ref(this.db, `matchResults/${partner.id}`);
      await set(partnerResultRef, {
        roomId,
        partnerId: this.userId,
        partnerNickname: this.userNickname,
        partnerFcmToken: this.fcmToken,
        timestamp: Date.now()
      });

      // 대기열에서 제거
      const userWaitingRef = ref(this.db, `waiting/${this.userId}`);
      const partnerWaitingRef = ref(this.db, `waiting/${partner.id}`);
      await remove(userWaitingRef);
      await remove(partnerWaitingRef);

      // FCM 푸시 알림 발송 (상대방에게)
      if (partner.fcmToken) {
        await this.sendMatchNotification(partner.fcmToken, this.userNickname);
      }

      console.log('🎉 매칭 성공!', {
        roomId,
        partner: partner.nickname
      });

    } catch (error) {
      console.error('❌ 매칭 생성 실패:', error);
    }
  }

  // 매칭 결과 리스너 설정 - Modular SDK
  private setupMatchListener() {
    const matchRef = ref(this.db, `matchResults/${this.userId}`);
    
    this.unsubscribeMatchListener = onValue(matchRef, (snapshot) => {
      const matchResult = snapshot.val();
      
      if (matchResult) {
        this.isMatching = false;
        
        // 매칭 결과 이벤트 발생
        this.onMatchFound?.(matchResult);
        
        // 리스너 해제
        this.removeMatchListener();
        
        // 매칭 결과 데이터 정리 (5초 후)
        setTimeout(() => {
          const resultRef = ref(this.db, `matchResults/${this.userId}`);
          remove(resultRef);
        }, 5000);
      }
    });
  }

  // 매칭 결과 콜백
  private onMatchFound?: (result: MatchResult) => void;

  // 매칭 결과 리스너 등록
  setMatchFoundCallback(callback: (result: MatchResult) => void) {
    this.onMatchFound = callback;
  }

  // 매칭 취소
  async cancelMatch(): Promise<boolean> {
    try {
      if (!this.isMatching) {
        return false;
      }

      // 대기열에서 제거
      const waitingRef = ref(this.db, `waiting/${this.userId}`);
      await remove(waitingRef);
      
      // 리스너 해제
      this.removeMatchListener();
      
      this.isMatching = false;
      console.log('🚫 매칭 취소됨');
      
      return true;
    } catch (error) {
      console.error('❌ 매칭 취소 실패:', error);
      return false;
    }
  }

  // 매칭 리스너 해제 - Modular SDK
  private removeMatchListener() {
    if (this.unsubscribeMatchListener) {
      this.unsubscribeMatchListener();
      this.unsubscribeMatchListener = null;
    }
  }

  // 매칭 상태 확인
  isCurrentlyMatching(): boolean {
    return this.isMatching;
  }

  // 대기 중인 사용자 수 확인
  async getWaitingCount(): Promise<number> {
    try {
      const waitingRef = ref(this.db, 'waiting');
      const snapshot = await get(waitingRef);
      const waitingUsers = snapshot.val();
      return waitingUsers ? Object.keys(waitingUsers).length : 0;
    } catch (error) {
      console.error('❌ 대기 수 조회 실패:', error);
      return 0;
    }
  }

  // 매칭 성공 푸시 알림 발송
  private async sendMatchNotification(fcmToken: string, partnerNickname: string) {
    try {
      // 여기서는 실제 서버 API를 호출해야 하지만
      // 테스트용으로 로컬 알림만 표시
      console.log('🔔 매칭 성공 알림 발송:', {
        to: fcmToken,
        title: '새로운 인연이 찾아왔어요! 💫',
        body: `${partnerNickname}님과 매칭되었습니다!`
      });
      
      // TODO: 실제 FCM 서버 API 호출
      // 현재는 앱 내 알림으로 대체
      fcmService.sendTestNotificationToSelf(
        '새로운 인연이 찾아왔어요! 💫',
        `${partnerNickname}님과 매칭되었습니다!`
      );
      
    } catch (error) {
      console.error('❌ 매칭 알림 발송 실패:', error);
    }
  }

  // 정리 (앱 종료시 호출)
  cleanup() {
    this.removeMatchListener();
    if (this.isMatching) {
      this.cancelMatch();
    }
  }
}

export const matchingService = new MatchingManager();