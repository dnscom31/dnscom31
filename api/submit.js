const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const session = require('express-session');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

app.post('/api/submit', (req, res) => {
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

module.exports = app;
