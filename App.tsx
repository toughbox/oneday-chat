/**
 * OneDay Chat App
 * 자정에 사라지는 익명 채팅 앱
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, AppState, AppStateStatus } from 'react-native';

import WelcomeScreen from './src/screens/onboarding/WelcomeScreen';
import NicknameScreen from './src/screens/onboarding/NicknameScreen';
import ChatRoomScreen from './src/screens/ChatRoomScreen';
import ChatRoomListScreen from './src/screens/ChatRoomListScreen';
import MatchingWaitScreen from './src/screens/MatchingWaitScreen';
import MatchingResultScreen from './src/screens/MatchingResultScreen';
import EmotionSelectionScreen from './src/screens/EmotionSelectionScreen';
import FCMTestScreen from './src/screens/FCMTestScreen';
import { midnightResetService } from './src/utils/midnightReset';
import { fcmService } from './src/services/fcmService';
import { socketService } from './src/services/socketService';
import { chatRoomManager } from './src/services/chatRoomManager';


function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome'); // 홈화면으로 복원
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [screenParams, setScreenParams] = useState<any>({});

  // 앱 시작시 서비스 초기화
  useEffect(() => {
    // 자정에 앱 상태 초기화 콜백 설정
    midnightResetService.onDataClear = () => {
      setCurrentScreen('welcome'); // 원래대로 welcome으로
      setCurrentRoomId(null);
      setScreenParams({});
      console.log('🌙 앱 상태가 초기화되었습니다');
    };
    
    midnightResetService.startMidnightWatcher();
    
    // 앱 시작 시 이전 대화방 데이터 정리 (서버에 존재하지 않는 방 삭제)
    const cleanupOrphanedRooms = async () => {
      try {
        console.log('🧹 앱 시작: 고아 대화방 데이터 정리 시작...');
        
        // chatRoomManager 초기화
        await chatRoomManager.initialize();
        const activeRooms = chatRoomManager.getChatRooms().filter(room => room.isActive);
        
        if (activeRooms.length > 0) {
          console.log(`🔍 ${activeRooms.length}개 활성 대화방 확인 중...`);
          
          // 소켓 연결 시도
          if (!socketService.isConnected()) {
            console.log('🔌 소켓 연결 시도 중...');
            // 여기서는 연결만 시도하고 실제 정리는 ChatRoomListScreen에서 처리
          }
        }
        
        console.log('✅ 고아 대화방 데이터 정리 완료');
      } catch (error) {
        console.error('❌ 고아 대화방 데이터 정리 실패:', error);
      }
    };
    
    cleanupOrphanedRooms();
    
    return () => {
      midnightResetService.stopMidnightWatcher();
    };
  }, []);

  // FCM 서비스 초기화
  useEffect(() => {
    const initializeFCM = async () => {
      // FCM 토큰 가져오기
      const token = await fcmService.getToken();
      if (token) {
        console.log('✅ FCM 초기화 완료');
      }
      
      // 포그라운드 메시지 수신 설정
      const unsubscribeMessage = fcmService.onMessage((message) => {
        console.log('📱 새 메시지 수신:', message);
        // TODO: 메시지 처리 로직 추가
      });

      // 토큰 갱신 감지
      const unsubscribeToken = fcmService.onTokenRefresh((newToken) => {
        console.log('🔄 토큰 갱신:', newToken?.substring(0, 20) + '...');
        // TODO: 서버에 새 토큰 전송
      });

      return () => {
        unsubscribeMessage();
        unsubscribeToken();
      };
    };

    initializeFCM();
  }, []);

  // 앱 생명주기 이벤트 처리 (앱 완전 종료 시에만 대화방 나가기)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      console.log('📱 앱 상태 변경:', nextAppState);
      
      if (nextAppState === 'inactive' || nextAppState === 'background') {
        // 앱이 백그라운드로 전환되거나 비활성화될 때는 아무것도 하지 않음
        // (메시지 동기화를 위해 방에 계속 남아있음)
        console.log('🔄 앱 백그라운드 전환 - 대화방 유지');
      }
    };

    // 앱 상태 변경 리스너 등록
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // 앱 완전 종료 시 정리 작업
    const handleAppTermination = async () => {
      console.log('🚪 앱 완전 종료 - 모든 대화방에서 나가기');
      
      try {
        // 활성 대화방이 있다면 서버에서 나가기
        const activeRooms = chatRoomManager.getChatRooms().filter(room => room.isActive);
        
        if (activeRooms.length > 0 && socketService.isConnected()) {
          console.log(`🚪 ${activeRooms.length}개 대화방에서 나가기 시작...`);
          
          for (const room of activeRooms) {
            try {
              socketService.leaveRoom(room.roomId);
              console.log(`✅ 대화방 ${room.roomId} 나가기 완료`);
            } catch (error) {
              console.error(`❌ 대화방 ${room.roomId} 나가기 실패:`, error);
            }
          }
          
          // 소켓 연결 해제
          socketService.disconnect();
          console.log('🔌 소켓 연결 해제 완료');
        }
      } catch (error) {
        console.error('❌ 앱 종료 시 정리 작업 실패:', error);
      }
    };

    // React Native에서는 웹 이벤트를 사용하지 않음
    // AppState로 앱 생명주기만 관리

    return () => {
      subscription?.remove();
    };
  }, []);

  const navigation = {
    navigate: (screen: string, params?: any) => {
      console.log('🚀 화면 이동:', screen, params);
      setCurrentScreen(screen);
      setScreenParams(params || {});
      if (params?.roomId) {
        setCurrentRoomId(params.roomId);
      }
    },
    goBack: () => {
      if (currentScreen === 'ChatRoom') {
        setCurrentScreen('ChatRoomList');
        setCurrentRoomId(null);
      } else if (currentScreen === 'MatchingWait') {
        setCurrentScreen('ChatRoomList');
      } else if (currentScreen === 'MatchingResult') {
        setCurrentScreen('ChatRoomList');
      } else if (currentScreen === 'EmotionSelection') {
        setCurrentScreen('welcome'); // 원래대로 welcome으로
      } else if (currentScreen === 'FCMTest') {
        setCurrentScreen('welcome'); // 원래대로 welcome으로
      } else {
        setCurrentScreen('welcome'); // 기본값도 welcome으로
      }
      setScreenParams({});
    }
  };

  if (currentScreen === 'ChatRoom') {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#030712" />
        <ChatRoomScreen 
          navigation={navigation}
          route={{ params: { roomId: currentRoomId || '1' } }}
        />
      </>
    );
  }

  if (currentScreen === 'ChatRoomList') {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#030712" />
        <ChatRoomListScreen 
          navigation={navigation} 
          route={{ params: screenParams }}
        />
      </>
    );
  }

  if (currentScreen === 'MatchingWait') {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#030712" />
        <MatchingWaitScreen navigation={navigation} />
      </>
    );
  }

  if (currentScreen === 'MatchingResult') {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#030712" />
        <MatchingResultScreen 
          navigation={navigation}
          route={{ params: screenParams }}
        />
      </>
    );
  }

  if (currentScreen === 'nickname') {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#030712" />
        <NicknameScreen navigation={navigation} />
      </>
    );
  }

  if (currentScreen === 'EmotionSelection') {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#030712" />
        <EmotionSelectionScreen navigation={navigation} />
      </>
    );
  }

  if (currentScreen === 'FCMTest') {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#030712" />
        <FCMTestScreen navigation={navigation} />
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />
      <WelcomeScreen 
        navigation={navigation}
      />
    </>
  );
}

export default App;
