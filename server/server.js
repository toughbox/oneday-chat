const express = require('express');
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
  userRooms: new Map(),      // userId -> Set<roomId> (사용자가 참여 중인 방 목록)
  roomMessages: new Map(),   // roomId -> Message[] (방별 메시지 저장)
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
    })),
    userRooms: Object.fromEntries(
      Array.from(serverState.userRooms.entries()).map(([userId, roomSet]) => [
        userId, Array.from(roomSet)
      ])
    )
  });
});

// 활성 대화방에서 함께 있는 사용자들을 가져오는 함수
function getActivePartners(userId) {
  const partners = new Set();
  const userRooms = serverState.userRooms.get(userId) || new Set();
  
  for (const roomId of userRooms) {
    const room = serverState.activeRooms.get(roomId);
    if (room) {
      room.users.forEach(user => {
        if (user.userId !== userId) {
          partners.add(user.userId);
        }
      });
    }
  }
  
  return partners;
}

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
    
    // 중복 검증: 이미 대기열에 있는 사용자인지 확인
    if (serverState.waitingUsers.has(userInfo.userId)) {
      console.log(`⚠️ 중복 매칭 요청 감지: ${userInfo.nickname} (${userInfo.userId})`);
      socket.emit('match_error', { 
        message: '이미 매칭 대기 중입니다.',
        code: 'DUPLICATE_REQUEST'
      });
      return;
    }
    
    // 중복 검증: 이미 활성 대화방에 있는 사용자인지 확인
    if (serverState.userRooms.has(userInfo.userId) && serverState.userRooms.get(userInfo.userId).size > 0) {
      console.log(`⚠️ 활성 대화방 사용자 매칭 요청 감지: ${userInfo.nickname} (${userInfo.userId})`);
      socket.emit('match_error', { 
        message: '이미 대화방에 참여 중입니다.',
        code: 'ALREADY_IN_ROOM'
      });
      return;
    }
    
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
  socket.on('join_room', (data) => {
    const roomId = data.roomId; // 객체에서 roomId 추출
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
      
      // 사용자의 활성 방 목록 업데이트
      if (!serverState.userRooms.has(user.userId)) {
        serverState.userRooms.set(user.userId, new Set());
      }
      serverState.userRooms.get(user.userId).add(roomId);
      console.log(`📝 ${user.nickname}의 활성 방 목록 업데이트:`, Array.from(serverState.userRooms.get(user.userId)));
    }

    // 이전 메시지 전송 (재입장 시)
    const previousMessages = serverState.roomMessages.get(roomId) || [];
    if (previousMessages.length > 0) {
      console.log(`📚 ${roomId}의 이전 메시지 ${previousMessages.length}개 전송`);
      socket.emit('previous_messages', {
        roomId,
        messages: previousMessages
      });
    }
    
    // 다른 사용자에게 입장 알림
    socket.to(roomId).emit('user_joined', {
      userId: user?.userId,
      nickname: user?.nickname
    });
  });

  // 채팅방 나가기
  socket.on('leave_room', (data) => {
    const roomId = data.roomId; // 객체에서 roomId 추출
    console.log(`🚪 채팅방 나가기: ${socket.id} -> ${roomId}`);
    socket.leave(roomId);
    
    const user = serverState.connectedUsers.get(socket.id);
    
    // 방 정보 업데이트 (방은 유지, 사용자만 제거)
    const room = serverState.activeRooms.get(roomId);
    if (room) {
      room.users = room.users.filter(u => u.socketId !== socket.id);
      // 방이 비어있어도 삭제하지 않음 (12시까지 유지)
      console.log(`📝 ${roomId}에서 사용자 제거, 현재 사용자 수: ${room.users.length}`);
    }
    
    // 사용자의 활성 방 목록에서 제거
    if (user && serverState.userRooms.has(user.userId)) {
      serverState.userRooms.get(user.userId).delete(roomId);
      if (serverState.userRooms.get(user.userId).size === 0) {
        serverState.userRooms.delete(user.userId);
      }
      console.log(`📝 ${user.nickname}이 ${roomId}에서 나감, 현재 활성 방:`, 
        serverState.userRooms.has(user.userId) ? Array.from(serverState.userRooms.get(user.userId)) : []);
    }

    // 다른 사용자에게 나감 알림
    socket.to(roomId).emit('user_left', {
      userId: user?.userId,
      nickname: user?.nickname
    });

    // 방 나가기 완료 확인을 클라이언트에 전송
    socket.emit('leave_room_complete', {
      roomId: roomId,
      success: true
    });
    
    console.log(`✅ ${roomId}에서 ${user?.nickname} 방 나가기 완료`);
  });

  // 메시지 전송
  socket.on('send_message', (data) => {
    const { roomId, message, timestamp } = data;
    const user = serverState.connectedUsers.get(socket.id);
    
    console.log(`💬 메시지 전송: ${user?.nickname} -> ${roomId}: ${message}`);
    
    // 메시지 저장
    if (!serverState.roomMessages.has(roomId)) {
      serverState.roomMessages.set(roomId, []);
    }
    
    const messageData = {
      messageId: uuidv4(),
      roomId: roomId,  // roomId 추가!
      userId: user?.userId,
      nickname: user?.nickname,
      message,
      timestamp,
      type: 'received'
    };
    
    serverState.roomMessages.get(roomId).push(messageData);
    console.log(`💾 메시지 저장: ${roomId}에 메시지 ${serverState.roomMessages.get(roomId).length}개`);
    
    // 같은 방의 다른 사용자들에게 메시지 전달
    socket.to(roomId).emit('receive_message', messageData);
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
      
      // 활성 방에서 제거 (방은 유지, 사용자만 제거)
      serverState.activeRooms.forEach((room, roomId) => {
        room.users = room.users.filter(u => u.socketId !== socket.id);
        // 방이 비어있어도 삭제하지 않음 (12시까지 유지)
        console.log(`📝 ${roomId}에서 연결 해제된 사용자 제거, 현재 사용자 수: ${room.users.length}`);
      });
      
      // 사용자의 활성 방 목록 삭제
      serverState.userRooms.delete(user.userId);
      console.log(`🧹 ${user.nickname}의 모든 활성 방 목록 삭제`);
      
      // 연결된 사용자 목록에서 제거
      serverState.connectedUsers.delete(socket.id);
    }
  });
});

