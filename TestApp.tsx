/**
 * Simple Test App without problematic libraries
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

function TestApp() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>🌙</Text>
        <Text style={styles.title}>OneDay Chat</Text>
        <Text style={styles.subtitle}>자정에 사라지는 익명 채팅</Text>
        
        <View style={styles.descriptionSection}>
          <Text style={styles.description}>
            매일 자정, 모든 대화가 사라집니다.{'\n'}
            진실한 대화를 시작해보세요.
          </Text>
          
          <View style={styles.featureList}>
            <Text style={styles.feature}>✨ 완전 익명 채팅</Text>
            <Text style={styles.feature}>⏰ 24시간 후 자동 삭제</Text>
            <Text style={styles.feature}>🚫 회원가입 불필요</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.enterButton}>
          <Text style={styles.enterButtonText}>익명으로 시작하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  logo: {
    fontSize: 72,
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 40,
  },
  descriptionSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  description: {
    fontSize: 18,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
  },
  featureList: {
    alignItems: 'flex-start',
  },
  feature: {
    fontSize: 16,
    color: '#e5e7eb',
    marginBottom: 12,
    paddingLeft: 8,
  },
  enterButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  enterButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default TestApp;

