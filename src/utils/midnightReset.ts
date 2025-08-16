interface MidnightResetService {
  startMidnightWatcher: () => void;
  stopMidnightWatcher: () => void;
  clearAllData: () => Promise<void>;
  scheduleNextMidnight: () => void;
  onDataClear?: () => void; // 콜백 함수 추가
}

class MidnightResetManager implements MidnightResetService {
  private midnightTimer: NodeJS.Timeout | null = null;
  private warningTimers: NodeJS.Timeout[] = [];
  public onDataClear?: () => void;

  // 자정까지 남은 시간 계산
  private getTimeUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0); // 다음 날 자정
    
    return midnight.getTime() - now.getTime();
  }

  // 모든 로컬 데이터 삭제 (메모리 기반)
  async clearAllData(): Promise<void> {
    try {
      console.log('🧹 자정 데이터 정리 시작...');
      
      // 앱 상태 초기화 콜백 호출
      if (this.onDataClear) {
        this.onDataClear();
      }
      
      console.log('🧹 자정 데이터 정리 완료');
    } catch (error) {
      console.error('❌ 데이터 삭제 실패:', error);
    }
  }

  // 자정 경고 알림 (10분, 5분, 1분 전)
  private scheduleWarnings(): void {
    const timeUntilMidnight = this.getTimeUntilMidnight();
    
    // 10분 전 알림
    const tenMinutesBefore = timeUntilMidnight - (10 * 60 * 1000);
    if (tenMinutesBefore > 0) {
      const timer = setTimeout(() => {
        console.log('⚠️ 10분 후 모든 대화가 종료됩니다');
        // TODO: 푸시 알림 발송
      }, tenMinutesBefore);
      this.warningTimers.push(timer);
    }

    // 5분 전 알림
    const fiveMinutesBefore = timeUntilMidnight - (5 * 60 * 1000);
    if (fiveMinutesBefore > 0) {
      const timer = setTimeout(() => {
        console.log('⚠️ 5분 후 모든 대화가 종료됩니다');
        // TODO: 푸시 알림 발송
      }, fiveMinutesBefore);
      this.warningTimers.push(timer);
    }

    // 1분 전 알림
    const oneMinuteBefore = timeUntilMidnight - (1 * 60 * 1000);
    if (oneMinuteBefore > 0) {
      const timer = setTimeout(() => {
        console.log('⚠️ 1분 후 모든 대화가 종료됩니다');
        // TODO: 푸시 알림 발송
      }, oneMinuteBefore);
      this.warningTimers.push(timer);
    }
  }

  // 다음 자정까지 타이머 설정
  scheduleNextMidnight(): void {
    const timeUntilMidnight = this.getTimeUntilMidnight();
    
    console.log(`🌙 다음 자정까지: ${Math.floor(timeUntilMidnight / 1000 / 60 / 60)}시간 ${Math.floor((timeUntilMidnight / 1000 / 60) % 60)}분`);
    
    // 경고 알림 설정
    this.scheduleWarnings();
    
    // 자정 정각에 데이터 삭제
    this.midnightTimer = setTimeout(async () => {
      console.log('🌙 자정이 되었습니다. 데이터 정리를 시작합니다...');
      
      await this.clearAllData();
      
      console.log('✨ 새로운 하루가 시작되었습니다!');
      
      // 다음 자정을 위해 다시 설정
      this.scheduleNextMidnight();
      
    }, timeUntilMidnight);
  }

  // 자정 감시 시작
  startMidnightWatcher(): void {
    console.log('🌙 자정 리셋 서비스 시작');
    this.scheduleNextMidnight();
  }

  // 자정 감시 중지
  stopMidnightWatcher(): void {
    console.log('🌙 자정 리셋 서비스 중지');
    
    if (this.midnightTimer) {
      clearTimeout(this.midnightTimer);
      this.midnightTimer = null;
    }
    
    this.warningTimers.forEach(timer => clearTimeout(timer));
    this.warningTimers = [];
  }

  // 테스트용: 즉시 리셋
  async testReset(): Promise<void> {
    console.log('🧪 테스트 리셋 실행');
    await this.clearAllData();
  }
}

// 싱글톤 인스턴스
export const midnightResetService = new MidnightResetManager();

// 사용 예시:
// midnightResetService.startMidnightWatcher(); // 앱 시작시
// midnightResetService.stopMidnightWatcher(); // 앱 종료시
