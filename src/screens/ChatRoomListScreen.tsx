import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Platform,
  Alert,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { chatRoomManager, ChatRoom } from '../services/chatRoomManager';
import { globalMessageHandler } from '../services/globalMessageHandler';
import { socketService } from '../services/socketService';
import { socketChatService } from '../services/socketChatService';
import { serverConfig } from '../config/serverConfig';

const { width: screenWidth } = Dimensions.get('window');

interface Props {
  navigation: {
    navigate: (screen: string, params?: any) => void;
  };
  route?: {
    params?: {
      newChatRoom?: {
        id: string;
        partnerName: string;
        avatar: string;
        welcomeMessage: string;
        createdAt: Date;
      };
    };
  };
}

const ChatRoomListScreen: React.FC<Props> = ({ navigation, route }) => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [timeLeft, setTimeLeft] = useState('18:23:45'); // 더미 타이머

  // 대화방 목록 초기화 및 변경 리스너 등록
  useEffect(() => {
    console.log('🏠 대화방 목록 화면 초기화');
    
    // 글로벌 소켓 연결 및 메시지 핸들러 초기화
    const initializeGlobalConnection = async () => {
      try {
        // 소켓 서버 연결
        if (!socketService.isConnected()) {
          console.log('🔌 소켓 서버 연결 시도...');
          const connected = await socketService.connect(serverConfig.socketUrl);
          if (connected) {
            console.log('✅ 소켓 서버 연결 성공');
            
            // 소켓 연결 완료 후 chatRoomManager 초기화 및 이전 메시지 요청
            await initializeChatRoomManager();
          } else {
            console.log('❌ 소켓 서버 연결 실패');
            // 연결 실패 시에도 chatRoomManager는 초기화 (로컬 데이터만)
            await initializeChatRoomManager();
          }
        } else {
          // 이미 연결된 경우 바로 chatRoomManager 초기화
          await initializeChatRoomManager();
        }
        
        // 글로벌 메시지 핸들러 초기화
        globalMessageHandler.initialize();
        console.log('🔥🔥🔥 GLOBAL MESSAGE HANDLER INITIALIZED 🔥🔥🔥');
      } catch (error) {
        console.error('❌ 글로벌 연결 초기화 실패:', error);
        // 에러 발생 시에도 chatRoomManager는 초기화
        await initializeChatRoomManager();
      }
    };
    
         // chatRoomManager 초기화 및 고아 대화방 정리
      const initializeChatRoomManager = async () => {
        await chatRoomManager.initialize();
        
        // 앱 시작 시 활성 대화방 목록 가져오기 (고아 방 정리 없이)
        let activeRooms = chatRoomManager.getChatRooms().filter(room => room.isActive);
        
        if (activeRooms.length > 0) {
          console.log(`📱 앱 시작: ${activeRooms.length}개 활성 대화방 로드됨`);
          
          // 각 대화방에 대해 이전 메시지 요청 (메시지 동기화)
          if (socketService.isConnected()) {
            console.log('🔄 대화방 메시지 동기화 시작...');
            
            // 약간의 지연 후 메시지 요청 (소켓 연결 안정화를 위해)
            setTimeout(async () => {
              for (const room of activeRooms) {
                try {
                  console.log(`📥 대화방 ${room.roomId} 이전 메시지 요청...`);
                  await socketChatService.requestPreviousMessages(room.roomId);
                } catch (error) {
                  console.error(`❌ 대화방 ${room.roomId} 메시지 요청 실패:`, error);
                }
              }
              console.log('✅ 모든 대화방 메시지 동기화 완료');
            }, 1000);
          }
        }
        
        // 대화방 목록을 화면에 표시
        setChatRooms(activeRooms);
        console.log('📱 앱 시작: 대화방 목록 표시 완료');
      };
    
    initializeGlobalConnection();
    
    // 대화방 변경 리스너 등록
    chatRoomManager.onChatRoomsChange((updatedRooms) => {
      console.log('🔄 대화방 목록 업데이트:', updatedRooms.length);
      // 활성 대화방만 표시
      const activeRooms = updatedRooms.filter(room => room.isActive);
      setChatRooms(activeRooms);
    });
    
    return () => {
      // 컴포넌트 언마운트 시 정리
      chatRoomManager.onChatRoomsChange(() => {});
    };
  }, []);

  // 새 대화방 추가 처리 (매칭 성공 시)
  useEffect(() => {
    const addNewChatRoom = async () => {
      if (route?.params?.newChatRoom) {
        const newRoom = route.params.newChatRoom;
        console.log('📥 새 대화방 추가 요청:', newRoom);
        
        // chatRoomManager에 추가
        await chatRoomManager.addChatRoom({
          id: newRoom.id,
          partnerName: newRoom.partnerName,
          partnerNickname: newRoom.partnerName,
          avatar: newRoom.avatar,
          roomId: newRoom.id,
        });
        
        // 매개변수 초기화 (중복 추가 방지)
        navigation.navigate('ChatRoomList', {});
        
        // 새 대화방으로 자동 이동
        setTimeout(() => {
          navigation.navigate('ChatRoom', { roomId: newRoom.id });
        }, 500);
      }
    };
    
    addNewChatRoom();
  }, [route?.params?.newChatRoom]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return '방금 전';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openChatRoom = (roomId: string) => {
    navigation.navigate('ChatRoom', { roomId });
  };

  const startNewChat = () => {
    if (chatRooms.length >= 5) {
      Alert.alert(
        '대화방 가득',
        '최대 5개까지만 대화방을 운영할 수 있어요.\n기존 대화방을 나간 후 새로운 매칭을 시도해주세요.',
        [{ text: '확인', style: 'default' }]
      );
      return;
    }
    navigation.navigate('MatchingWait');
  };

  const handleLeaveChatRoom = (roomId: string, partnerName: string) => {
    Alert.alert(
      '대화방 나가기',
      `'${partnerName}'와의 대화방을 나가시겠어요?\n대화 내용이 모두 삭제됩니다.`,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '나가기',
          style: 'destructive',
          onPress: async () => {
            console.log('🚪 대화방 나가기 시작:', roomId);
            
            try {
              // 1. 서버에 대화방 나가기 요청
              if (socketService.isConnected()) {
                socketService.leaveRoom(roomId);
                console.log('✅ 서버에 대화방 나가기 요청 완료:', roomId);
              }
              
              // 2. 로컬 저장소에서 채팅 데이터 삭제
              try {
                await socketChatService.deleteChatRoomData(roomId);
                console.log('✅ 로컬 채팅 데이터 삭제 완료:', roomId);
              } catch (error) {
                console.error('❌ 로컬 데이터 삭제 실패:', error);
              }
              
              // 3. chatRoomManager에서 대화방 완전 제거 (AsyncStorage에서도 삭제)
              await chatRoomManager.removeChatRoom(roomId);
              console.log('✅ 대화방 완전 제거 완료:', roomId);
              
            } catch (error) {
              console.error('❌ 대화방 나가기 실패:', error);
              Alert.alert('오류', '대화방을 나갈 수 없습니다. 다시 시도해주세요.');
            }
          },
        },
      ]
    );
  };

  const SwipeableChatRoomItem = ({ item }: { item: ChatRoom }) => {
    const translateX = new Animated.Value(0);
    const [isSwipeOpen, setIsSwipeOpen] = useState(false);

    const panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) { // 왼쪽으로 스와이프
          const newValue = Math.max(gestureState.dx, -80);
          translateX.setValue(newValue);
        } else if (isSwipeOpen && gestureState.dx > 0) { // 오른쪽으로 스와이프 (닫기)
          const newValue = Math.min(gestureState.dx - 80, 0);
          translateX.setValue(newValue);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -40) {
          // 왼쪽으로 충분히 스와이프 - 열기
          Animated.spring(translateX, {
            toValue: -80,
            useNativeDriver: true,
          }).start();
          setIsSwipeOpen(true);
        } else {
          // 원래 위치로 되돌리기
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          setIsSwipeOpen(false);
        }
      },
    });

    const handleLeavePress = () => {
      // 스와이프 닫기
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      setIsSwipeOpen(false);
      
      // 나가기 확인
      handleLeaveChatRoom(item.id, item.partnerName);
    };

    return (
      <View style={styles.chatRoomWrapper}>
        {/* 뒤에 숨겨진 나가기 버튼 */}
        <View style={styles.hiddenActions}>
          <TouchableOpacity 
            style={styles.swipeLeaveButton}
            onPress={handleLeavePress}
            activeOpacity={0.8}
          >
            <Text style={styles.swipeLeaveButtonText}>나가기</Text>
          </TouchableOpacity>
        </View>

        {/* 메인 채팅방 아이템 */}
        <Animated.View 
          style={[
            styles.chatRoomContainer,
            {
              transform: [{ translateX }]
            }
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity 
            style={styles.chatRoomItem}
            onPress={() => openChatRoom(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{item.avatar}</Text>
              {item.isActive && <View style={styles.onlineIndicator} />}
            </View>
            
            <View style={styles.chatRoomContent}>
              <View style={styles.chatRoomHeader}>
                <Text style={styles.partnerName}>{item.partnerName}</Text>
                <Text style={styles.lastMessageTime}>
                  {formatTime(item.lastMessageTime)}
                </Text>
              </View>
              
              <View style={styles.chatRoomFooter}>
                <Text 
                  style={styles.lastMessage}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.lastMessage}
                </Text>
                {item.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>
                      {item.unreadCount > 99 ? '99+' : item.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const renderChatRoom = ({ item }: { item: ChatRoom }) => (
    <SwipeableChatRoomItem item={item} />
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>OneDay Chat</Text>
            <Text style={styles.headerSubtitle}>
              {chatRooms.length}/5개 대화방
            </Text>
          </View>
          
          <View style={styles.timerContainer}>
            <Text style={styles.timerLabel}>자정까지</Text>
            <Text style={styles.timerText}>{timeLeft}</Text>
          </View>
        </View>

        {/* 대화방 목록 */}
        <FlatList
          data={chatRooms}
          renderItem={renderChatRoom}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.chatRoomList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>아직 대화방이 없어요</Text>
              <Text style={styles.emptySubtitle}>
                새로운 인연을 시작해보세요!
              </Text>
            </View>
          }
        />

        {/* 새 대화 시작 버튼 */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.newChatButton,
              chatRooms.length >= 5 && styles.newChatButtonDisabled
            ]}
            onPress={startNewChat}
            disabled={chatRooms.length >= 5}
            activeOpacity={0.8}
          >
            <Text style={styles.newChatButtonText}>
              {chatRooms.length >= 5 ? '대화방이 가득해요 😅' : '새로운 대화 시작하기 ✨'}
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
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
  },
  timerContainer: {
    alignItems: 'flex-end',
  },
  timerLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  chatRoomList: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chatRoomWrapper: {
    position: 'relative',
    marginBottom: 8,
    overflow: 'hidden',
    borderRadius: 12,
  },
  hiddenActions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeLeaveButton: {
    backgroundColor: '#ef4444',
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  swipeLeaveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  chatRoomContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  chatRoomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 32,
    width: 48,
    height: 48,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: '#374151',
    borderRadius: 24,
    overflow: 'hidden',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    backgroundColor: '#10b981',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1f2937',
  },
  chatRoomContent: {
    flex: 1,
  },
  chatRoomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  chatRoomFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#d1d5db',
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  newChatButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  newChatButtonDisabled: {
    backgroundColor: '#6b7280',
  },
  newChatButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChatRoomListScreen;
