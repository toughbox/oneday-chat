// OneDay Chat 홈서버 설정

export const serverConfig = {
  // 홈서버 DDNS 주소
  socketUrl: 'http://toughbox.iptime.org:3000',
  
  // 대체 주소들 (fallback)
  fallbackUrls: [
    'http://toughbox.iptime.org:3000',
    'http://192.168.1.100:3000', // 내부 네트워크 IP (필요시)
  ],
  
  // 연결 설정
  connection: {
    timeout: 10000, // 10초 타임아웃
    reconnectAttempts: 3,
    reconnectInterval: 5000, // 5초 간격
  },
  
  // 개발/운영 환경 구분
  isDevelopment: __DEV__,
};

// 서버 상태 확인을 위한 헬퍼 함수
export const getServerStatus = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(`${url}/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.log(`서버 상태 확인 실패: ${url}`, error);
    return false;
  }
};

// 최적의 서버 URL 자동 선택
export const getBestServerUrl = async (): Promise<string> => {
  console.log('🔍 최적의 홈서버 찾는 중...');
  
  // 메인 서버 먼저 시도
  const isMainServerOnline = await getServerStatus(serverConfig.socketUrl);
  if (isMainServerOnline) {
    console.log('✅ 메인 홈서버 연결 가능:', serverConfig.socketUrl);
    return serverConfig.socketUrl;
  }
  
  // 대체 서버들 시도
  for (const fallbackUrl of serverConfig.fallbackUrls) {
    if (fallbackUrl === serverConfig.socketUrl) continue; // 이미 시도함
    
    const isOnline = await getServerStatus(fallbackUrl);
    if (isOnline) {
      console.log('✅ 대체 홈서버 연결 가능:', fallbackUrl);
      return fallbackUrl;
    }
  }
  
  // 모든 서버가 응답 없으면 메인 서버 반환 (시도라도 해보기)
  console.log('⚠️ 모든 홈서버 응답 없음, 메인 서버로 시도:', serverConfig.socketUrl);
  return serverConfig.socketUrl;
};

export default serverConfig;
