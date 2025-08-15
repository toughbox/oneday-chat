import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../../navigation/OnboardingStack';

type TermsScreenNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  'Terms'
>;

interface Props {
  navigation: TermsScreenNavigationProp;
}

interface TermItem {
  id: string;
  title: string;
  content: string;
  required: boolean;
}

const termsData: TermItem[] = [
  {
    id: 'service',
    title: '서비스 이용약관',
    content: `1. 익명성 보장
• 사용자의 개인정보를 수집하지 않습니다
• IP 주소나 기기 정보를 저장하지 않습니다
• 완전한 익명성이 보장됩니다

2. 24시간 제한
• 모든 채팅 내용은 자정에 자동 삭제됩니다
• 삭제된 내용은 복구할 수 없습니다
• 매일 새로운 채팅방이 생성됩니다

3. 금지 행위
• 욕설, 비방, 혐오 표현
• 개인정보 공유 또는 요청
• 스팸, 광고성 메시지
• 불법적인 내용 게시

4. 서비스 중단
• 앱 운영자는 필요시 서비스를 중단할 수 있습니다
• 긴급상황 시 사전 공지 없이 중단 가능합니다`,
    required: true
  },
  {
    id: 'privacy',
    title: '개인정보 처리방침',
    content: `1. 수집하는 정보
• 닉네임 (임시, 매일 초기화)
• 채팅 메시지 (24시간 후 자동 삭제)
• 기타 개인식별정보는 수집하지 않음

2. 정보 이용 목적
• 채팅 서비스 제공
• 서비스 개선 및 품질 향상
• 부적절한 사용 방지

3. 정보 보관 기간
• 채팅 메시지: 24시간
• 닉네임: 24시간
• 로그 데이터: 수집하지 않음

4. 정보 제3자 제공
• 사용자 정보를 제3자에게 제공하지 않습니다
• 법적 요구가 있어도 제공할 정보가 없습니다`,
    required: true
  }
];

const TermsScreen: React.FC<Props> = ({ navigation }) => {
  const [agreedTerms, setAgreedTerms] = useState<Set<string>>(new Set());
  const [allAgreed, setAllAgreed] = useState(false);

  const handleTermToggle = (termId: string) => {
    const newAgreedTerms = new Set(agreedTerms);
    if (newAgreedTerms.has(termId)) {
      newAgreedTerms.delete(termId);
    } else {
      newAgreedTerms.add(termId);
    }
    setAgreedTerms(newAgreedTerms);
    
    // 모든 필수 약관에 동의했는지 확인
    const requiredTerms = termsData.filter(term => term.required);
    const allRequiredAgreed = requiredTerms.every(term => newAgreedTerms.has(term.id));
    setAllAgreed(allRequiredAgreed);
  };

  const handleAllToggle = () => {
    if (allAgreed) {
      setAgreedTerms(new Set());
      setAllAgreed(false);
    } else {
      const allTermIds = termsData.map(term => term.id);
      setAgreedTerms(new Set(allTermIds));
      setAllAgreed(true);
    }
  };

  const handleContinue = () => {
    const requiredTerms = termsData.filter(term => term.required);
    const allRequiredAgreed = requiredTerms.every(term => agreedTerms.has(term.id));
    
    if (!allRequiredAgreed) {
      Alert.alert('알림', '필수 약관에 모두 동의해주세요.');
      return;
    }
    
    navigation.navigate('Permissions');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>이용약관 동의</Text>
          <Text style={styles.subtitle}>
            서비스 이용을 위해 약관에 동의해주세요
          </Text>
        </View>

        {/* 전체 동의 */}
        <TouchableOpacity 
          style={styles.allAgreeContainer}
          onPress={handleAllToggle}
          activeOpacity={0.8}
        >
          <View style={[
            styles.checkbox,
            allAgreed && styles.checkboxChecked
          ]}>
            {allAgreed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.allAgreeText}>모든 약관에 동의합니다</Text>
        </TouchableOpacity>

        {/* 약관 목록 */}
        <ScrollView 
          style={styles.termsList}
          showsVerticalScrollIndicator={false}
        >
          {termsData.map((term) => (
            <View key={term.id} style={styles.termItem}>
              <TouchableOpacity 
                style={styles.termHeader}
                onPress={() => handleTermToggle(term.id)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.checkbox,
                  agreedTerms.has(term.id) && styles.checkboxChecked
                ]}>
                  {agreedTerms.has(term.id) && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.termTitleContainer}>
                  <Text style={styles.termTitle}>
                    {term.required && <Text style={styles.required}>[필수] </Text>}
                    {term.title}
                  </Text>
                </View>
              </TouchableOpacity>
              
              <ScrollView 
                style={styles.termContentContainer}
                nestedScrollEnabled={true}
              >
                <Text style={styles.termContent}>{term.content}</Text>
              </ScrollView>
            </View>
          ))}
        </ScrollView>

        {/* 버튼 영역 */}
        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={[
              styles.continueButton,
              allAgreed ? styles.continueButtonActive : styles.continueButtonInactive
            ]}
            onPress={handleContinue}
            disabled={!allAgreed}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.continueButtonText,
              allAgreed ? styles.continueButtonTextActive : styles.continueButtonTextInactive
            ]}>
              다음 단계로
            </Text>
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
  },
  allAgreeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6b7280',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  allAgreeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  termsList: {
    flex: 1,
    marginBottom: 24,
  },
  termItem: {
    backgroundColor: '#111827',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  termTitleContainer: {
    flex: 1,
  },
  termTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  required: {
    color: '#ef4444',
  },
  termContentContainer: {
    maxHeight: 120,
    padding: 16,
  },
  termContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#d1d5db',
  },
  buttonSection: {
    paddingBottom: 40,
  },
  continueButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
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
});

export default TermsScreen;
