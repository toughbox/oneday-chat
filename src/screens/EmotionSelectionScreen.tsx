import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';

interface Props {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
}

interface Mood {
  emoji: string;
  name: string;
  description: string;
}

interface Interest {
  emoji: string;
  name: string;
  category: string;
}

const EmotionSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const moods: Mood[] = [
    { emoji: '😊', name: '행복해요', description: '기분이 좋고 즐거운 하루' },
    { emoji: '😔', name: '우울해요', description: '조금 슬프고 우울한 기분' },
    { emoji: '😴', name: '피곤해요', description: '하루 종일 지쳐서 힘들어요' },
    { emoji: '🤔', name: '생각 많아요', description: '여러 가지 고민이 많은 날' },
    { emoji: '😎', name: '여유로워요', description: '차분하고 평온한 마음' },
  ];

  const interests: Interest[] = [
    { emoji: '🎵', name: '음악', category: '취미' },
    { emoji: '🎬', name: '영화', category: '취미' },
    { emoji: '🎮', name: '게임', category: '취미' },
    { emoji: '📚', name: '독서', category: '취미' },
    { emoji: '✈️', name: '여행', category: '취미' },
    { emoji: '🍳', name: '요리', category: '취미' },
    { emoji: '🏃', name: '운동', category: '취미' },
    { emoji: '🎨', name: '그림', category: '취미' },
    { emoji: '📷', name: '사진', category: '취미' },
    { emoji: '💻', name: '코딩', category: '취미' },
    { emoji: '🌱', name: '식물', category: '취미' },
    { emoji: '🐕', name: '반려동물', category: '취미' },
  ];

  const toggleInterest = (interestName: string) => {
    if (selectedInterests.includes(interestName)) {
      setSelectedInterests(prev => prev.filter(interest => interest !== interestName));
    } else if (selectedInterests.length < 3) {
      setSelectedInterests(prev => [...prev, interestName]);
    }
  };

  const handleComplete = () => {
    // 선택된 감정과 관심사를 저장하고 대화방 목록으로 이동
    console.log('선택된 기분:', selectedMood);
    console.log('선택된 관심사:', selectedInterests);
    
    // TODO: AsyncStorage에 저장
    navigation.navigate('ChatRoomList');
  };

  const canComplete = selectedMood && selectedInterests.length > 0;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>오늘의 기분</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 기분 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>지금 기분이 어떠세요?</Text>
            <Text style={styles.sectionSubtitle}>하나를 선택해주세요</Text>
            
            <View style={styles.moodGrid}>
              {moods.map((mood) => (
                <TouchableOpacity
                  key={mood.name}
                  style={[
                    styles.moodItem,
                    selectedMood === mood.name && styles.moodItemSelected
                  ]}
                  onPress={() => setSelectedMood(mood.name)}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={styles.moodName}>{mood.name}</Text>
                  <Text style={styles.moodDescription}>{mood.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 관심사 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>관심사를 알려주세요</Text>
            <Text style={styles.sectionSubtitle}>
              최대 3개까지 선택 가능 ({selectedInterests.length}/3)
            </Text>
            
            <View style={styles.interestGrid}>
              {interests.map((interest) => (
                <TouchableOpacity
                  key={interest.name}
                  style={[
                    styles.interestItem,
                    selectedInterests.includes(interest.name) && styles.interestItemSelected,
                    selectedInterests.length >= 3 && !selectedInterests.includes(interest.name) && styles.interestItemDisabled
                  ]}
                  onPress={() => toggleInterest(interest.name)}
                  disabled={selectedInterests.length >= 3 && !selectedInterests.includes(interest.name)}
                >
                  <Text style={styles.interestEmoji}>{interest.emoji}</Text>
                  <Text style={styles.interestName}>{interest.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 선택 결과 미리보기 */}
          {(selectedMood || selectedInterests.length > 0) && (
            <View style={styles.previewSection}>
              <Text style={styles.previewTitle}>선택한 내용</Text>
              
              {selectedMood && (
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>오늘 기분:</Text>
                  <Text style={styles.previewValue}>
                    {moods.find(m => m.name === selectedMood)?.emoji} {selectedMood}
                  </Text>
                </View>
              )}
              
              {selectedInterests.length > 0 && (
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>관심사:</Text>
                  <Text style={styles.previewValue}>
                    {selectedInterests.map(interest => {
                      const found = interests.find(i => i.name === interest);
                      return `${found?.emoji} ${interest}`;
                    }).join(', ')}
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* 완료 버튼 */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.completeButton,
              canComplete ? styles.completeButtonActive : styles.completeButtonInactive
            ]}
            onPress={handleComplete}
            disabled={!canComplete}
          >
            <Text style={styles.completeButtonText}>
              {canComplete ? '매칭 시작하기 ✨' : '기분과 관심사를 선택해주세요'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  moodGrid: {
    gap: 12,
  },
  moodItem: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  moodItemSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e3a8a',
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  moodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  moodDescription: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  interestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestItem: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    width: '30%',
    minWidth: 100,
  },
  interestItemSelected: {
    borderColor: '#10b981',
    backgroundColor: '#064e3b',
  },
  interestItemDisabled: {
    opacity: 0.5,
  },
  interestEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  interestName: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
  },
  previewSection: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    marginVertical: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  previewItem: {
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  completeButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  completeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  completeButtonInactive: {
    backgroundColor: '#6b7280',
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EmotionSelectionScreen;
