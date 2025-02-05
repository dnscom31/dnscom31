// data.js
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'submissions', 'submissions.json');

module.exports = (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).send('지원되지 않는 메소드');
  }

  try {
    // 파일 존재 및 내용 확인
    if (!fs.existsSync(filePath)) {
      console.log("📂 데이터 파일이 존재하지 않음: submissions.json");
      return res.status(200).send('<h2>데이터가 없습니다.</h2>');
    }
    let fileContent = fs.readFileSync(filePath, 'utf8').trim();
    if (!fileContent) {
      console.log("📂 데이터 파일이 비어 있음: submissions.json");
      return res.status(200).send('<h2>데이터가 없습니다.</h2>');
    }
    let submissions;
    try {
      submissions = JSON.parse(fileContent);
    } catch (jsonError) {
      console.error("❌ JSON 파싱 오류:", jsonError);
      return res.status(500).send("데이터 조회 중 오류가 발생했습니다. (JSON 형식 오류)");
    }
    if (!Array.isArray(submissions) || submissions.length === 0) {
      return res.status(200).send('<h2>데이터가 없습니다.</h2>');
    }

    // 쿼리 파라미터 읽기
    const queryDate = req.query.date || "";
    const queryName = req.query.name || "";
    // unconfirmed 파라미터가 "true"이면 미확인 결과만 검색
    const unconfirmedOnly = req.query.unconfirmed === "true";

    // 날짜 필터링 (있으면 timestamp가 해당 날짜로 시작하는 항목만)
    let filteredSubmissions = submissions;
    if (queryDate) {
      filteredSubmissions = filteredSubmissions.filter(entry => entry.timestamp.startsWith(queryDate));
    }
    // 이름 필터링 (대소문자 구분 없이 포함하는 항목)
    if (queryName) {
      filteredSubmissions = filteredSubmissions.filter(entry =>
        entry.name.toLowerCase().includes(queryName.toLowerCase())
      );
    }
    // 미확인만 필터링 (entry.confirmed가 true가 아닌 항목만)
    if (unconfirmedOnly) {
      filteredSubmissions = filteredSubmissions.filter(entry => !entry.confirmed);
    }

    if (filteredSubmissions.length === 0) {
      return res.status(200).send('<h2>검색 조건에 해당하는 데이터가 없습니다.</h2>');
    }

    // 키명 변환 및 확인 여부 표시 (확인되지 않은 항목은 "미확인", 확인된 항목은 "확인 완료")
    const transformedData = filteredSubmissions.map(entry => {
      const confirmed = entry.confirmed === true; // 없으면 false로 간주
      return {
        "예약일": entry.timestamp,
        "성명": entry.name,
        "연락처": entry.contact,
        "이메일": entry.email,
        "주소": entry.address,
        "검진희망일": entry.preferred_date,
        "복용중인 약물": entry.medications,
        "용종 제거 동의": entry.polyp_removal,
        "2주 내 비행 여부": entry.flight_within_2weeks,
        "MRI 관련 이슈": entry.mri_issues,
        "검진 유형": entry.checkup_type,
        "확인여부": confirmed ? "확인 완료" : "미확인",
        // 내부 식별용으로 원본 timestamp 사용 (고유 ID)
        "_id": entry.timestamp
      };
    });

    // 페이지네이션 (한 페이지에 5건씩)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 5;
    const totalEntries = transformedData.length;
    const totalPages = Math.ceil(totalEntries / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedData = transformedData.slice(startIndex, startIndex + limit);

    // HTML 생성
    let html = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>데이터 조회 결과</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .entry { margin-bottom: 20px; padding: 10px; border: 1px solid #ccc; }
              hr { border: 0; border-top: 1px solid #eee; margin: 20px 0; }
              .pagination { margin-top: 20px; }
              .pagination a { margin-right: 10px; text-decoration: none; color: blue; }
              .action-btn { margin-right: 5px; }
              form { margin-bottom: 20px; }
              label.confirm-label { margin-left: 10px; font-weight: bold; }
          </style>
      </head>
      <body>
          <h2>데이터 조회 결과 (총 ${totalEntries}건, 페이지 ${page} / ${totalPages})</h2>
          <!-- 검색 폼: 날짜, 이름, 미확인 결과만 체크박스 -->
          <form method="get" action="/api/data">
              날짜: <input type="date" name="date" value="${queryDate}">
              이름: <input type="text" name="name" value="${queryName}">
              <label>
                <input type="checkbox" name="unconfirmed" value="true" ${unconfirmedOnly ? "checked" : ""}>
                미확인 결과만
              </label>
              <button type="submit">검색</button>
          </form>
    `;

    // 각 항목 출력 (키-값 표시) 및 액션 버튼 추가
    paginatedData.forEach(entry => {
      html += `<div class="entry">`;
      for (const key in entry) {
        if (key === "_id") continue; // 내부 식별자는 출력하지 않음
        html += `<p><strong>${key}:</strong> ${entry[key]}</p>`;
      }
      // 삭제 버튼 (항상 표시)
      html += `<button class="action-btn" onclick="deleteEntry('${entry._id}')">삭제</button>`;
      // 확인 여부를 표시하는 체크 박스
      // 만약 미확인 상태라면, 체크 박스를 활성화하여 사용자가 체크하면 확인 처리하도록 함.
      if (entry["확인여부"] === "미확인") {
        html += `
          <label class="confirm-label">
            <input type="checkbox" onchange="handleConfirm(this, '${entry._id}')">
            확인 완료
          </label>
        `;
      } else {
        // 확인 완료된 항목은 체크된 상태로 비활성화(disabled) 처리
        html += `
          <label class="confirm-label">
            <input type="checkbox" checked disabled>
            확인 완료
          </label>
        `;
      }
      html += `</div><hr>`;
    });

    // 페이지네이션 링크 생성 (이전/다음)
    html += `<div class="pagination">`;
    if (page > 1) {
      let prevLink = `?page=${page - 1}`;
      if(queryDate) prevLink += `&date=${encodeURIComponent(queryDate)}`;
      if(queryName) prevLink += `&name=${encodeURIComponent(queryName)}`;
      if(unconfirmedOnly) prevLink += `&unconfirmed=true`;
      html += `<a href="${prevLink}">이전 페이지</a>`;
    }
    if (page < totalPages) {
      let nextLink = `?page=${page + 1}`;
      if(queryDate) nextLink += `&date=${encodeURIComponent(queryDate)}`;
      if(queryName) nextLink += `&name=${encodeURIComponent(queryName)}`;
      if(unconfirmedOnly) nextLink += `&unconfirmed=true`;
      html += `<a href="${nextLink}">다음 페이지</a>`;
    }
    html += `</div>`;

    // 액션 버튼(삭제, 확인처리)용 인라인 자바스크립트
    html += `
      <script>
        function deleteEntry(id) {
          if (confirm('해당 항목을 삭제하시겠습니까?')) {
            fetch('/api/delete?timestamp=' + encodeURIComponent(id), { method: 'DELETE' })
              .then(response => response.json())
              .then(data => {
                alert(data.message || '삭제되었습니다.');
                location.reload();
              })
              .catch(err => {
                console.error(err);
                alert('삭제 처리 중 오류가 발생했습니다.');
              });
          }
        }
        function handleConfirm(checkbox, id) {
          if (checkbox.checked) {
            fetch('/api/confirm?timestamp=' + encodeURIComponent(id), { method: 'POST' })
              .then(response => response.json())
              .then(data => {
                alert(data.message || '확인 완료되었습니다.');
                location.reload();
              })
              .catch(err => {
                console.error(err);
                alert('확인 처리 중 오류가 발생했습니다.');
              });
          }
        }
      </script>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    return res.status(200).send(html);
  } catch (error) {
    console.error("❌ 데이터 조회 중 오류 발생:", error);
    return res.status(500).send("데이터 조회 중 오류가 발생했습니다. (서버 내부 오류)");
  }
};
