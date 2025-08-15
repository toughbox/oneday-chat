/**
 * OneDay Chat App
 * 자정에 사라지는 익명 채팅 앱
 *
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import TestApp from './TestApp';

function App() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />
      <TestApp />
    </>
  );
}

export default App;
