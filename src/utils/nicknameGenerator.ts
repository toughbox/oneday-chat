// 닉네임 자동 생성 유틸리티

const adjectives = [
  '밤하늘', '새벽', '황혼', '달빛', '별빛', '구름', '바람', '파도', '산들', '꽃잎',
  '이슬', '안개', '무지개', '햇살', '그림자', '여울', '메아리', '비밀', '꿈속', '환상',
  '고요한', '신비한', '따뜻한', '차가운', '부드러운', '깊은', '높은', '작은', '큰', '빠른'
];

const nouns = [
  '여행자', '방랑자', '탐험가', '몽상가', '관찰자', '수집가', '창작자', '학자', '예술가', '철학자',
  '나그네', '사색가', '음유시인', '이야기꾼', '수호자', '전령', '안내자', '기록자', '보물', '비밀',
  '전설', '신화', '동화', '시', '노래', '춤', '그림', '조각', '건축', '정원'
];

/**
 * 랜덤한 닉네임을 생성합니다
 * 형식: [형용사][명사][3자리 숫자]
 * 예: "밤하늘여행자123", "신비한몽상가456"
 */
export const generateRandomNickname = (): string => {
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 900) + 100; // 100-999 사이의 숫자
  
  return `${randomAdjective}${randomNoun}${randomNumber}`;
};

/**
 * 닉네임이 유효한지 검증합니다
 */
export const validateNickname = (nickname: string): { isValid: boolean; message?: string } => {
  if (!nickname.trim()) {
    return { isValid: false, message: '닉네임을 입력해주세요.' };
  }
  
  if (nickname.length < 2) {
    return { isValid: false, message: '닉네임은 최소 2글자 이상이어야 합니다.' };
  }
  
  if (nickname.length > 20) {
    return { isValid: false, message: '닉네임은 최대 20글자까지 가능합니다.' };
  }
  
  // 특수문자 제한 (한글, 영문, 숫자만 허용)
  const regex = /^[가-힣a-zA-Z0-9]+$/;
  if (!regex.test(nickname)) {
    return { isValid: false, message: '한글, 영문, 숫자만 사용 가능합니다.' };
  }
  
  return { isValid: true };
};
