import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Platform,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { socketMatchingService } from '../services/socketMatchingService';

interface Props {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
}

const MatchingWaitScreen: React.FC<Props> = ({ navigation }) => {
  const [waitingCount, setWaitingCount] = useState(0);
  const [averageTime, setAverageTime] = useState(45);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isMatching, setIsMatching] = useState(true);
  
  // 회전 애니메이션 - useRef로 애니메이션 값을 보호
  const spinValue = useRef(new Animated.Value(0)).current;
  
  // 매칭 성공 콜백 등록 (최우선)
  useEffect(() => {
    console.log('📝 매칭 성공 콜백 등록...');
    
    socketMatchingService.onMatchFound((matchData: any) => {
      console.log('🎉 Socket.io 매칭 성공!', matchData);
      setIsMatching(false);
      
      navigation.navigate('MatchingResult', {
        success: true,
        elapsedTime: elapsedTime,
        roomId: matchData.roomId,
        partnerId: matchData.partnerId,
        partnerNickname: matchData.partnerNickname
      });
    });
  }, [elapsedTime, navigation]);

  // 무한 회전 애니메이션
  useEffect(() => {
    const rotateAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      { iterations: -1 }
    );
    
    rotateAnimation.start();
    
    // cleanup 함수에서만 정리
    return () => {
      rotateAnimation.stop();
    };
  }, []);

  // Socket.io 매칭 시작
  useEffect(() => {
    const startMatching = async () => {
      try {
        console.log('🔍 Socket.io 매칭 시작...');
        
        // Socket.io 매칭 요청 시작
        const success = await socketMatchingService.requestMatch(['일반'], '😊');
        
        if (!success) {
          Alert.alert('연결 오류', 'Socket.io 서버에 연결할 수 없습니다.');
          navigation.goBack();
        }
        
      } catch (error) {
        console.error('❌ Socket.io 매칭 시작 실패:', error);
        Alert.alert('오류', '매칭을 시작할 수 없습니다.');
        navigation.goBack();
      }
    };
    
    startMatching();
    
    // 타이머들
    const timer = setInterval(() => {
      if (isMatching) {
        setElapsedTime(prev => prev + 1);
      }
    }, 1000);

    const dataTimer = setInterval(() => {
      if (isMatching) {
        // Socket.io 서버 상태를 기반으로 대기자 수 시뮬레이션
        setWaitingCount(prev => Math.max(0, Math.min(5, prev + Math.floor(Math.random() * 3) - 1)));
        
        // 평균 시간 시뮬레이션
        setAverageTime(prev => Math.max(30, prev + Math.floor(Math.random() * 10) - 5));
      }
    }, 2000);

    // 매칭 타임아웃 (2분)
    const matchingTimeout = setTimeout(() => {
      if (isMatching) {
        setIsMatching(false);
        socketMatchingService.cancelMatch();
        
        navigation.navigate('MatchingResult', { 
          success: false,
          elapsedTime: elapsedTime 
        });
      }
    }, 120000); // 2분

    return () => {
      clearInterval(timer);
      clearInterval(dataTimer);
      clearTimeout(matchingTimeout);
      
      // 매칭 정리
      if (isMatching) {
        socketMatchingService.cancelMatch();
      }
    };
  }, []);

  const handleCancel = async () => {
    setIsMatching(false);
    
    // Socket.io 매칭 취소
    await socketMatchingService.cancelMatch();
    
    navigation.goBack();
  };

  const spinInterpolation = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
            onPress={handleCancel}
          >
            <Text style={styles.backButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>매칭 중</Text>
          <View style={styles.placeholder} />
        </View>

        {/* 메인 콘텐츠 */}
        <View style={styles.content}>
          {/* 로딩 애니메이션 */}
          <View style={styles.loadingContainer}>
            <Animated.View 
              style={[
                styles.loadingCircle,
                {
                  transform: [{ rotate: spinInterpolation }]
                }
              ]}
            >
              <Text style={styles.loadingIcon}>⚡</Text>
            </Animated.View>
            
            <Text style={styles.matchingTitle}>매칭 중...</Text>
            <Text style={styles.matchingSubtitle}>
              익명의 누군가를 찾고 있어요
            </Text>
          </View>

          {/* 통계 정보 */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>👥</Text>
              <Text style={styles.statLabel}>대기 중</Text>
              <Text style={styles.statValue}>{waitingCount}명</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>⏱️</Text>
              <Text style={styles.statLabel}>평균 시간</Text>
              <Text style={styles.statValue}>{averageTime}초</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>⏰</Text>
              <Text style={styles.statLabel}>경과 시간</Text>
              <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
            </View>
          </View>

          {/* 안내 메시지 */}
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              💫 새로운 인연을 찾고 있어요
            </Text>
            <Text style={styles.messageSubtext}>
              잠시만 기다려주세요...
            </Text>
          </View>
        </View>

        {/* 하단 버튼 */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>매칭 취소</Text>
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
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  loadingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingIcon: {
    fontSize: 40,
  },
  matchingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  matchingSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  messageContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  messageText: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  messageSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  bottomContainer: {
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MatchingWaitScreen;
