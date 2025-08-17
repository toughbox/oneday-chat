# 🏠 OneDay Chat 홈서버 구축 가이드

> **목표**: 라즈베리파이나 홈 PC에 Node.js + Socket.io 매칭/채팅 서버 구축

## 📋 **1. 준비물**

### 하드웨어
- **라즈베리파이 4B** (4GB 이상 권장) 또는 **홈 PC/노트북**
- **SD카드** 32GB 이상 (라즈베리파이용)
- **이더넷 케이블** 또는 WiFi 연결

### 네트워크 설정
- **고정 IP 할당** (공유기 설정)
- **포트포워딩** 설정 (3000번 포트)
- **DDNS 서비스** (선택사항 - 외부 접속용)

## 🛠️ **2. 서버 환경 구축**

### 라즈베리파이 OS 설치
```bash
# 1. 라즈비안 OS 이미지 다운로드 및 설치
# 2. SSH 활성화
# 3. 네트워크 연결 설정
```

### Node.js 설치
```bash
# Node.js 최신 LTS 버전 설치
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# 버전 확인
node --version
npm --version
```

### Git 설치
```bash
sudo apt update
sudo apt install git -y
```

## 🚀 **3. 서버 코드 배포**

### 프로젝트 생성
```bash
# 홈 디렉토리에 서버 폴더 생성
mkdir ~/oneday-chat-server
cd ~/oneday-chat-server

# package.json 생성
npm init -y
```

### 필요한 패키지 설치
```bash
npm install socket.io express cors helmet
npm install -D nodemon
```

### 서버 코드 작성
```javascript
// server.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const httpServer = createServer(app);

// 보안 및 CORS 설정
app.use(helmet());
app.use(cors({
  origin: "*", // 개발용 - 운영시 앱 도메인으로 제한
  credentials: true
}));

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 매칭 대기열 및 채팅방 관리
const waitingQueue = new Map();
const activeRooms = new Map();
const userSockets = new Map();

// 매칭 로직
function findMatch(currentUser) {
  for (let [userId, userInfo] of waitingQueue) {
    if (userId !== currentUser.userId) {
      // 매칭 성공
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 대기열에서 제거
      waitingQueue.delete(userId);
      waitingQueue.delete(currentUser.userId);
      
      // 매칭 결과 전송
      const currentSocket = userSockets.get(currentUser.userId);
      const partnerSocket = userSockets.get(userId);
      
      if (currentSocket && partnerSocket) {
        const matchData = {
          roomId,
          partnerId: userId,
          partnerNickname: userInfo.nickname,
          timestamp: Date.now()
        };
        
        const partnerMatchData = {
          roomId,
          partnerId: currentUser.userId,
          partnerNickname: currentUser.nickname,
          timestamp: Date.now()
        };
        
        currentSocket.emit('match_found', matchData);
        partnerSocket.emit('match_found', partnerMatchData);
        
        // 활성 채팅방에 추가
        activeRooms.set(roomId, {
          users: [currentUser.userId, userId],
          createdAt: Date.now()
        });
        
        console.log(`💫 매칭 성공: ${currentUser.nickname} <-> ${userInfo.nickname}`);
        return true;
      }
    }
  }
  return false;
}

// Socket.io 연결 처리
io.on('connection', (socket) => {
  console.log('🔌 사용자 연결:', socket.id);
  
  // 매칭 요청
  socket.on('request_match', (userInfo) => {
    console.log('🔍 매칭 요청:', userInfo);
    
    userSockets.set(userInfo.userId, socket);
    socket.userId = userInfo.userId;
    
    // 즉시 매칭 시도
    if (!findMatch(userInfo)) {
      // 매칭 실패시 대기열에 추가
      waitingQueue.set(userInfo.userId, userInfo);
      console.log(`⏳ 대기열 추가: ${userInfo.nickname} (대기: ${waitingQueue.size}명)`);
    }
  });
  
  // 매칭 취소
  socket.on('cancel_match', () => {
    if (socket.userId && waitingQueue.has(socket.userId)) {
      waitingQueue.delete(socket.userId);
      console.log(`❌ 매칭 취소: ${socket.userId}`);
    }
  });
  
  // 채팅방 입장
  socket.on('join_room', ({ roomId }) => {
    socket.join(roomId);
    socket.to(roomId).emit('user_joined', { userId: socket.userId });
    console.log(`🏠 채팅방 입장: ${socket.userId} -> ${roomId}`);
  });
  
  // 채팅방 퇴장
  socket.on('leave_room', ({ roomId }) => {
    socket.leave(roomId);
    socket.to(roomId).emit('user_left', { userId: socket.userId });
    console.log(`🚪 채팅방 퇴장: ${socket.userId} -> ${roomId}`);
  });
  
  // 메시지 전송
  socket.on('send_message', (data) => {
    socket.to(data.roomId).emit('receive_message', {
      ...data,
      userId: socket.userId
    });
    console.log(`💬 메시지 전송: ${data.roomId} - ${data.message}`);
  });
  
  // 타이핑 상태
  socket.on('typing', ({ roomId, isTyping }) => {
    socket.to(roomId).emit('user_typing', {
      roomId,
      userId: socket.userId,
      isTyping
    });
  });
  
  // 연결 해제
  socket.on('disconnect', () => {
    console.log('🔌 사용자 연결 해제:', socket.id);
    
    if (socket.userId) {
      // 대기열에서 제거
      waitingQueue.delete(socket.userId);
      userSockets.delete(socket.userId);
    }
  });
});

// 서버 시작
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 OneDay Chat 서버 시작됨: http://0.0.0.0:${PORT}`);
  console.log(`📱 앱에서 연결할 주소: http://[홈서버IP]:${PORT}`);
});

