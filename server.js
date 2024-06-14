const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

const app = express();

// 미들웨어 설정
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// 루트 경로 처리
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 로그인 페이지 제공
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 로그인 처리
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // 관리자 계정 (실제로는 안전한 방법으로 저장하고 검증해야 함)
    if (username === 'admin' && password === 'password') {
        req.session.user = 'admin';
        res.redirect('/admin');
    } else {
        res.send('로그인 실패');
    }
});

// 관리자 전용 페이지 제공
app.get('/admin', (req, res) => {
    if (req.session.user === 'admin') {
        res.sendFile(path.join(__dirname, 'public', 'admin.html'));
    } else {
        res.redirect('/login');
    }
});

// 데이터 제출 처리
app.post('/submit', (req, res) => {
    const data = req.body;
    const timestamp = new Date().toISOString();
    const textData = `
        날짜: ${timestamp}
        성명: ${data.name}
        연락처: ${data.contact}
        이메일: ${data.email}
        주소: ${data.address}
        검진희망일: ${data.preferred_date}
        복용약: ${data.medications}
        대장 내시경 시 용종 제거 동의: ${data.polyp_removal}
        대장 내시경 후 2주 이내 비행 예정 여부: ${data.flight_within_2weeks}
        MRI 검사 시 문제가 될 수 있는 폐쇄공포증 및 금속 인공물, 인공 판막 등 장착 여부: ${data.mri_issues}
        A그룹 선택: ${data.a_group_selections ? data.a_group_selections.join(', ') : ''}
        B그룹 선택: ${data.b_group_selections ? data.b_group_selections.join(', ') : ''}
        C그룹 선택: ${data.c_group_selections ? data.c_group_selections.join(', ') : ''}
    `;

    fs.appendFile('submissions.txt', textData, (err) => {
        if (err) throw err;
        res.send('데이터가 저장되었습니다.');
    });
});

// 저장된 데이터 표시
app.get('/data', (req, res) => {
    if (req.session.user === 'admin') {
        fs.readFile('submissions.txt', 'utf8', (err, data) => {
            if (err) throw err;
            const date = req.query.date;
            const filteredData = data.split('\n\n').filter(entry => entry.includes(`날짜: ${date}`)).join('\n\n');
            res.send(`<pre>${filteredData}</pre>`);
        });
    } else {
        res.redirect('/login');
    }
});

module.exports = app;
