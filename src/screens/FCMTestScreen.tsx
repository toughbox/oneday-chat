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
import { midnightResetService } from '../utils/midnightReset';
import { socketService } from '../services/socketService';
import { socketMatchingService } from '../services/socketMatchingService';

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
  const [socketStatus, setSocketStatus] = useState<string>('연결 안됨');
  const [serverUrl, setServerUrlState] = useState<string>('http://toughbox.iptime.org:3000');

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
    let notification;

    switch (type) {
      case 'matching':
        notification = { title: '💫 매칭 성공!', body: '새로운 인연이 당신을 기다리고 있어요!' };
        break;
      case 'message':
        notification = { title: '💬 새 메시지', body: '익명의 누군가님이 메시지를 보냈어요' };
        break;
      case 'midnight10':
        notification = { title: '⏰ 자정 경고', body: '10분 후 모든 대화가 종료됩니다' };
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

  // 자정 리셋 테스트 함수들
  const testMidnightWarning = async (minutes: number) => {
    await midnightResetService.sendMidnightWarning(minutes);
  };

  const testFullMidnightReset = async () => {
    Alert.alert(
      '🌙 자정 리셋 테스트',
      '정말로 테스트 리셋을 실행하시겠습니까?\n\n⚠️ 이 작업은 AsyncStorage의 모든 데이터를 삭제합니다!',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '리셋 실행', 
          style: 'destructive',
          onPress: async () => {
            try {
              await midnightResetService.testReset();
              Alert.alert('✅ 완료', '자정 리셋 테스트가 완료되었습니다!');
            } catch (error) {
              Alert.alert('❌ 오류', '리셋 테스트 중 오류가 발생했습니다.');
              console.error('리셋 테스트 오류:', error);
            }
          }
        }
      ]
    );
  };

  const showMemoryStatus = async () => {
    Alert.alert(
      '💾 메모리 상태',
      '현재 앱은 메모리 기반으로 동작합니다.\n\n' +
      '• 채팅 데이터: 메모리에만 저장\n' +
      '• 자정 리셋: 앱 상태 초기화\n' +
      '• 영구 저장소: 미사용 (완전 익명)',
      [
        { text: '확인', style: 'default' }
      ]
    );
  };

  // Socket.io 테스트 함수들
  const testSocketConnection = async () => {
    try {
      setSocketStatus('연결 중...');
      const connected = await socketService.connect(serverUrl);
      
      if (connected) {
        setSocketStatus('✅ 연결됨');
        Alert.alert('✅ 성공', 'Socket.io 서버 연결 성공!');
      } else {
        setSocketStatus('❌ 연결 실패');
        Alert.alert('❌ 실패', 'Socket.io 서버 연결 실패!\n\n홈서버가 실행 중인지 확인하세요.');
      }
    } catch (error) {
      setSocketStatus('❌ 오류');
      Alert.alert('❌ 오류', 'Socket.io 연결 중 오류 발생');
    }
  };

  const testSocketMatching = async () => {
    try {
      if (!socketService.isConnected()) {
        Alert.alert('⚠️ 주의', '먼저 Socket.io 서버에 연결해주세요.');
        return;
      }

      const success = await socketMatchingService.requestMatch(['테스트'], '좋음');
      
      if (success) {
        Alert.alert('🔍 매칭 시작', 'Socket.io 매칭 요청이 전송되었습니다!');
      } else {
        Alert.alert('❌ 실패', 'Socket.io 매칭 요청 실패');
      }
    } catch (error) {
      Alert.alert('❌ 오류', 'Socket.io 매칭 테스트 중 오류 발생');
    }
  };

  const disconnectSocket = () => {
    socketService.disconnect();
    setSocketStatus('연결 안됨');
    Alert.alert('🔌 연결 해제', 'Socket.io 서버 연결이 해제되었습니다.');
  };

  const changeServerUrl = () => {
    Alert.prompt(
      '🏠 홈서버 URL 변경',
      '홈서버 IP 주소를 입력하세요:',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '변경', 
          onPress: (url) => {
            if (url) {
              const fullUrl = url.startsWith('http://') ? url : `http://${url}:3000`;
              setServerUrlState(fullUrl);
              socketMatchingService.setServerUrl(fullUrl);
              Alert.alert('✅ 변경됨', `서버 URL: ${fullUrl}`);
            }
          }
        }
      ],
      'plain-text',
      serverUrl.replace('http://', '').replace(':3000', '')
    );
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


          </View>

          {/* Firebase 매칭 테스트 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔥 Firebase 매칭 테스트</Text>
            <Text style={styles.sectionSubtitle}>
              실제 Firebase Realtime Database 매칭을 테스트해보세요
            </Text>

            <TouchableOpacity 
              style={styles.firebaseTestButton}
              onPress={() => navigation.navigate('MatchingWait')}
            >
              <Text style={styles.firebaseTestIcon}>🎯</Text>
              <View style={styles.firebaseTestContent}>
                <Text style={styles.firebaseTestTitle}>Firebase 매칭 시작</Text>
                <Text style={styles.firebaseTestSubtitle}>실제 Firebase DB로 매칭 테스트</Text>
              </View>
              <Text style={styles.firebaseTestArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Socket.io P2P 통신 테스트 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔌 Socket.io P2P 통신 테스트</Text>
            <Text style={styles.sectionSubtitle}>
              홈서버와 실시간 통신을 테스트해보세요
            </Text>

            {/* 서버 상태 */}
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>서버 연결:</Text>
              <Text style={styles.statusValue}>{socketStatus}</Text>
            </View>

            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>서버 URL:</Text>
              <Text style={styles.statusValue} numberOfLines={1}>{serverUrl}</Text>
            </View>

            {/* Socket.io 테스트 버튼들 */}
            <TouchableOpacity 
              style={[styles.testButton, styles.socketConnectButton]}
              onPress={testSocketConnection}
            >
              <Text style={styles.testButtonIcon}>🔌</Text>
              <View style={styles.testButtonContent}>
                <Text style={styles.testButtonTitle}>Socket.io 서버 연결</Text>
                <Text style={styles.testButtonSubtitle}>홈서버와 실시간 연결 테스트</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.testButton, styles.socketMatchButton]}
              onPress={testSocketMatching}
            >
              <Text style={styles.testButtonIcon}>🔍</Text>
              <View style={styles.testButtonContent}>
                <Text style={styles.testButtonTitle}>Socket.io 매칭 테스트</Text>
                <Text style={styles.testButtonSubtitle}>실시간 매칭 시스템 테스트</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.testButton, styles.socketUrlButton]}
              onPress={changeServerUrl}
            >
              <Text style={styles.testButtonIcon}>🏠</Text>
              <View style={styles.testButtonContent}>
                <Text style={styles.testButtonTitle}>홈서버 URL 변경</Text>
                <Text style={styles.testButtonSubtitle}>홈서버 IP 주소 설정</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.testButton, styles.socketDisconnectButton]}
              onPress={disconnectSocket}
            >
              <Text style={styles.testButtonIcon}>🔌</Text>
              <View style={styles.testButtonContent}>
                <Text style={styles.testButtonTitle}>연결 해제</Text>
                <Text style={styles.testButtonSubtitle}>Socket.io 서버 연결 해제</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>🏠 홈서버 설정 방법:</Text>
              <Text style={styles.infoText}>
                1. HOMESERVER_SETUP.md 파일 참고
                {'\n'}2. 라즈베리파이에 Node.js 서버 설치
                {'\n'}3. 공유기에서 포트포워딩 설정
                {'\n'}4. 위의 "홈서버 URL 변경"으로 IP 설정
              </Text>
            </View>
          </View>

          {/* 자정 리셋 시스템 테스트 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌙 자정 리셋 시스템 테스트</Text>
            <Text style={styles.sectionSubtitle}>
              자정 경고 알림과 데이터 삭제 기능을 테스트해보세요
            </Text>

            {/* 메모리 상태 확인 */}
            <TouchableOpacity 
              style={[styles.testButton, styles.storageButton]}
              onPress={showMemoryStatus}
            >
              <Text style={styles.testButtonIcon}>💾</Text>
              <View style={styles.testButtonContent}>
                <Text style={styles.testButtonTitle}>메모리 상태 확인</Text>
                <Text style={styles.testButtonSubtitle}>현재 앱의 데이터 저장 방식 확인 (완전 익명)</Text>
              </View>
            </TouchableOpacity>

            {/* 자정 경고 알림 테스트 */}
            <TouchableOpacity 
              style={[styles.testButton, styles.midnightButton]}
              onPress={() => testMidnightWarning(10)}
            >
              <Text style={styles.testButtonIcon}>⏰</Text>
              <View style={styles.testButtonContent}>
                <Text style={styles.testButtonTitle}>자정 10분 전 경고</Text>
                <Text style={styles.testButtonSubtitle}>실제 FCM 경고 알림 테스트 (유일한 경고 알림)</Text>
              </View>
            </TouchableOpacity>

            {/* 전체 리셋 테스트 */}
            <TouchableOpacity 
              style={[styles.testButton, styles.resetButton]}
              onPress={testFullMidnightReset}
            >
              <Text style={styles.testButtonIcon}>🌙</Text>
              <View style={styles.testButtonContent}>
                <Text style={styles.testButtonTitle}>전체 자정 리셋 테스트</Text>
                <Text style={styles.testButtonSubtitle}>⚠️ 메모리 데이터 완전 삭제 (무음 리셋)</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>⚠️ 주의사항:</Text>
              <Text style={styles.warningText}>
                • 자정 리셋은 앱의 모든 메모리 데이터를 초기화합니다
                {'\n'}• 실제 앱에서는 자정(00:00)에 자동 실행됩니다  
                {'\n'}• 10분 전에만 경고 알림이 발송됩니다
                {'\n'}• 자정 후에는 무음으로 리셋됩니다
                {'\n'}• 완전 익명: 영구 저장소를 사용하지 않습니다
              </Text>
            </View>
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
  storageButton: {
    borderColor: '#8b5cf6',
  },
  resetButton: {
    borderColor: '#dc2626',
    backgroundColor: '#7f1d1d',
  },
  socketConnectButton: {
    borderColor: '#059669',
  },
  socketMatchButton: {
    borderColor: '#3b82f6',
  },
  socketUrlButton: {
    borderColor: '#f59e0b',
  },
  socketDisconnectButton: {
    borderColor: '#dc2626',
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
  firebaseTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  firebaseTestIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  firebaseTestContent: {
    flex: 1,
  },
  firebaseTestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  firebaseTestSubtitle: {
    fontSize: 12,
    color: '#bbf7d0',
  },
  firebaseTestArrow: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '300',
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
  warningBox: {
    backgroundColor: '#7f1d1d',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#fecaca',
    lineHeight: 18,
  },
  infoBox: {
    backgroundColor: '#1e40af',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#bfdbfe',
    lineHeight: 18,
  },
});

export default FCMTestScreen;