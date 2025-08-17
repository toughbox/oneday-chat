import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { socketChatService } from '../services/socketChatService';
import { chatRoomManager } from '../services/chatRoomManager';

const { width, height } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  isMyMessage: boolean;
  timestamp: Date;
  status: 'sending' | 'sent' | 'read';
}

interface Props {
  navigation?: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
  route?: {
    params?: {
      roomId?: string;
    };
  };
}

const ChatRoomScreen: React.FC<Props> = ({ navigation, route }) => {
  const roomId = route?.params?.roomId || '1';
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [timeLeft, setTimeLeft] = useState('23:45:30'); // 더미 타이머
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Socket.io 초기화 및 채팅방 연결
  useEffect(() => {
    const initializeChat = async () => {
      try {
        console.log(`🚀 채팅방 ${roomId} 연결 시도...`);
        
        // 채팅방 입장
        await socketChatService.joinRoom(roomId);
        setIsConnected(true);
        console.log(`✅ 채팅방 ${roomId} 연결 완료`);
        
        // 읽지 않은 메시지 수 초기화
        chatRoomManager.resetUnreadCount(roomId);
        
        // 메시지 수신 리스너 등록
        socketChatService.onMessage((message: any) => {
          console.log('📨 메시지 수신 - 전체 데이터:', JSON.stringify(message, null, 2));
          console.log('📨 메시지 sender:', message.sender);
          console.log('📨 메시지 text:', message.text);
          
          // 내가 보낸 메시지는 이미 화면에 표시되어 있으므로 무시
          if (message.sender === 'me') {
            console.log('⏭️ 내가 보낸 메시지이므로 무시');
            return;
          }
          
          console.log('✅ 상대방 메시지로 처리:', message.text);
          const newMessage: Message = {
            id: message.id || Date.now().toString(),
            text: message.text,
            isMyMessage: false,
            timestamp: new Date(message.timestamp),
            status: 'read',
          };
          setMessages(prev => [...prev, newMessage]);
          
          // 대화방 목록의 마지막 메시지 업데이트
          chatRoomManager.updateLastMessage(roomId, message.text, new Date(message.timestamp));
          
          // 스크롤을 맨 아래로
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        });
        
      } catch (error) {
        console.error('❌ 채팅방 연결 실패:', error);
        setIsConnected(false);
        Alert.alert(
          '연결 실패',
          '채팅방에 연결할 수 없습니다. 네트워크를 확인해주세요.',
          [
            {
              text: '확인',
              onPress: () => navigation?.goBack(),
            },
          ]
        );
      }
    };

    initializeChat();

    // 컴포넌트 언마운트 시 채팅방 나가기
    return () => {
      socketChatService.leaveRoom(roomId);
      console.log(`👋 채팅방 ${roomId} 연결 해제`);
    };
  }, [roomId, navigation]);

  // 24시간 타이머 시뮬레이션
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      
      const diff = midnight.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const sendMessage = async () => {
    if (inputText.trim() === '' || !isConnected) return;

    const messageText = inputText.trim();
    const messageId = Date.now().toString();

    // 내 메시지를 화면에 즉시 표시
    const newMessage: Message = {
      id: messageId,
      text: messageText,
      isMyMessage: true,
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    try {
      // Socket.io로 메시지 전송
      socketChatService.sendMessage(roomId, messageText);

      // 전송 완료 상태로 업데이트
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, status: 'sent' } : msg
        )
      );
      
      // 대화방 목록의 마지막 메시지 업데이트
      chatRoomManager.updateLastMessage(roomId, messageText, new Date());

      console.log('📤 메시지 전송 완료:', messageText);

    } catch (error) {
      console.error('❌ 메시지 전송 실패:', error);
      
      // 전송 실패 시 메시지 제거 또는 재전송 옵션 제공
      Alert.alert(
        '전송 실패',
        '메시지를 전송할 수 없습니다. 다시 시도하시겠어요?',
        [
          {
            text: '취소',
            onPress: () => {
              // 실패한 메시지 제거
              setMessages(prev => prev.filter(msg => msg.id !== messageId));
            },
          },
          {
            text: '재시도',
            onPress: () => {
              // 재전송 시도
              setInputText(messageText);
              setMessages(prev => prev.filter(msg => msg.id !== messageId));
            },
          },
        ]
      );
    }

    // 스크롤을 맨 아래로
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleLeaveRoom = () => {
    Alert.alert(
      '대화방 나가기',
      '정말로 이 대화방을 나가시겠어요?\n대화 내용이 모두 삭제됩니다.',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '나가기',
          style: 'destructive',
          onPress: () => {
            // TODO: 대화방 데이터 삭제 로직
            navigation?.goBack();
          },
        },
      ]
    );
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sending': return '⏳';
      case 'sent': return '✓';
      case 'read': return '✓✓';
      default: return '';
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* 헤더 */}
        <View style={styles.header}>
        <View style={styles.headerLeft}>
          {navigation && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
          )}
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>🎭</Text>
          </View>
          <View>
            <Text style={styles.partnerName}>익명의 누군가</Text>
            <Text style={[styles.onlineStatus, { color: isConnected ? '#10b981' : '#ef4444' }]}>
              {isTyping ? '입력 중...' : isConnected ? '온라인' : '연결 중...'}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={toggleMenu}
          >
            <Text style={styles.menuButtonText}>⋮</Text>
          </TouchableOpacity>
          
          <View style={styles.timerContainer}>
            <Text style={styles.timerLabel}>자정까지</Text>
            <Text style={styles.timerText}>{timeLeft}</Text>
          </View>
        </View>
      </View>

      {/* 메뉴 드롭다운 */}
      {showMenu && (
        <View style={styles.menuOverlay}>
          <TouchableOpacity 
            style={styles.menuOverlayBackground}
            onPress={() => setShowMenu(false)}
          />
          <View style={styles.menuDropdown}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleLeaveRoom}
            >
              <Text style={styles.menuItemIcon}>🚪</Text>
              <Text style={styles.menuItemText}>대화방 나가기</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 메시지 영역 */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageWrapper,
                message.isMyMessage ? styles.myMessageWrapper : styles.otherMessageWrapper,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.isMyMessage ? styles.myMessage : styles.otherMessage,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.isMyMessage ? styles.myMessageText : styles.otherMessageText,
                  ]}
                >
                  {message.text}
                </Text>
              </View>
              
              <View style={[
                styles.messageInfo,
                message.isMyMessage ? styles.myMessageInfo : styles.otherMessageInfo,
              ]}>
                <Text style={styles.messageTime}>
                  {formatTime(message.timestamp)}
                </Text>
                {message.isMyMessage && (
                  <Text style={styles.messageStatus}>
                    {getStatusIcon(message.status)}
                  </Text>
                )}
              </View>
            </View>
          ))}
          
          {/* 상대방 타이핑 표시 */}
          {isTyping && (
            <View style={styles.typingIndicator}>
              <View style={styles.typingBubble}>
                <Text style={styles.typingText}>•••</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* 이모지 선택창 */}
        {showEmojiPicker && (
          <View style={styles.emojiPickerContainer}>
            <Text style={styles.emojiPickerTitle}>이모지 선택</Text>
            <View style={styles.emojiGrid}>
              {['😊', '😂', '😍', '🥺', '😭', '😘', '🤔', '😎', '🙄', '😴', '🤗', '😜', '🤩', '😇', '🥰', '😋', '🤯', '😱', '🤭', '🙈', '💕', '❤️', '💖', '💯', '🔥', '✨', '🎉', '👍', '👏', '🙏'].map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.emojiButton}
                  onPress={() => {
                    setInputText(prev => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.emojiCloseButton}
              onPress={() => setShowEmojiPicker(false)}
            >
              <Text style={styles.emojiCloseButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 입력 영역 */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity
              style={styles.emojiPickerButton}
              onPress={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Text style={styles.emojiPickerButtonText}>😊</Text>
            </TouchableOpacity>
            
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="메시지를 입력하세요..."
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (inputText.trim() && isConnected) ? styles.sendButtonActive : styles.sendButtonInactive,
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || !isConnected}
            >
              <Text style={styles.sendButtonText}>
                {isConnected ? '전송' : '연결중'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    paddingVertical: 12,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '300',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  onlineStatus: {
    fontSize: 12,
    color: '#10b981',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuButtonText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '600',
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
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 40, // 입력창과의 간격 더 증가
  },
  messageWrapper: {
    marginVertical: 4,
    marginBottom: 8, // 각 메시지 하단 여백 추가
  },
  myMessageWrapper: {
    alignItems: 'flex-end',
  },
  otherMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  myMessage: {
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: '#374151',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#e5e7eb',
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12, // 시간 표시 하단 여백 추가
    paddingHorizontal: 4,
  },
  myMessageInfo: {
    justifyContent: 'flex-end',
  },
  otherMessageInfo: {
    justifyContent: 'flex-start',
  },
  messageTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  messageStatus: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  typingIndicator: {
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  typingBubble: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  typingText: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '600',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20, // 위아래 패딩 더 증가
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    marginTop: 16, // 상단 여백 더 증가
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#1f2937',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    maxHeight: 100,
    paddingVertical: 8,
    marginLeft: 8,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: '#3b82f6',
  },
  sendButtonInactive: {
    backgroundColor: '#6b7280',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emojiPickerContainer: {
    backgroundColor: '#1f2937',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 16,
    maxHeight: 300,
  },
  emojiPickerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  emojiButton: {
    width: '16.66%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#374151',
    borderRadius: 8,
    marginHorizontal: 1,
  },
  emojiText: {
    fontSize: 24,
  },
  emojiCloseButton: {
    backgroundColor: '#6b7280',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  emojiCloseButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emojiPickerButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  emojiPickerButtonText: {
    fontSize: 20,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  menuOverlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  menuDropdown: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 100 : 75,
    right: 16,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  menuItemText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ChatRoomScreen;