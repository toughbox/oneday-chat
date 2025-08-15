import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../../navigation/OnboardingStack';
import { generateRandomNickname, validateNickname } from '../../utils/nicknameGenerator';

type NicknameScreenNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  'Nickname'
>;

interface Props {
  navigation: NicknameScreenNavigationProp;
}

const NicknameScreen: React.FC<Props> = ({ navigation }) => {
  const [nickname, setNickname] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // 화면 진입 시 자동으로 랜덤 닉네임 생성
    const randomNickname = generateRandomNickname();
    setNickname(randomNickname);
    setIsValid(true);
  }, []);

  const handleNicknameChange = (text: string) => {
    setNickname(text);
    const validation = validateNickname(text);
    setIsValid(validation.isValid);
    setErrorMessage(validation.message || '');
  };

  const generateNewNickname = () => {
    const newNickname = generateRandomNickname();
    setNickname(newNickname);
    setIsValid(true);
    setErrorMessage('');
  };

  const handleContinue = () => {
    if (!isValid) {
      Alert.alert('알림', errorMessage || '올바른 닉네임을 입력해주세요.');
      return;
    }
    
    // TODO: 닉네임을 앱 상태에 저장
    console.log('선택된 닉네임:', nickname);
    navigation.navigate('Tutorial');
  };

  const handleSkip = () => {
    // 기본 랜덤 닉네임으로 진행
    const defaultNickname = generateRandomNickname();
    console.log('기본 닉네임으로 진행:', defaultNickname);
    navigation.navigate('Tutorial');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}>닉네임 설정</Text>
            <Text style={styles.subtitle}>
              채팅에서 사용할 닉네임을 설정해주세요{'\n'}
              언제든지 변경할 수 있어요
            </Text>
          </View>

          {/* 닉네임 입력 영역 */}
          <View style={styles.inputSection}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  isValid ? styles.inputValid : styles.inputInvalid
                ]}
                value={nickname}
                onChangeText={handleNicknameChange}
                placeholder="닉네임을 입력하세요"
                placeholderTextColor="#6b7280"
                maxLength={20}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
              />
              <Text style={styles.charCount}>{nickname.length}/20</Text>
            </View>

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            <TouchableOpacity 
              style={styles.regenerateButton}
              onPress={generateNewNickname}
              activeOpacity={0.7}
            >
              <Text style={styles.regenerateButtonText}>🎲 새로운 닉네임 생성</Text>
            </TouchableOpacity>
          </View>

          {/* 예시 */}
          <View style={styles.exampleSection}>
            <Text style={styles.exampleTitle}>닉네임 예시</Text>
            <View style={styles.exampleList}>
              <Text style={styles.example}>• 밤하늘여행자123</Text>
              <Text style={styles.example}>• 신비한몽상가456</Text>
              <Text style={styles.example}>• 따뜻한이야기꾼789</Text>
            </View>
          </View>

          {/* 버튼 영역 */}
          <View style={styles.buttonSection}>
            <TouchableOpacity 
              style={[
                styles.continueButton,
                isValid ? styles.continueButtonActive : styles.continueButtonInactive
              ]}
              onPress={handleContinue}
              disabled={!isValid}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.continueButtonText,
                isValid ? styles.continueButtonTextActive : styles.continueButtonTextInactive
              ]}>
                계속하기
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>나중에 설정하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
  },
  inputSection: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    borderWidth: 2,
  },
  inputValid: {
    borderColor: '#10b981',
  },
  inputInvalid: {
    borderColor: '#ef4444',
  },
  charCount: {
    position: 'absolute',
    right: 16,
    top: 18,
    fontSize: 12,
    color: '#6b7280',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  regenerateButton: {
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 16,
  },
  regenerateButtonText: {
    color: '#d1d5db',
    fontSize: 16,
    fontWeight: '500',
  },
  exampleSection: {
    marginVertical: 32,
    alignItems: 'center',
  },
  exampleTitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 12,
  },
  exampleList: {
    alignItems: 'flex-start',
  },
  example: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  buttonSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  continueButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  continueButtonActive: {
    backgroundColor: '#3b82f6',
  },
  continueButtonInactive: {
    backgroundColor: '#374151',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  continueButtonTextActive: {
    color: '#ffffff',
  },
  continueButtonTextInactive: {
    color: '#6b7280',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    color: '#9ca3af',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export default NicknameScreen;
