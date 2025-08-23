import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../../navigation/OnboardingStack';

type WelcomeScreenNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  'Welcome'
>;

interface Props {
  navigation: WelcomeScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const handleAnonymousEntry = () => {
    // 기분과 관심사 선택 과정 없이 바로 대화방 목록으로
    navigation.navigate('ChatRoomList');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 로고 및 제목 영역 */}
        <View style={styles.headerSection}>
          <Text style={styles.logo}>🌙</Text>
          <Text style={styles.title}>OneDay Chat</Text>
          <Text style={styles.subtitle}>자정에 사라지는 익명 채팅</Text>
        </View>

        {/* 설명 영역 */}
        <View style={styles.descriptionSection}>
          <Text style={styles.description}>
            매일 자정, 모든 대화가 사라집니다.{'\n'}
            진실한 대화를 시작해보세요.
          </Text>
          
          <View style={styles.featureList}>
            <Text style={styles.feature}>✨ 완전 익명 채팅</Text>
            <Text style={styles.feature}>⏰ 24시간 후 자동 삭제</Text>
            <Text style={styles.feature}>🚫 회원가입 불필요</Text>
          </View>
        </View>

        {/* 버튼 영역 */}
        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={styles.enterButton} 
            onPress={handleAnonymousEntry}
            activeOpacity={0.8}
          >
            <Text style={styles.enterButtonText}>익명으로 시작하기</Text>
          </TouchableOpacity>
          
          <Text style={styles.disclaimer}>
            입장과 동시에 24시간 타이머가 시작됩니다
          </Text>
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
    justifyContent: 'space-between',
  },
  headerSection: {
    alignItems: 'center',
    marginTop: height * 0.1,
  },
  logo: {
    fontSize: 72,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  descriptionSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  description: {
    fontSize: 18,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
  },
  featureList: {
    alignItems: 'flex-start',
  },
  feature: {
    fontSize: 16,
    color: '#e5e7eb',
    marginBottom: 12,
    paddingLeft: 8,
  },
  buttonSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  enterButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  enterButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});

export default WelcomeScreen;
