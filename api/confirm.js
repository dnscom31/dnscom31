// api/confirm.js
const fs = require('fs');
const path = require('path');

const submissionsFile = path.join(__dirname, '..', 'submissions', 'submissions.json');

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: "지원되지 않는 메소드" });
  }

  const { timestamp } = req.query;
  if (!timestamp) {
    return res.status(400).json({ message: "timestamp가 필요합니다." });
  }

  try {
    if (!fs.existsSync(submissionsFile)) {
      return res.status(404).json({ message: "파일이 존재하지 않습니다." });
    }

    let data = JSON.parse(fs.readFileSync(submissionsFile, 'utf8'));
    let found = false;
    data = data.map(entry => {
      if (entry.timestamp === timestamp) {
        entry.confirmed = true;
        found = true;
      }
      return entry;
    });

    if (!found) {
      return res.status(404).json({ message: "해당 항목을 찾을 수 없습니다." });
    }

    fs.writeFileSync(submissionsFile, JSON.stringify(data, null, 2));
    return res.json({ message: "확인 완료되었습니다." });
  } catch (error) {
    console.error("확인 처리 중 오류 발생:", error);
    return res.status(500).json({ message: "확인 처리 중 오류 발생" });
  }
};
