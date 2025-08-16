import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

interface FCMService {
  requestPermission: () => Promise<boolean>;
  getToken: () => Promise<string | null>;
  onTokenRefresh: (callback: (token: string) => void) => () => void;
  onMessage: (callback: (message: any) => void) => () => void;
  showLocalNotification: (title: string, body: string) => void;
  sendTestNotificationToSelf: (title: string, body: string) => Promise<void>;
}

class FCMManager implements FCMService {
  private fcmToken: string | null = null;

  // FCM 권한 요청
  async requestPermission(): Promise<boolean> {
    try {
      // Android 13+ 에서는 POST_NOTIFICATIONS 권한 필요
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('❌ 알림 권한이 거부되었습니다');
          return false;
        }
      }

      // FCM 권한 요청
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('✅ FCM 권한 승인됨:', authStatus);
        return true;
      } else {
        console.log('❌ FCM 권한 거부됨:', authStatus);
        return false;
      }
    } catch (error) {
      console.error('❌ FCM 권한 요청 실패:', error);
      return false;
    }
  }

  // FCM 토큰 가져오기
  async getToken(): Promise<string | null> {
    try {
      // 권한 확인
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return null;
      }

      // 토큰 가져오기
      const token = await messaging().getToken();
      this.fcmToken = token;
      
      console.log('📱 FCM 토큰 생성됨:', token?.substring(0, 20) + '...');
      return token;
    } catch (error) {
      console.error('❌ FCM 토큰 가져오기 실패:', error);
      return null;
    }
  }

  // 토큰 갱신 감지
  onTokenRefresh(callback: (token: string) => void): () => void {
    const unsubscribe = messaging().onTokenRefresh(token => {
      console.log('🔄 FCM 토큰 갱신됨:', token?.substring(0, 20) + '...');
      this.fcmToken = token;
      callback(token);
    });

    return unsubscribe;
  }

  // 포그라운드 메시지 수신
  onMessage(callback: (message: any) => void): () => void {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('📱 포그라운드 메시지 수신:', remoteMessage);
      
      // 알림 표시
      if (remoteMessage.notification) {
        this.showLocalNotification(
          remoteMessage.notification.title || '알림',
          remoteMessage.notification.body || '새 메시지가 도착했습니다'
        );
      }
      
      callback(remoteMessage);
    });

    return unsubscribe;
  }

  // 로컬 알림 표시 (Alert 개선 버전)
  showLocalNotification(title: string, body: string): void {
    // 자정 알림인지 확인
    const isUrgent = title.includes('자정') || title.includes('⏰') || title.includes('🌙') || title.includes('✨');
    
    const alertStyle = isUrgent ? 'destructive' : 'default';
    
    Alert.alert(
      title,
      body,
      [
        { 
          text: '확인', 
          style: alertStyle,
          onPress: () => {
            console.log(`📱 ${isUrgent ? '긴급 ' : ''}알림 확인됨: ${title}`);
          }
        }
      ],
      { 
        cancelable: true,
        onDismiss: () => {
          console.log(`📱 알림 닫힘: ${title}`);
        }
      }
    );
  }

  // 테스트용: Firebase Console을 통해 푸시 알림 보내기
  async sendTestNotificationToSelf(title: string, body: string): Promise<void> {
    if (!this.fcmToken) {
      console.error('❌ FCM 토큰이 없습니다');
      return;
    }

    console.log('📱 테스트 알림 데이터:');
    console.log('제목:', title);
    console.log('내용:', body);
    console.log('FCM 토큰:', this.fcmToken);
    console.log('');
    console.log('🔥 Firebase Console에서 테스트 알림을 보내려면:');
    console.log('1. https://console.firebase.google.com/ 접속');
    console.log('2. OneDay-Chat 프로젝트 선택');
    console.log('3. 왼쪽 메뉴에서 "Messaging" 클릭');
    console.log('4. "Send your first message" 또는 "New campaign" 클릭');
    console.log('5. 알림 제목/내용 입력');
    console.log('6. "Send test message" 클릭');
    console.log('7. 위의 FCM 토큰을 입력하고 "Test" 클릭');
    console.log('');
    
    // 로컬에서는 Alert로 시뮬레이션
    this.showLocalNotification(title, body);
  }

  // 현재 토큰 반환
  getCurrentToken(): string | null {
    return this.fcmToken;
  }

  // 백그라운드 메시지 핸들러 설정 (앱 최상단에서 호출)
  static setBackgroundMessageHandler(): void {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('📱 백그라운드 메시지 수신:', remoteMessage);
      
      // 백그라운드에서는 자동으로 시스템 알림 표시됨
      // 추가 로직이 필요하면 여기에 구현
    });
  }

  // 테스트용: 샘플 알림 데이터
  static getSampleNotifications() {
    return {
      matchingSuccess: {
        title: '매칭 성공! 💫',
        body: '새로운 인연이 당신을 기다리고 있어요!'
      },
      newMessage: {
        title: '새 메시지',
        body: '익명의 누군가님이 메시지를 보냈어요'
      },
      midnightWarning10: {
        title: '자정 알림 ⏰',
        body: '10분 후 오늘의 대화가 끝나요'
      },
      midnightWarning5: {
        title: '자정 알림 🌙',
        body: '5분 후 모든 대화가 종료됩니다'
      },
      midnightWarning1: {
        title: '자정 알림 ✨',
        body: '1분 후 자정입니다! 마지막 인사를 나눠보세요'
      }
    };
  }

  // 홈서버 연동용: 푸시 알림 데이터 구조
  static getServerPushData(token: string, title: string, body: string) {
    return {
      to: token,
      notification: {
        title: title,
        body: body,
        sound: 'default',
        priority: 'high',
        show_in_foreground: true,
      },
      data: {
        type: 'oneday_chat',
        timestamp: new Date().toISOString(),
      },
      android: {
        priority: 'high',
        notification: {
          channel_id: 'oneday-chat-default',
          sound: 'default',
          priority: 'high',
          vibrate_timings: ['0.0s', '0.25s', '0.25s', '0.25s'],
        }
      }
    };
  }
}

// 싱글톤 인스턴스
export const fcmService = new FCMManager();

// 사용 예시:
// fcmService.getToken().then(token => console.log('토큰:', token));
// fcmService.onMessage(message => console.log('메시지:', message));