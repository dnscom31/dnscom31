const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  if (req.method === 'GET') {
    fs.readFile(path.join(__dirname, '..', 'submissions.txt'), 'utf8', (err, data) => {
      if (err) {
        res.status(500).send('데이터 읽기 중 오류 발생');
        return;
      }
      const date = req.query.date;
      const filteredData = data.split('\n\n').filter(entry => entry.includes(`날짜: ${date}`)).join('\n\n');
      res.status(200).send(`<pre>${filteredData}</pre>`);
    });
  } else {
    res.status(405).send('지원되지 않는 메소드');
  }
};
