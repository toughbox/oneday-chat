/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// FCM 백그라운드 메시지 핸들러 설정
import messaging from '@react-native-firebase/messaging';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📱 백그라운드 메시지 수신:', remoteMessage);
  
  // 백그라운드에서는 자동으로 시스템 알림이 표시됨
  // 추가 로직이 필요하면 여기에 구현
});

AppRegistry.registerComponent(appName, () => App);
