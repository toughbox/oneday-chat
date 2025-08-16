import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { fcmService } from '../services/fcmService';

interface Props {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
}

const FCMTestScreen: React.FC<Props> = ({ navigation }) => {
  const [fcmToken, setFcmToken] = useState<string>('');
  const [tokenStatus, setTokenStatus] = useState<string>('대기 중...');
  const [permissionStatus, setPermissionStatus] = useState<string>('확인 중...');

  useEffect(() => {
    initializeFCM();
  }, []);

  const initializeFCM = async () => {
    // 권한 요청
    const hasPermission = await fcmService.requestPermission();
    setPermissionStatus(hasPermission ? '✅ 권한 승인됨' : '❌ 권한 거부됨');

    if (hasPermission) {
      // 토큰 가져오기
      const token = await fcmService.getToken();
      if (token) {
        setFcmToken(token);
        setTokenStatus('✅ 토큰 생성됨');
        
        // 콘솔에 토큰 출력
        console.log('📱===========================================');
        console.log('📱 FCM 토큰 (복사해서 Firebase Console에 사용):');
        console.log('📱===========================================');
        console.log(token);
        console.log('📱===========================================');
      } else {
        setTokenStatus('❌ 토큰 생성 실패');
      }
    }
  };

  // Firebase Console 테스트 가이드
  const showFirebaseGuide = () => {
    Alert.alert(
      '🔥 Firebase Console 테스트 가이드',
      '1. https://console.firebase.google.com/ 접속\n' +
      '2. OneDay-Chat 프로젝트 선택\n' +
      '3. 왼쪽 메뉴 "Messaging" 클릭\n' +
      '4. "Send your first message" 클릭\n' +
      '5. 제목/내용 입력 후 "Next"\n' +
      '6. "Send test message" 클릭\n' +
      '7. 콘솔의 FCM 토큰 복사해서 입력\n' +
      '8. "Test" 클릭\n\n' +
      '💡 토큰은 콘솔 로그에서 복사하세요!',
      [
        { text: '토큰 보기', onPress: showTokenDetails },
        { text: '확인', style: 'default' }
      ]
    );
  };

  // 테스트 알림 표시
  const showTestNotification = (type: string) => {
    const notifications = fcmService.constructor.getSampleNotifications();
    let notification;

    switch (type) {
      case 'matching':
        notification = notifications.matchingSuccess;
        break;
      case 'message':
        notification = notifications.newMessage;
        break;
      case 'midnight10':
        notification = notifications.midnightWarning10;
        break;
      case 'midnight5':
        notification = notifications.midnightWarning5;
        break;
      case 'midnight1':
        notification = notifications.midnightWarning1;
        break;
      default:
        notification = { title: '테스트 알림', body: '알림 테스트입니다' };
    }

    // sendTestNotificationToSelf 함수 사용
    fcmService.sendTestNotificationToSelf(notification.title, notification.body);
  };

  const showTokenDetails = () => {
    if (fcmToken) {
      console.log('📱 FCM 토큰:', fcmToken);
      Alert.alert(
        'FCM 토큰',
        '토큰이 콘솔에 출력되었습니다!\n\n개발자 도구 콘솔에서 복사해서 Firebase Console에 붙여넣으세요.\n\n토큰 일부:\n' + fcmToken.substring(0, 60) + '...',
        [
          { text: '확인', style: 'default' }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FCM 테스트</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* FCM 상태 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📱 FCM 상태</Text>
            
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>알림 권한:</Text>
              <Text style={styles.statusValue}>{permissionStatus}</Text>
            </View>
            
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>토큰 상태:</Text>
              <Text style={styles.statusValue}>{tokenStatus}</Text>
            </View>

            {fcmToken && (
              <View style={styles.tokenSection}>
                <TouchableOpacity 
                  style={styles.tokenContainer}
                  onPress={showTokenDetails}
                >
                  <Text style={styles.tokenLabel}>FCM 토큰:</Text>
                  <Text style={styles.tokenValue} numberOfLines={2}>
                    {fcmToken.substring(0, 50)}...
                  </Text>
                  <Text style={styles.tokenHint}>탭하면 콘솔에 전체 토큰 출력</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.guideButton}
                  onPress={showFirebaseGuide}
                >
                  <Text style={styles.guideButtonText}>🔥 Firebase Console 가이드</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 실제 푸시 테스트 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚀 실제 푸시 알림 테스트</Text>
            <Text style={styles.sectionSubtitle}>
              Firebase Console에서 진짜 푸시 알림을 보내보세요!
            </Text>

            <TouchableOpacity 
              style={styles.realPushButton}
              onPress={showFirebaseGuide}
            >
              <Text style={styles.realPushIcon}>🔥</Text>
              <View style={styles.realPushContent}>
                <Text style={styles.realPushTitle}>Firebase Console에서 푸시 발송</Text>
                <Text style={styles.realPushSubtitle}>진짜 푸시 알림을 받아보세요!</Text>
              </View>
              <Text style={styles.realPushArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.instructionBox}>
              <Text style={styles.instructionTitle}>📋 토큰 복사 방법:</Text>
              <Text style={styles.instructionText}>
                1. 위의 "FCM 토큰" 박스 탭
                {'\n'}2. 개발자 도구 콘솔 확인
                {'\n'}3. 토큰 전체를 복사
                {'\n'}4. Firebase Console에 붙여넣기
              </Text>
            </View>
          </View>

          {/* 로컬 테스트 알림 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🧪 로컬 테스트 알림</Text>
            <Text style={styles.sectionSubtitle}>
              Alert 창으로 알림 내용을 미리 확인해보세요
            </Text>

            <TouchableOpacity 
              style={[styles.testButton, styles.matchingButton]}
              onPress={() => showTestNotification('matching')}
            >
              <Text style={styles.testButtonIcon}>💫</Text>
              <View style={styles.testButtonContent}>
                <Text style={styles.testButtonTitle}>매칭 성공 알림</Text>
                <Text style={styles.testButtonSubtitle}>새로운 인연이 당신을 기다리고 있어요!</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.testButton, styles.messageButton]}
              onPress={() => showTestNotification('message')}
            >
              <Text style={styles.testButtonIcon}>💬</Text>
              <View style={styles.testButtonContent}>
                <Text style={styles.testButtonTitle}>새 메시지 알림</Text>
                <Text style={styles.testButtonSubtitle}>익명의 누군가님이 메시지를 보냈어요</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.testButton, styles.midnightButton]}
              onPress={() => showTestNotification('midnight10')}
            >
              <Text style={styles.testButtonIcon}>⏰</Text>
              <View style={styles.testButtonContent}>
                <Text style={styles.testButtonTitle}>자정 알림 (10분 전)</Text>
                <Text style={styles.testButtonSubtitle}>10분 후 오늘의 대화가 끝나요</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.testButton, styles.midnightButton]}
              onPress={() => showTestNotification('midnight5')}
            >
              <Text style={styles.testButtonIcon}>🌙</Text>
              <View style={styles.testButtonContent}>
                <Text style={styles.testButtonTitle}>자정 알림 (5분 전)</Text>
                <Text style={styles.testButtonSubtitle}>5분 후 모든 대화가 종료됩니다</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.testButton, styles.midnightButton]}
              onPress={() => showTestNotification('midnight1')}
            >
              <Text style={styles.testButtonIcon}>✨</Text>
              <View style={styles.testButtonContent}>
                <Text style={styles.testButtonTitle}>자정 알림 (1분 전)</Text>
                <Text style={styles.testButtonSubtitle}>1분 후 자정입니다! 마지막 인사를 나눠보세요</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 다시 초기화 */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={initializeFCM}
            >
              <Text style={styles.refreshButtonText}>🔄 FCM 다시 초기화</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#d1d5db',
  },
  statusValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  tokenSection: {
    marginTop: 8,
  },
  tokenContainer: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 12,
  },
  tokenLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  tokenValue: {
    fontSize: 12,
    color: '#ffffff',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  tokenHint: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  guideButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  guideButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  realPushButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  realPushIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  realPushContent: {
    flex: 1,
  },
  realPushTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  realPushSubtitle: {
    fontSize: 12,
    color: '#fecaca',
  },
  realPushArrow: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '300',
  },
  instructionBox: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 12,
    color: '#d1d5db',
    lineHeight: 18,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  matchingButton: {
    borderColor: '#3b82f6',
  },
  messageButton: {
    borderColor: '#10b981',
  },
  midnightButton: {
    borderColor: '#f59e0b',
  },
  testButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  testButtonContent: {
    flex: 1,
  },
  testButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  testButtonSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
  },
  refreshButton: {
    backgroundColor: '#6b7280',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FCMTestScreen;