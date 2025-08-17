/*const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const httpServer = createServer(app);

// CORS 설정
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"]
}));

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 서버 상태 관리
const serverState = {
  connectedUsers: new Map(), // socketId -> userInfo
  waitingUsers: new Map(),   // userId -> userInfo
  activeRooms: new Map(),    // roomId -> { users: [], createdAt: Date }
};

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: 'OneDay Chat Socket.io 서버',
    status: 'running',
    connectedUsers: serverState.connectedUsers.size,
    waitingUsers: serverState.waitingUsers.size,
    activeRooms: serverState.activeRooms.size,
    timestamp: new Date().toISOString()
  });
});

// 서버 상태 조회
app.get('/status', (req, res) => {
  res.json({
    connectedUsers: Array.from(serverState.connectedUsers.values()),
    waitingUsers: Array.from(serverState.waitingUsers.values()),
    activeRooms: Array.from(serverState.activeRooms.entries()).map(([roomId, room]) => ({
      roomId,
      userCount: room.users.length,
      createdAt: room.createdAt
    }))
  });
});

// Socket.io 연결 처리
io.on('connection', (socket) => {
  console.log(`🔌 새 클라이언트 연결: ${socket.id}`);

  // 사용자 등록
  socket.on('register_user', (userInfo) => {
    console.log(`👤 사용자 등록: ${userInfo.nickname} (${socket.id})`);
    serverState.connectedUsers.set(socket.id, {
      ...userInfo,
      socketId: socket.id,
      connectedAt: new Date()
    });
  });

  // 매칭 요청
  socket.on('request_match', (userInfo) => {
    console.log(`🔍 매칭 요청: ${userInfo.nickname} (${userInfo.mood})`);
    
    // 현재 사용자를 대기열에 추가
    const waitingUser = {
      ...userInfo,
      socketId: socket.id,
      requestedAt: new Date()
    };
    serverState.waitingUsers.set(userInfo.userId, waitingUser);

    // 매칭 시도
    tryMatch(socket, waitingUser);
  });

  // 매칭 취소
  socket.on('cancel_match', () => {
    console.log(`❌ 매칭 취소: ${socket.id}`);
    const user = serverState.connectedUsers.get(socket.id);
    if (user) {
      serverState.waitingUsers.delete(user.userId);
    }
  });

  // 채팅방 입장
  socket.on('join_room', (roomId) => {
    console.log(`🏠 채팅방 입장: ${socket.id} -> ${roomId}`);
    socket.join(roomId);
    
    // 방 정보 업데이트
    if (!serverState.activeRooms.has(roomId)) {
      serverState.activeRooms.set(roomId, {
        users: [],
        createdAt: new Date()
      });
    }
    
    const room = serverState.activeRooms.get(roomId);
    const user = serverState.connectedUsers.get(socket.id);
    if (user && !room.users.find(u => u.socketId === socket.id)) {
      room.users.push(user);
    }

    // 다른 사용자에게 입장 알림
    socket.to(roomId).emit('user_joined', {
      userId: user?.userId,
      nickname: user?.nickname
    });
  });

  // 채팅방 나가기
  socket.on('leave_room', (roomId) => {
    console.log(`🚪 채팅방 나가기: ${socket.id} -> ${roomId}`);
    socket.leave(roomId);
    
    // 방 정보 업데이트
    const room = serverState.activeRooms.get(roomId);
    if (room) {
      room.users = room.users.filter(u => u.socketId !== socket.id);
      if (room.users.length === 0) {
        serverState.activeRooms.delete(roomId);
        console.log(`🗑️ 빈 채팅방 삭제: ${roomId}`);
      }
    }

    // 다른 사용자에게 나감 알림
    const user = serverState.connectedUsers.get(socket.id);
    socket.to(roomId).emit('user_left', {
      userId: user?.userId,
      nickname: user?.nickname
    });
  });

  // 메시지 전송
  socket.on('send_message', (data) => {
    const { roomId, message, timestamp } = data;
    const user = serverState.connectedUsers.get(socket.id);
    
    console.log(`💬 메시지 전송: ${user?.nickname} -> ${roomId}: ${message}`);
    
    // 같은 방의 다른 사용자들에게 메시지 전달
    socket.to(roomId).emit('receive_message', {
      messageId: uuidv4(),
      userId: user?.userId,
      nickname: user?.nickname,
      message,
      timestamp,
      type: 'received'
    });
  });

  // 타이핑 상태 전송
  socket.on('typing', (data) => {
    const { roomId, isTyping } = data;
    const user = serverState.connectedUsers.get(socket.id);
    
    socket.to(roomId).emit('user_typing', {
      userId: user?.userId,
      nickname: user?.nickname,
      isTyping
    });
  });

  // 연결 해제
  socket.on('disconnect', () => {
    console.log(`🔌 클라이언트 연결 해제: ${socket.id}`);
    
    const user = serverState.connectedUsers.get(socket.id);
    if (user) {
      // 대기열에서 제거
      serverState.waitingUsers.delete(user.userId);
      
      // 활성 방에서 제거
      serverState.activeRooms.forEach((room, roomId) => {
        room.users = room.users.filter(u => u.socketId !== socket.id);
        if (room.users.length === 0) {
          serverState.activeRooms.delete(roomId);
        }
      });
      
      // 연결된 사용자 목록에서 제거
      serverState.connectedUsers.delete(socket.id);
    }
  });
});

// 매칭 로직
function tryMatch(socket, currentUser) {
  const waitingUsers = Array.from(serverState.waitingUsers.values())
    .filter(user => user.userId !== currentUser.userId);

  if (waitingUsers.length === 0) {
    console.log(`⏳ 매칭 대기 중: ${currentUser.nickname}`);
    return;
  }

  // 감정 기반 매칭 (같은 감정끼리 우선)
  let matchedUser = waitingUsers.find(user => user.mood === currentUser.mood);
  
  // 같은 감정이 없으면 랜덤 매칭
  if (!matchedUser) {
    matchedUser = waitingUsers[0];
  }

  // 매칭 성공
  const roomId = `room_${uuidv4()}`;
  console.log(`💫 매칭 성공: ${currentUser.nickname} ↔ ${matchedUser.nickname} (${roomId})`);

  // 대기열에서 제거
  serverState.waitingUsers.delete(currentUser.userId);
  serverState.waitingUsers.delete(matchedUser.userId);

  // 매칭 결과 전송
  const matchData = {
    roomId,
    partnerNickname: matchedUser.nickname,
    partnerMood: matchedUser.mood,
    matchedAt: new Date().toISOString()
  };

  socket.emit('match_found', {
    ...matchData,
    partnerNickname: matchedUser.nickname
  });

  // 상대방에게도 매칭 결과 전송
  const partnerSocket = io.sockets.sockets.get(matchedUser.socketId);
  if (partnerSocket) {
    partnerSocket.emit('match_found', {
      ...matchData,
      partnerNickname: currentUser.nickname
    });
  }
}

// 자정 리셋 스케줄러 (매일 자정에 모든 데이터 초기화)
function scheduleReset() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const timeUntilMidnight = tomorrow.getTime() - now.getTime();
  
  setTimeout(() => {
    console.log('🌙 자정 리셋: 모든 데이터 초기화');
    
    // 모든 클라이언트에게 리셋 알림
    io.emit('midnight_reset', {
      message: '새로운 하루가 시작되었습니다!',
      timestamp: new Date().toISOString()
    });
    
    // 서버 상태 초기화
    serverState.waitingUsers.clear();
    serverState.activeRooms.clear();
    
    // 다음 자정으로 다시 스케줄링
    scheduleReset();
  }, timeUntilMidnight);
  
  console.log(`🌙 다음 자정 리셋까지: ${Math.floor(timeUntilMidnight / 1000 / 60 / 60)}시간 ${Math.floor((timeUntilMidnight / 1000 / 60) % 60)}분`);
}

// 서버 시작
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 OneDay Chat Socket.io 서버 시작`);
  console.log(`📡 포트: ${PORT}`);
  console.log(`🌐 모든 IP에서 접근 가능 (0.0.0.0:${PORT})`);
  console.log(`🔗 상태 확인: http://localhost:${PORT}/status`);
  
  // 자정 리셋 스케줄링 시작
  scheduleReset();
});

// 프로세스 종료 시 정리
process.on('SIGINT', () => {
  console.log('\n🛑 서버 종료 중...');
  httpServer.close(() => {
    console.log('✅ 서버가 안전하게 종료되었습니다');
    process.exit(0);
  });
});
*/