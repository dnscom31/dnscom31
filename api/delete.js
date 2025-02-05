// api/delete.js
const fs = require('fs');
const path = require('path');

const submissionsFile = path.join(__dirname, '..', 'submissions', 'submissions.json');

module.exports = (req, res) => {
  if (req.method !== 'DELETE') {
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
    const originalLength = data.length;
    data = data.filter(entry => entry.timestamp !== timestamp);

    if (data.length === originalLength) {
      return res.status(404).json({ message: "해당 항목을 찾을 수 없습니다." });
    }

    fs.writeFileSync(submissionsFile, JSON.stringify(data, null, 2));
    return res.json({ message: "삭제되었습니다." });
  } catch (error) {
    console.error("삭제 중 오류 발생:", error);
    return res.status(500).json({ message: "삭제 중 오류 발생" });
  }
};
