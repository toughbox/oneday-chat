import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface Message {
  id: string;
  text: string;
  isOwn: boolean;
  timestamp: Date;
}

const ChatRoomScreen = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '안녕하세요! 😊',
      isOwn: false,
      timestamp: new Date(Date.now() - 10000),
    },
    {
      id: '2',
      text: '안녕하세요~ 반가워요!',
      isOwn: true,
      timestamp: new Date(Date.now() - 5000),
    },
    {
      id: '3',
      text: '오늘 뭐 하셨어요?',
      isOwn: false,
      timestamp: new Date(),
    },
  ]);

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: message.trim(),
        isOwn: true,
        timestamp: new Date(),
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const timeUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#030712'}}>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />
      
      {/* Header */}
      <View style={{
        backgroundColor: '#111827',
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
        paddingHorizontal: 16,
        paddingVertical: 12
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <View style={{
              width: 40,
              height: 40,
              backgroundColor: '#2563eb',
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12
            }}>
              <Text style={{color: 'white', fontSize: 18, fontWeight: 'bold'}}>🌟</Text>
            </View>
            <View>
              <Text style={{color: 'white', fontSize: 18, fontWeight: '600'}}>별빛456</Text>
              <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 2}}>
                <View style={{
                  width: 8,
                  height: 8,
                  backgroundColor: '#10b981',
                  borderRadius: 4,
                  marginRight: 6
                }} />
                <Text style={{color: '#9ca3af', fontSize: 14}}>온라인</Text>
              </View>
            </View>
          </View>
          
          {/* Countdown Timer */}
          <View style={{
            backgroundColor: '#1f2937',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8
          }}>
            <Text style={{
              color: '#60a5fa',
              fontSize: 14,
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}>
              ⏰ {timeUntilMidnight()}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView 
        style={{flex: 1, paddingHorizontal: 16, paddingVertical: 8}}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={{
              marginBottom: 16,
              alignItems: msg.isOwn ? 'flex-end' : 'flex-start'
            }}
          >
            <View
              style={{
                maxWidth: '80%',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 16,
                backgroundColor: msg.isOwn ? '#2563eb' : '#1f2937',
                borderBottomRightRadius: msg.isOwn ? 4 : 16,
                borderBottomLeftRadius: msg.isOwn ? 16 : 4,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: msg.isOwn ? 'white' : '#f3f4f6'
                }}
              >
                {msg.text}
              </Text>
            </View>
            <Text style={{
              color: '#6b7280',
              fontSize: 12,
              marginTop: 4,
              marginHorizontal: 8
            }}>
              {formatTime(msg.timestamp)}
            </Text>
          </View>
        ))}
        
        {/* Typing Indicator */}
        <View style={{alignItems: 'flex-start', marginBottom: 16}}>
          <View style={{
            backgroundColor: '#1f2937',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 16,
            borderBottomLeftRadius: 4
          }}>
            <View style={{flexDirection: 'row'}}>
              <View style={{
                width: 8,
                height: 8,
                backgroundColor: '#9ca3af',
                borderRadius: 4,
                marginRight: 4
              }} />
              <View style={{
                width: 8,
                height: 8,
                backgroundColor: '#9ca3af',
                borderRadius: 4,
                marginRight: 4
              }} />
              <View style={{
                width: 8,
                height: 8,
                backgroundColor: '#9ca3af',
                borderRadius: 4
              }} />
            </View>
          </View>
          <Text style={{
            color: '#6b7280',
            fontSize: 12,
            marginTop: 4,
            marginHorizontal: 8
          }}>입력 중...</Text>
        </View>
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{
          backgroundColor: '#111827',
          borderTopWidth: 1,
          borderTopColor: '#1f2937'
        }}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingHorizontal: 16,
          paddingVertical: 12
        }}>
          <View style={{flex: 1, marginRight: 12}}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="메시지를 입력하세요..."
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={500}
              style={{
                backgroundColor: '#1f2937',
                color: 'white',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#374151',
                maxHeight: 96,
                textAlignVertical: 'top',
                fontSize: 16
              }}
            />
            <Text style={{
              color: '#6b7280',
              fontSize: 12,
              marginTop: 4,
              textAlign: 'right'
            }}>
              {message.length}/500
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!message.trim()}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: message.trim() ? '#2563eb' : '#374151',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Text style={{fontSize: 20}}>📤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatRoomScreen;