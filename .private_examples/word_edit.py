def remove_number_words(input_file, output_file):
    """
    텍스트 파일에서 숫자를 나타내는 영어 단어를 제거합니다.
    
    Args:
        input_file: 입력 파일 경로
        output_file: 출력 파일 경로
    """
    # 숫자를 나타내는 영어 단어 목록 (소문자)
    number_words = {
        # 기본 숫자 (0-19)
        'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 
        'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen',
        'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
        
        # 십 단위 (20-90)
        'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 
        'eighty', 'ninety',
        
        # 큰 단위
        'hundred', 'thousand', 'million', 'billion', 'trillion',
        
        # 서수 (1st-19th)
        'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 
        'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth',
        'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 
        'seventeenth', 'eighteenth', 'nineteenth',
        
        # 십 단위 서수 (20th-90th)
        'twentieth', 'thirtieth', 'fortieth', 'fiftieth', 
        'sixtieth', 'seventieth', 'eightieth', 'ninetieth',
        
        # 큰 단위 서수
        'hundredth', 'thousandth', 'millionth', 'billionth', 'trillionth'
    }
    
    filtered_lines = []
    removed_count = 0
    
    # 파일 읽기
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # 각 줄 처리
    for line in lines:
        line = line.strip()
        if not line:  # 빈 줄은 건너뛰기
            continue
            
        # {영어, 한국어} 형태에서 영어 단어 추출
        if line.startswith('{') and line.endswith('}'):
            parts = line[1:-1].split(',', 1)  # 첫 번째 콤마로만 분리
            if len(parts) == 2:
                english_word = parts[0].strip().lower()
                
                # 숫자 단어가 아닌 경우만 추가
                if english_word not in number_words:
                    filtered_lines.append(line)
                else:
                    removed_count += 1
                    print(f"제거됨: {line}")
    
    # 결과를 파일에 저장
    with open(output_file, 'w', encoding='utf-8') as f:
        for line in filtered_lines:
            f.write(line + '\n')
    
    print(f"\n처리 완료!")
    print(f"총 {len(lines)} 줄 중 {len(filtered_lines)} 줄이 저장되었습니다.")
    print(f"제거된 숫자 단어: {removed_count} 개")

def remove_duplicate_words(input_file, output_file):
    """
    텍스트 파일에서 중복되는 영어 단어를 제거하고 하나만 남깁니다.
    
    Args:
        input_file: 입력 파일 경로
        output_file: 출력 파일 경로
    """
    seen_words = set()
    unique_lines = []
    
    # 파일 읽기
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # 각 줄 처리
    for line in lines:
        line = line.strip()
        if not line:  # 빈 줄은 건너뛰기
            continue
            
        # {영어, 한국어} 형태에서 영어 단어 추출
        if line.startswith('{') and line.endswith('}'):
            parts = line[1:-1].split(',', 1)  # 첫 번째 콤마로만 분리
            if len(parts) == 2:
                english_word = parts[0].strip()
                
                # 중복되지 않은 단어만 추가
                if english_word not in seen_words:
                    seen_words.add(english_word)
                    unique_lines.append(line)
    
    # 결과를 파일에 저장
    with open(output_file, 'w', encoding='utf-8') as f:
        for line in unique_lines:
            f.write(line + '\n')
    
    print(f"처리 완료!")
    print(f"총 {len(lines)} 줄 중 {len(unique_lines)} 개의 고유한 단어가 저장되었습니다.")
    print(f"제거된 중복 단어: {len(lines) - len(unique_lines)} 개")

def remove_both_english(input_file, output_file):
    """
    텍스트 파일에서 양쪽 모두 영어인 항목을 제거합니다.
    
    Args:
        input_file: 입력 파일 경로
        output_file: 출력 파일 경로
    """
    filtered_lines = []
    removed_count = 0
    
    # 파일 읽기
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # 각 줄 처리
    for line in lines:
        line = line.strip()
        if not line:  # 빈 줄은 건너뛰기
            continue
            
        # {영어, 한국어} 형태에서 각 부분 추출
        if line.startswith('{') and line.endswith('}'):
            parts = line[1:-1].split(',', 1)  # 첫 번째 콤마로만 분리
            if len(parts) == 2:
                left_part = parts[0].strip()
                right_part = parts[1].strip()
                
                # 양쪽 모두 영어인지 확인
                # 공백을 제거하고 알파벳과 일부 특수문자만으로 구성되어 있는지 확인
                left_is_english = left_part.replace(' ', '').replace('-', '').isascii()
                right_is_english = right_part.replace(' ', '').replace('-', '').isascii()
                
                # 양쪽 모두 영어가 아닌 경우만 유지
                if left_is_english and right_is_english:
                    removed_count += 1
                    print(f"제거됨 (양쪽 영어): {line}")
                else:
                    filtered_lines.append(line)
    
    # 결과를 파일에 저장
    with open(output_file, 'w', encoding='utf-8') as f:
        for line in filtered_lines:
            f.write(line + '\n')
    
    print(f"\n처리 완료!")
    print(f"총 {len(lines)} 줄 중 {len(filtered_lines)} 줄이 저장되었습니다.")
    print(f"제거된 항목 (양쪽 영어): {removed_count} 개")


def sort_by_english_word(input_file, output_file):
    """
    텍스트 파일의 항목들을 영어 단어 기준으로 알파벳 순 정렬합니다.
    
    Args:
        input_file: 입력 파일 경로
        output_file: 출력 파일 경로
    """
    items = []
    
    # 파일 읽기
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # 각 줄 처리
    for line in lines:
        line = line.strip()
        if not line:  # 빈 줄은 건너뛰기
            continue
            
        # {영어, 한국어} 형태에서 영어 단어 추출
        if line.startswith('{') and line.endswith('}'):
            parts = line[1:-1].split(',', 1)  # 첫 번째 콤마로만 분리
            if len(parts) == 2:
                english_word = parts[0].strip()
                # (영어 단어, 원본 줄) 튜플로 저장
                items.append((english_word.lower(), line))
    
    # 영어 단어를 기준으로 알파벳 순 정렬 (대소문자 구분 없이)
    items.sort(key=lambda x: x[0])
    
    # 결과를 파일에 저장
    with open(output_file, 'w', encoding='utf-8') as f:
        for _, original_line in items:
            f.write(original_line + '\n')
    
    print(f"처리 완료!")
    print(f"총 {len(items)} 개의 항목이 알파벳 순으로 정렬되어 저장되었습니다.")
    print(f"\n처음 5개 항목:")
    for i in range(min(5, len(items))):
        print(f"  {items[i][1]}")

# 사용 예시
if __name__ == "__main__":
    input_file = "Bin2vec_corpus.txt"  # 입력 파일명
    output_file = "Bin2vec_corpus2.txt"  # 출력 파일명
    
    sort_by_english_word(input_file, output_file)