// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const submitHandler = require('./api/submit');
const dataHandler = require('./api/data');  // data.js 모듈 임포트
const deleteHandler = require('./api/delete');
const confirmHandler = require('./api/confirm');

const app = express();
const PORT = process.env.PORT || 8080;

// 미들웨어 설정
app.use(express.json());
app.use(cors());

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));

// API 라우트 설정
app.post('/api/submit', submitHandler);

// 데이터 조회 라우트: 관리자 페이지에서 호출하는 /api/data 엔드포인트
app.get('/api/data', dataHandler);

// 테스트용 제출 데이터 조회 라우트 (필요 시 유지)
app.get('/api/submissions', (req, res) => {
  try {
    const data = require('./submissions/submissions.json');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: '데이터를 불러오는 데 실패했습니다.' });
  }
});

// 삭제 엔드포인트: delete.js 모듈 사용 (DELETE 메소드)
app.delete('/api/delete', deleteHandler);

// 확인 완료 엔드포인트: confirm.js 모듈 사용 (POST 메소드)
app.post('/api/confirm', confirmHandler);

// 404 핸들링
app.use((req, res) => {
  res.status(404).send('페이지를 찾을 수 없습니다');
});

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('서버 오류 발생!');
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다`);
});
