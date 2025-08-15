/**
 * OneDay Chat App
 * 자정에 사라지는 익명 채팅 앱
 *
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ChatRoomScreen from './src/screens/ChatRoomScreen';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />
      <ChatRoomScreen />
    </SafeAreaProvider>
  );
}

export default App;