// 개선된 매칭 로직 - 이미 대화 중인 사용자 간 재매칭 방지
function tryMatch(socket, currentUser) {
  // 현재 사용자와 이미 대화 중인 파트너들 가져오기
  const currentUserPartners = getActivePartners(currentUser.userId);
  console.log(`🔍 ${currentUser.nickname}의 현재 대화 파트너들:`, Array.from(currentUserPartners));
  
  const waitingUsers = Array.from(serverState.waitingUsers.values())
    .filter(user => {
      // 자신 제외
      if (user.userId === currentUser.userId) return false;
      
      // 이미 대화 중인 파트너 제외
      if (currentUserPartners.has(user.userId)) {
        console.log(`⏭️ ${user.nickname}는 이미 ${currentUser.nickname}과 대화 중이므로 제외`);
        return false;
      }
      
      return true;
    });

  if (waitingUsers.length === 0) {
    console.log(`⏳ 매칭 대기 중: ${currentUser.nickname} (사용 가능한 파트너 없음)`);
    return;
  }

  console.log(`👥 매칭 가능한 사용자들: ${waitingUsers.map(u => u.nickname).join(', ')}`);

  // 감정 기반 매칭 (같은 감정끼리 우선)
  let matchedUser = waitingUsers.find(user => user.mood === currentUser.mood);
  
  // 같은 감정이 없으면 랜덤 매칭
  if (!matchedUser) {
    matchedUser = waitingUsers[0];
  }

  // 매칭 성공
  const roomId = `room_${uuidv4()}`;
  console.log(`💫 매칭 성공: ${currentUser.nickname} ↔ ${matchedUser.nickname} (${roomId})`);
  console.log(`📊 서버 상태 - 대기: ${serverState.waitingUsers.size - 2}명, 활성방: ${serverState.activeRooms.size + 1}개`);

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
    serverState.userRooms.clear();
    serverState.roomMessages.clear(); // 메시지도 초기화
    
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