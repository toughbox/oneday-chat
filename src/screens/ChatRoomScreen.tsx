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
  const [messages, setMessages] = useState<Message[]>([
    // 더미 데이터로 채팅 테스트
    {
      id: '1',
      text: '안녕하세요! 반가워요 😊',
      isMyMessage: false,
      timestamp: new Date(Date.now() - 900000), // 15분 전
      status: 'read',
    },
    {
      id: '2', 
      text: '안녕하세요! 익명 채팅 처음이에요',
      isMyMessage: true,
      timestamp: new Date(Date.now() - 840000), // 14분 전
      status: 'read',
    },
    {
      id: '3',
      text: '저도 처음이에요! 신기하네요 ✨',
      isMyMessage: false,
      timestamp: new Date(Date.now() - 780000), // 13분 전
      status: 'read',
    },
    {
      id: '4',
      text: '24시간 후에 대화가 사라진다니 특별한 것 같아요',
      isMyMessage: true,
      timestamp: new Date(Date.now() - 720000), // 12분 전
      status: 'read',
    },
    {
      id: '5',
      text: '맞아요! 그래서 더 솔직하게 대화할 수 있는 것 같아요',
      isMyMessage: false,
      timestamp: new Date(Date.now() - 660000), // 11분 전
      status: 'read',
    },
    {
      id: '6',
      text: '어떤 얘기 해볼까요? 🤔',
      isMyMessage: false,
      timestamp: new Date(Date.now() - 600000), // 10분 전
      status: 'read',
    },
    {
      id: '7',
      text: '음... 오늘 뭐 하셨어요?',
      isMyMessage: true,
      timestamp: new Date(Date.now() - 540000), // 9분 전
      status: 'read',
    },
    {
      id: '8',
      text: '저는 새로운 앱 개발하고 있었어요! 지금 테스트 중이에요 😄',
      isMyMessage: false,
      timestamp: new Date(Date.now() - 480000), // 8분 전
      status: 'read',
    },
    {
      id: '9',
      text: '우와 개발자시네요! 멋있어요 👨‍💻',
      isMyMessage: true,
      timestamp: new Date(Date.now() - 420000), // 7분 전
      status: 'read',
    },
    {
      id: '10',
      text: '감사합니다 ㅎㅎ 이 채팅앱도 제가 만든거예요',
      isMyMessage: false,
      timestamp: new Date(Date.now() - 360000), // 6분 전
      status: 'read',
    },
    {
      id: '11',
      text: '진짜요?! 대박이네요!! 🎉',
      isMyMessage: true,
      timestamp: new Date(Date.now() - 300000), // 5분 전
      status: 'read',
    },
    {
      id: '12',
      text: '아직 개발 중이라 완벽하지 않지만... 어떤가요?',
      isMyMessage: false,
      timestamp: new Date(Date.now() - 240000), // 4분 전
      status: 'read',
    },
    {
      id: '13',
      text: '정말 잘 만드신 것 같아요! UI도 예쁘고 👍',
      isMyMessage: true,
      timestamp: new Date(Date.now() - 180000), // 3분 전
      status: 'read',
    },
    {
      id: '14',
      text: '고마워요! 밤새서 만들었거든요 😅',
      isMyMessage: false,
      timestamp: new Date(Date.now() - 120000), // 2분 전
      status: 'read',
    },
    {
      id: '15',
      text: '고생하셨어요! 정말 대단하세요 ✨',
      isMyMessage: true,
      timestamp: new Date(Date.now() - 60000), // 1분 전
      status: 'read',
    },
  ]);
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [timeLeft, setTimeLeft] = useState('23:45:30'); // 더미 타이머
  const [showMenu, setShowMenu] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

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

  const sendMessage = () => {
    if (inputText.trim() === '') return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isMyMessage: true,
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // 메시지 전송 시뮬레이션
    setTimeout(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
        )
      );
    }, 1000);

    // 상대방 응답 시뮬레이션 (실제 서버 연결 시 제거)
    const replies = [
      "정말요? 흥미롭네요! 😊",
      "그렇군요~ 더 알려주세요!",
      "아하! 그런 의미였군요 🤔", 
      "와 신기해요! 저도 비슷한 경험이 있어요",
      "맞아요! 저도 그렇게 생각해요 ✨",
      "오늘 정말 재미있는 대화네요!",
      "시간이 너무 빨리 가는 것 같아요 ⏰",
      "익명 채팅이라 더 편하게 얘기하게 되네요 😄",
      "그런 일이 있었군요! 재미있어요 🎭",
      "저도 그런 생각 해본 적 있어요",
      "정말 공감해요! 👍",
      "새로운 관점이네요!",
      "좋은 말씀이에요 ✨",
      "어머 그럼 어떻게 하셨어요?",
      "대화가 즐거워요 😊"
    ];
    
    // 타이핑 상태 시뮬레이션
    setTimeout(() => {
      setIsTyping(true);
    }, 2000 + Math.random() * 1000);
    
    setTimeout(() => {
      setIsTyping(false);
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      setMessages(prevMessages => [...prevMessages, {
        id: Date.now().toString() + '_reply',
        text: randomReply,
        isMyMessage: false,
        timestamp: new Date(),
        status: 'read'
      }]);
    }, 3000 + Math.random() * 2000); // 3-5초 랜덤 딜레이

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
            <Text style={styles.onlineStatus}>
              {isTyping ? '입력 중...' : '온라인'}
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

        {/* 입력 영역 */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
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
                inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive,
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim()}
            >
              <Text style={styles.sendButtonText}>전송</Text>
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