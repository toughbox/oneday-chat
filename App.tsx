/**
 * OneDay Chat App
 * 자정에 사라지는 익명 채팅 앱
 *
 * @format
 */

import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import TestApp from './TestApp';
import NicknameScreen from './src/screens/onboarding/NicknameScreen';
import ChatRoomScreen from './src/screens/ChatRoomScreen';
import ChatRoomListScreen from './src/screens/ChatRoomListScreen';
import MatchingWaitScreen from './src/screens/MatchingWaitScreen';
import MatchingResultScreen from './src/screens/MatchingResultScreen';

function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [screenParams, setScreenParams] = useState<any>({});

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

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />
      <TestApp onStartPress={() => setCurrentScreen('ChatRoomList')} />
    </>
  );
}

export default App;
