/**
 * OneDay Chat App
 * 자정에 사라지는 익명 채팅 앱
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';

import TestApp from './TestApp';
import NicknameScreen from './src/screens/onboarding/NicknameScreen';
import ChatRoomScreen from './src/screens/ChatRoomScreen';
import ChatRoomListScreen from './src/screens/ChatRoomListScreen';
import MatchingWaitScreen from './src/screens/MatchingWaitScreen';
import MatchingResultScreen from './src/screens/MatchingResultScreen';
import EmotionSelectionScreen from './src/screens/EmotionSelectionScreen';
import FCMTestScreen from './src/screens/FCMTestScreen';
import { midnightResetService } from './src/utils/midnightReset';
import { fcmService } from './src/services/fcmService';


function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [screenParams, setScreenParams] = useState<any>({});

  // 앱 시작시 서비스 초기화
  useEffect(() => {
    // 자정에 앱 상태 초기화 콜백 설정
    midnightResetService.onDataClear = () => {
      setCurrentScreen('welcome');
      setCurrentRoomId(null);
      setScreenParams({});
      console.log('🌙 앱 상태가 초기화되었습니다');
    };
    
    midnightResetService.startMidnightWatcher();
    
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

  const navigation = {
    navigate: (screen: string, params?: any) => {
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
        setCurrentScreen('welcome');
      } else if (currentScreen === 'FCMTest') {
        setCurrentScreen('welcome');
      } else {
        setCurrentScreen('welcome');
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
      <TestApp 
        onStartPress={() => setCurrentScreen('EmotionSelection')}
        onFCMTestPress={() => setCurrentScreen('FCMTest')}
      />
    </>
  );
}

export default App;
