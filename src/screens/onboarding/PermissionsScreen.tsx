import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../../navigation/OnboardingStack';

type PermissionsScreenNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  'Permissions'
>;

interface Props {
  navigation: PermissionsScreenNavigationProp;
}

interface Permission {
  id: string;
  icon: string;
  title: string;
  description: string;
  reason: string;
  granted: boolean;
  required: boolean;
}

const PermissionsScreen: React.FC<Props> = ({ navigation }) => {
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: 'notifications',
      icon: '🔔',
      title: '푸시 알림',
      description: '새로운 메시지 알림을 받을 수 있어요',
      reason: '실시간 채팅 알림을 위해 필요합니다',
      granted: false,
      required: false,
    },
    {
      id: 'battery',
      icon: '🔋',
      title: '배터리 최적화 해제',
      description: '백그라운드에서도 원활한 채팅이 가능해요',
      reason: '앱이 자동으로 종료되지 않도록 합니다',
      granted: false,
      required: false,
    },
    {
      id: 'background',
      icon: '🔄',
      title: 'Background App Refresh',
      description: 'iOS에서 백그라운드 새로고침을 허용해요',
      reason: '실시간 메시지 수신을 위해 필요합니다',
      granted: false,
      required: false,
    },
  ]);

  const handlePermissionRequest = async (permissionId: string) => {
    try {
      switch (permissionId) {
        case 'notifications':
          await requestNotificationPermission();
          break;
        case 'battery':
          await requestBatteryOptimization();
          break;
        case 'background':
          await requestBackgroundRefresh();
          break;
      }
    } catch (error) {
      console.log('Permission request error:', error);
    }
  };

  const requestNotificationPermission = async () => {
    // React Native에서 푸시 알림 권한 요청
    // 실제 구현에서는 react-native-push-notification 등의 라이브러리 사용
    Alert.alert(
      '푸시 알림 권한',
      '설정에서 알림을 허용해주세요.',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '설정으로 이동', 
          onPress: () => Linking.openSettings()
        }
      ]
    );
    
    updatePermissionStatus('notifications', true);
  };

  const requestBatteryOptimization = async () => {
    if (Platform.OS === 'android') {
      Alert.alert(
        '배터리 최적화',
        '원활한 채팅을 위해 배터리 최적화를 해제해주세요.',
        [
          { text: '나중에', style: 'cancel' },
          { 
            text: '설정으로 이동', 
            onPress: () => Linking.openSettings()
          }
        ]
      );
    }
    
    updatePermissionStatus('battery', true);
  };

  const requestBackgroundRefresh = async () => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'Background App Refresh',
        '설정 > 일반 > Background App Refresh에서 이 앱을 허용해주세요.',
        [
          { text: '나중에', style: 'cancel' },
          { 
            text: '설정으로 이동', 
            onPress: () => Linking.openSettings()
          }
        ]
      );
    }
    
    updatePermissionStatus('background', true);
  };

  const updatePermissionStatus = (permissionId: string, granted: boolean) => {
    setPermissions(prev => 
      prev.map(permission => 
        permission.id === permissionId 
          ? { ...permission, granted }
          : permission
      )
    );
  };

  const handleComplete = () => {
    // 온보딩 완료, 채팅방으로 이동
    navigation.reset({
      index: 0,
      routes: [{ name: 'ChatRoom' }],
    });
  };

  const handleSkip = () => {
    Alert.alert(
      '권한 설정 건너뛰기',
      '나중에도 설정에서 권한을 허용할 수 있어요. 지금 건너뛰시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        { text: '건너뛰기', onPress: handleComplete }
      ]
    );
  };

  const grantedCount = permissions.filter(p => p.granted).length;
  const allGranted = grantedCount === permissions.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>권한 설정</Text>
          <Text style={styles.subtitle}>
            원활한 채팅을 위해 권한을 허용해주세요{'\n'}
            모든 권한은 선택사항이에요
          </Text>
        </View>

        {/* 진행 상황 */}
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>
            {grantedCount} / {permissions.length} 완료
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${(grantedCount / permissions.length) * 100}%` }
              ]} 
            />
          </View>
        </View>

        {/* 권한 목록 */}
        <View style={styles.permissionsList}>
          {permissions.map((permission) => (
            <View key={permission.id} style={styles.permissionItem}>
              <View style={styles.permissionHeader}>
                <Text style={styles.permissionIcon}>{permission.icon}</Text>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionTitle}>{permission.title}</Text>
                  <Text style={styles.permissionDescription}>
                    {permission.description}
                  </Text>
                  <Text style={styles.permissionReason}>
                    {permission.reason}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.permissionButton,
                  permission.granted 
                    ? styles.permissionButtonGranted 
                    : styles.permissionButtonPending
                ]}
                onPress={() => handlePermissionRequest(permission.id)}
                disabled={permission.granted}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.permissionButtonText,
                  permission.granted 
                    ? styles.permissionButtonTextGranted 
                    : styles.permissionButtonTextPending
                ]}>
                  {permission.granted ? '허용됨 ✓' : '허용하기'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* 버튼 영역 */}
        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={[
              styles.completeButton,
              allGranted ? styles.completeButtonActive : styles.completeButtonPartial
            ]}
            onPress={handleComplete}
            activeOpacity={0.8}
          >
            <Text style={styles.completeButtonText}>
              {allGranted ? '설정 완료!' : '부분 설정으로 시작하기'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>모든 권한 건너뛰기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  permissionsList: {
    flex: 1,
  },
  permissionItem: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  permissionIcon: {
    fontSize: 32,
    marginRight: 16,
    marginTop: 4,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 4,
  },
  permissionReason: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  permissionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionButtonPending: {
    backgroundColor: '#3b82f6',
  },
  permissionButtonGranted: {
    backgroundColor: '#10b981',
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  permissionButtonTextPending: {
    color: '#ffffff',
  },
  permissionButtonTextGranted: {
    color: '#ffffff',
  },
  buttonSection: {
    paddingBottom: 40,
  },
  completeButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  completeButtonActive: {
    backgroundColor: '#10b981',
  },
  completeButtonPartial: {
    backgroundColor: '#3b82f6',
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#9ca3af',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export default PermissionsScreen;
