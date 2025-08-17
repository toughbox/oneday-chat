// 간단한 고유 ID 생성 함수 (UUID 패키지 없이)
function generateUniqueId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const machineId = Math.random().toString(36).substr(2, 5);
  return `${timestamp}_${random}_${machineId}`;
}

// 전역 사용자 세션 관리자 (메모리 기반)
class UserSessionManager {
  private static instance: UserSessionManager;
  private currentUserId: string = '';
  private currentNickname: string = '';

  private constructor() {
    // 생성 시 자동으로 ID 생성
    this.generateNewSession();
  }

  static getInstance(): UserSessionManager {
    if (!UserSessionManager.instance) {
      UserSessionManager.instance = new UserSessionManager();
    }
    return UserSessionManager.instance;
  }

  // 사용자 ID 설정 (앱 세션 동안 고정)
  setUserId(userId: string): void {
    this.currentUserId = userId;
    console.log('🆔 전역 사용자 ID 설정:', userId);
  }

  // 새로운 세션 생성 (앱 시작 시)
  private generateNewSession(): void {
    this.currentUserId = this.generateUserId();
    this.currentNickname = this.generateNickname();
    console.log('🆔 새로운 세션 생성 - ID:', this.currentUserId, '닉네임:', this.currentNickname);
  }

  // 사용자 ID 가져오기
  getUserId(): string {
    if (!this.currentUserId) {
      this.currentUserId = this.generateUserId();
      console.log('🆔 전역 사용자 ID 자동 생성:', this.currentUserId);
    }
    return this.currentUserId;
  }

  // 닉네임 설정 (앱 세션 동안 고정)
  setNickname(nickname: string): void {
    this.currentNickname = nickname;
    console.log('👤 전역 닉네임 설정:', nickname);
  }

  // 닉네임 가져오기
  getNickname(): string {
    if (!this.currentNickname) {
      this.currentNickname = this.generateNickname();
      console.log('👤 전역 닉네임 자동 생성:', this.currentNickname);
    }
    return this.currentNickname;
  }

  // 세션 초기화 (자정 리셋 등에 사용)
  resetSession(): void {
    this.currentUserId = '';
    this.currentNickname = '';
    console.log('🔄 사용자 세션 초기화 완료');
  }

  // 완전히 고유한 사용자 ID 생성
  private generateUserId(): string {
    return `user_${generateUniqueId()}`;
  }

  // 고유한 닉네임 생성
  private generateNickname(): string {
    const adjectives = ['밤하늘', '새벽', '황혼', '달빛', '별빛', '우주', '은하', '별', '달', '태양'];
    const nouns = ['여행자', '방랑자', '탐험가', '몽상가', '관찰자', '시인', '철학자', '과학자', '예술가', '음악가'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const uniqueId = generateUniqueId().substr(0, 8); // 고유 ID의 앞 8자리 사용
    return `${adj}${noun}_${uniqueId}`;
  }
}

// 싱글톤 인스턴스
export const userSessionManager = UserSessionManager.getInstance();
