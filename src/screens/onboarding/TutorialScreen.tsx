import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../../navigation/OnboardingStack';

type TutorialScreenNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  'Tutorial'
>;

interface Props {
  navigation: TutorialScreenNavigationProp;
}

const { width } = Dimensions.get('window');

interface TutorialStep {
  id: number;
  icon: string;
  title: string;
  description: string;
  details: string[];
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    icon: '💬',
    title: '자유로운 채팅',
    description: '익명으로 자유롭게 대화하세요',
    details: [
      '실명이나 개인정보 없이 대화 가능',
      '진솔한 이야기를 나눠보세요',
      '판단 없는 소통의 공간'
    ]
  },
  {
    id: 2,
    icon: '⏰',
    title: '24시간 제한',
    description: '자정이 되면 모든 대화가 사라져요',
    details: [
      '매일 자정 12시에 초기화',
      '흔적 없는 깨끗한 시작',
      '부담 없는 일회성 대화'
    ]
  },
  {
    id: 3,
    icon: '🚫',
    title: '규칙과 매너',
    description: '서로를 존중하며 대화해주세요',
    details: [
      '욕설, 비방, 혐오 표현 금지',
      '개인정보 공유 금지',
      '스팸, 광고성 메시지 금지'
    ]
  },
  {
    id: 4,
    icon: '🎭',
    title: '익명성 보장',
    description: '완전한 익명성이 보장됩니다',
    details: [
      'IP 주소나 기기 정보 수집 안함',
      '대화 내용 저장 안함',
      '추적 불가능한 안전한 공간'
    ]
  }
];

const TutorialScreen: React.FC<Props> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigation.navigate('Terms');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    navigation.navigate('Terms');
  };

  const currentTutorial = tutorialSteps[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>앱 사용법</Text>
          <Text style={styles.stepIndicator}>
            {currentStep + 1} / {tutorialSteps.length}
          </Text>
        </View>

        {/* 진행 바 */}
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }
            ]} 
          />
        </View>

        {/* 튜토리얼 내용 */}
        <ScrollView 
          style={styles.tutorialContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{currentTutorial.icon}</Text>
          </View>

          <Text style={styles.tutorialTitle}>{currentTutorial.title}</Text>
          <Text style={styles.tutorialDescription}>
            {currentTutorial.description}
          </Text>

          <View style={styles.detailsList}>
            {currentTutorial.details.map((detail, index) => (
              <View key={index} style={styles.detailItem}>
                <Text style={styles.detailBullet}>•</Text>
                <Text style={styles.detailText}>{detail}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* 버튼 영역 */}
        <View style={styles.buttonSection}>
          <View style={styles.navigationButtons}>
            <TouchableOpacity 
              style={[
                styles.previousButton,
                currentStep === 0 && styles.buttonDisabled
              ]}
              onPress={handlePrevious}
              disabled={currentStep === 0}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.previousButtonText,
                currentStep === 0 && styles.buttonTextDisabled
              ]}>
                이전
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === tutorialSteps.length - 1 ? '완료' : '다음'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>건너뛰기</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stepIndicator: {
    fontSize: 16,
    color: '#9ca3af',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    marginBottom: 40,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  tutorialContent: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 80,
  },
  tutorialTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  tutorialDescription: {
    fontSize: 18,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 32,
  },
  detailsList: {
    paddingHorizontal: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailBullet: {
    fontSize: 16,
    color: '#3b82f6',
    marginRight: 12,
    marginTop: 2,
  },
  detailText: {
    fontSize: 16,
    color: '#e5e7eb',
    lineHeight: 24,
    flex: 1,
  },
  buttonSection: {
    paddingBottom: 40,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  previousButton: {
    backgroundColor: '#374151',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    flex: 0.45,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    flex: 0.45,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#1f2937',
  },
  previousButtonText: {
    color: '#d1d5db',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: '#6b7280',
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

export default TutorialScreen;