// 상태 모니터링 (선택사항)
setInterval(() => {
  console.log(`📊 서버 상태 - 대기: ${waitingQueue.size}명, 활성방: ${activeRooms.size}개`);
}, 30000);
```

### package.json 스크립트 설정
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

## 🌐 **4. 네트워크 설정**

### 공유기 설정
1. **고정 IP 할당**
   - 라즈베리파이 MAC 주소 확인: `ip addr show`
   - 공유기 관리자 페이지에서 해당 MAC에 고정 IP 할당 (예: 192.168.1.100)

2. **포트포워딩 설정**
   - 외부 포트: 3000
   - 내부 IP: 192.168.1.100
   - 내부 포트: 3000
   - 프로토콜: TCP

### DDNS 설정 (선택사항)
```bash
# No-IP 또는 DuckDNS 등 무료 DDNS 서비스 사용
# 예: myserver.ddns.net -> 집 공인IP:3000
```

## 🔧 **5. 서버 실행 및 관리**

### 개발 모드 실행
```bash
cd ~/oneday-chat-server
npm run dev
```

### 운영 모드 실행 (PM2 사용)
```bash
# PM2 설치
npm install -g pm2

# 서버 시작
pm2 start server.js --name "oneday-chat"

# 서버 상태 확인
pm2 status

# 로그 확인
pm2 logs oneday-chat

# 서버 재시작
pm2 restart oneday-chat

# 시스템 재부팅시 자동 시작
pm2 startup
pm2 save
```

## 📱 **6. 앱 연결 설정**

### React Native 앱에서 연결
```typescript
// 홈서버 DDNS 주소 설정
socketMatchingService.setServerUrl('http://toughbox.iptime.org:3000');

// 내부 네트워크에서 접속시
socketMatchingService.setServerUrl('http://192.168.1.100:3000');
```

## 🔍 **7. 테스트 및 디버깅**

### 연결 테스트
```bash
# 서버가 실행 중인지 확인
curl http://localhost:3000

# 외부에서 접속 테스트
curl http://[홈서버IP]:3000
```

### 로그 모니터링
```bash
# 실시간 로그 확인
pm2 logs oneday-chat --lines 100
```

## 🛡️ **8. 보안 강화 (선택사항)**

### 방화벽 설정
```bash
# UFW 방화벽 설치 및 설정
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 3000/tcp
```

### SSL 인증서 (Let's Encrypt)
```bash
# Certbot 설치
sudo apt install certbot

# SSL 인증서 발급 (도메인 필요)
sudo certbot certonly --standalone -d myserver.ddns.net
```

## 📊 **9. 모니터링 도구**

### 간단한 상태 페이지
```javascript
// server.js에 추가
app.get('/status', (req, res) => {
  res.json({
    server: 'OneDay Chat Server',
    status: 'running',
    waiting: waitingQueue.size,
    activeRooms: activeRooms.size,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});
```

### 웹 대시보드 (선택사항)
- Socket.io Admin UI 사용
- Grafana + InfluxDB 연동

## 🔄 **10. 업데이트 및 백업**

### 서버 업데이트
```bash
# 코드 업데이트
git pull origin main
npm install

# 서버 재시작
pm2 restart oneday-chat
```

### 로그 백업
```bash
# 로그 로테이션 설정
pm2 install pm2-logrotate
```

---

## 💡 **추가 팁**

1. **개발 단계**: 로컬 PC에서 먼저 테스트
2. **성능 최적화**: Redis 캐시 추가 고려
3. **스케일링**: 여러 서버 인스턴스 + 로드밸런서
4. **모니터링**: Uptime 모니터링 서비스 연동

---

**🏠 홈서버 완성되면 앱에서 IP만 변경하면 바로 연결됩니다!**
