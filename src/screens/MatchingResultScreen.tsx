import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { chatRoomManager } from '../services/chatRoomManager';

interface Props {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
  route: {
    params: {
      success: boolean;
      elapsedTime?: number;
      roomId?: string;
      partnerId?: string;
      partnerNickname?: string;
      partnerUserId?: string;
    };
  };
}

const MatchingResultScreen: React.FC<Props> = ({ navigation, route }) => {
  const { success, elapsedTime = 0, roomId, partnerId, partnerNickname, partnerUserId } = route.params;
  const [partner, setPartner] = useState<any>(null);
  
  // 애니메이션 값들
  const scaleValue = new Animated.Value(1); // 초기값을 1로 변경
  const fadeValue = new Animated.Value(1); // 초기값을 1로 변경

  useEffect(() => {
    if (success) {
      // Firebase에서 받은 실제 매칭 정보 사용
      if (partnerNickname && roomId) {
        const avatars = ['🌙', '⭐', '🔭', '🗺️', '✏️', '📚', '🎵', '☕', '🎨', '🌸'];
        const welcomeMessages = [
          '안녕하세요! 반가워요 😊',
          '처음 뵙겠습니다! 잘 부탁드려요 ✨',
          '오늘 밤 좋은 대화 나누어요! 🌌',
          '새로운 만남이 설레네요! 🎭',
          '밤늦게 수고하세요! 😄',
          '좋은 책 있으면 추천해주세요! 📖',
          '어떤 음악 좋아하세요? 🎶',
          '밤에도 커피 마시시나요? ☕'
        ];
        
        const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
        const randomWelcomeMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
        
        setPartner({
          name: partnerNickname,
          avatar: randomAvatar,
          welcomeMessage: randomWelcomeMessage,
          roomId: roomId,
          partnerId: partnerId,
          partnerUserId: partnerUserId
        });
      } else {
        // 기본값 (테스트용)
        setPartner({
          name: '익명의 친구',
          avatar: '🌟',
          welcomeMessage: '안녕하세요! 😊',
          roomId: 'test_room',
          partnerId: 'test_user'
        });
      }
    }

    // 애니메이션 시작 (부드러운 등장)
    scaleValue.setValue(0.8);
    fadeValue.setValue(0.5);
    
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [success]);

  const handleStartChat = () => {
    if (success && partner) {
      // route.params에서 roomId를 가져와야 함
      const roomId = route?.params?.roomId || partner.roomId || Date.now().toString();
      
      console.log('🏠 새 대화방 추가 - 매칭 성공:', {
        roomId,
        partnerName: partner.name,
        routeParams: route?.params
      });
      
      // chatRoomManager에 새 대화방 추가
      chatRoomManager.addChatRoom({
        id: roomId,
        partnerName: partner.name,
        partnerNickname: partner.name,
        partnerUserId: partner.partnerUserId,
        avatar: partner.avatar,
        roomId: roomId,
      });
      
      // 바로 채팅방으로 이동
      navigation.navigate('ChatRoom', {
        roomId: roomId,
        partnerName: partner.name,
        partnerId: partner.partnerId,
        avatar: partner.avatar,
      });
    }
  };

  const handleTryAgain = () => {
    navigation.navigate('MatchingWait');
  };

  const handleGoBack = () => {
    navigation.navigate('ChatRoomList');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Text style={styles.backButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {success ? '매칭 성공' : '매칭 실패'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* 메인 콘텐츠 */}
        <Animated.View 
          style={[
            styles.content,
            {
              transform: [{ scale: scaleValue }],
              opacity: fadeValue,
            }
          ]}
        >
          {success ? (
            // 매칭 성공
            <>
              <View style={styles.successContainer}>
                <Text style={styles.successIcon}>✨</Text>
                <Text style={styles.resultTitle}>매칭 성공!</Text>
                <Text style={styles.resultSubtitle}>
                  새로운 인연을 찾았어요
                </Text>
              </View>

              {partner && (
                <View style={styles.partnerContainer}>
                  <View style={styles.partnerAvatar}>
                    <Text style={styles.partnerAvatarText}>{partner.avatar}</Text>
                    <View style={styles.onlineBadge}>
                      <Text style={styles.onlineBadgeText}>●</Text>
                    </View>
                  </View>
                  <Text style={styles.partnerName}>{partner.name}님과</Text>
                  <Text style={styles.partnerSubtext}>연결되었습니다!</Text>
                  
                  {/* 상대방 정보 카드들 */}
                  <View style={styles.infoCardsContainer}>
                    <View style={styles.infoCard}>
                      <Text style={styles.infoCardIcon}>🌟</Text>
                      <Text style={styles.infoCardLabel}>상태</Text>
                      <Text style={styles.infoCardValue}>온라인</Text>
                    </View>
                    
                    <View style={styles.infoCard}>
                      <Text style={styles.infoCardIcon}>🎯</Text>
                      <Text style={styles.infoCardLabel}>매칭</Text>
                      <Text style={styles.infoCardValue}>즉시</Text>
                    </View>
                    
                    <View style={styles.infoCard}>
                      <Text style={styles.infoCardIcon}>⏰</Text>
                      <Text style={styles.infoCardLabel}>시간</Text>
                      <Text style={styles.infoCardValue}>23:45</Text>
                    </View>
                  </View>
                  
                  <View style={styles.welcomeMessageContainer}>
                    <Text style={styles.welcomeMessageLabel}>첫 메시지</Text>
                    <Text style={styles.welcomeMessage}>
                      "{partner.welcomeMessage}"
                    </Text>
                  </View>

                  {/* 매칭 정보 */}
                  <View style={styles.matchingInfoContainer}>
                    <View style={styles.matchingInfoItem}>
                      <Text style={styles.matchingInfoIcon}>🎭</Text>
                      <Text style={styles.matchingInfoText}>완전 익명 대화</Text>
                    </View>
                    <View style={styles.matchingInfoItem}>
                      <Text style={styles.matchingInfoIcon}>⏰</Text>
                      <Text style={styles.matchingInfoText}>자정까지 유효</Text>
                    </View>
                    <View style={styles.matchingInfoItem}>
                      <Text style={styles.matchingInfoIcon}>🔒</Text>
                      <Text style={styles.matchingInfoText}>안전한 채팅</Text>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.statsContainer}>
                <Text style={styles.statsText}>
                  ⏱️ 매칭 시간: {formatTime(elapsedTime)}
                </Text>
              </View>
            </>
          ) : (
            // 매칭 실패
            <>
              <View style={styles.failContainer}>
                <Text style={styles.failIcon}>😔</Text>
                <Text style={styles.resultTitle}>매칭 실패</Text>
                <Text style={styles.resultSubtitle}>
                  현재 매칭 가능한 사용자가 없습니다
                </Text>
              </View>

              <View style={styles.retryMessageContainer}>
                <Text style={styles.retryMessage}>
                  • 잠시 후 다시 시도해보세요
                </Text>
                <Text style={styles.retryMessage}>
                  • 더 많은 사용자가 접속하는 시간대를 이용해보세요
                </Text>
                <Text style={styles.retryMessage}>
                  • 오후 8시-12시가 가장 활발해요
                </Text>
              </View>
            </>
          )}
        </Animated.View>

        {/* 하단 버튼들 */}
        <View style={styles.bottomContainer}>
          {success ? (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleStartChat}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>대화 시작하기</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleGoBack}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>나중에 하기</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleTryAgain}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>다시 시도</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleGoBack}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>대화방 목록</Text>
              </TouchableOpacity>
            </>
          )}
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
    fontSize: 20,
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  successIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  failContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  failIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  partnerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  partnerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1f2937',
    borderWidth: 3,
    borderColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineBadgeText: {
    color: '#10b981',
    fontSize: 12,
  },
  partnerAvatarText: {
    fontSize: 36,
  },
  partnerName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  partnerSubtext: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 20,
  },
  welcomeMessageContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  welcomeMessageLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
    fontWeight: '600',
  },
  welcomeMessage: {
    fontSize: 14,
    color: '#ffffff',
    fontStyle: 'italic',
  },
  infoCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  infoCard: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
    flex: 1,
    marginHorizontal: 4,
  },
  infoCardIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  infoCardLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginBottom: 2,
    fontWeight: '600',
  },
  infoCardValue: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  matchingInfoContainer: {
    width: '100%',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  matchingInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchingInfoIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
  },
  matchingInfoText: {
    fontSize: 13,
    color: '#d1d5db',
    flex: 1,
  },
  statsContainer: {
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  retryMessageContainer: {
    alignItems: 'flex-start',
    width: '100%',
  },
  retryMessage: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
    lineHeight: 20,
  },
  bottomContainer: {
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#6b7280',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MatchingResultScreen;
