export function parseCsvFile(file, onComplete, onError) {
  if (!file || file.type !== 'text/csv') {
    onError('CSV 파일을 선택해주세요.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    Papa.parse(event.target.result, {
      header: false,
      skipEmptyLines: true,
      delimiter: ',',
      quoteChar: '"',
      escapeChar: '"',
      complete: (results) => onComplete(results.data),
      error: (error) => onError('CSV 파일 파싱 오류: ' + error.message)
    });
  };
  reader.readAsText(file, 'utf-8');
}

export function transformCsvData(data) {
  return data
    .filter(row => row.length >= 2 && row[0].trim() && row[1].trim())
    .map(row => ({
      english: row[0].trim(),
      korean: row[1].trim()
    }));
}
