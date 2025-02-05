//submit.js

const fs = require('fs');
const path = require('path');

// 파일 저장 경로 설정
const submissionsDir = path.join(__dirname, '..', 'submissions');
const filePath = path.join(submissionsDir, 'submissions.json');

// submissions 디렉토리 생성 확인
if (!fs.existsSync(submissionsDir)) {
  fs.mkdirSync(submissionsDir, { recursive: true });
}

module.exports = (req, res) => {
  try {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS 메소드 처리
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: '지원되지 않는 메소드' });
    }

    const data = req.body;

    // 필수 입력값 검증
    if (
      !data.name?.trim() ||
      !data.contact?.trim() ||
      !data.email?.trim() ||
      !data.address?.trim()
    ) {
      return res.status(400).json({ error: '필수 입력값이 누락되었습니다.' });
    }

    // 새 항목 생성
    const newEntry = {
      timestamp: new Date().toISOString(),
      name: data.name.trim(),
      contact: data.contact.trim(),
      email: data.email.trim(),
      address: data.address.trim(),
      preferred_date: data.preferred_date
        ? new Date(data.preferred_date).toLocaleString()
        : '미입력',
      medications: data.medications?.trim() || '없음',
      polyp_removal: data.polyp_removal || '미입력',
      flight_within_2weeks: data.flight_within_2weeks || '미입력',
      mri_issues: data.mri_issues?.trim() || '미입력',
      checkup_type: data.checkup_type || '미선택',
      a_group_selections: data.a_group_selections || [],
      b_group_selections: data.b_group_selections || [],
      c_group_selections: data.c_group_selections || []
    };

    // 기존 데이터 불러오기
    let existingData = [];
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        existingData = fileContent ? JSON.parse(fileContent) : [];
      } catch (readError) {
        console.error('파일 읽기 오류:', readError);
        return res.status(500).json({ error: '데이터 저장 실패' });
      }
    }

    // 새 데이터 추가
    existingData.push(newEntry);

    // 파일 저장
    try {
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf8');
      console.log('새 항목 저장 성공:', newEntry);
      res.status(200).json({ message: '데이터가 성공적으로 저장되었습니다.' });
    } catch (writeError) {
      console.error('파일 저장 오류:', writeError);
      res.status(500).json({ error: '데이터 저장 중 오류 발생' });
    }

  } catch (error) {
    console.error('서버 에러:', error);
    res.status(500).json({ error: '서버 처리 중 오류 발생' });
  }
};