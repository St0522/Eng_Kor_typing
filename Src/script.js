class TypingPractice {
  constructor() {
    this.sentences = [];
    this.currentSentenceIndex = 0;
    this.currentPhase = 'english';
    this.index = 0;
    this.englishSpans = [];
    this.koreanSpans = [];
    this.baseDuration = 85;
    this.isRandomMode = false;
    this.completedSentences = new Set();
    this.isSwitchingPhase = false;
    
    this.isComposing = false;
    this.koreanInputBuffer = '';
    this.composingText = '';
    this.isProcessingBackspace = false;
    
    this.initElements();
    this.initHiddenInput();
    this.bindEvents();
    this.setupHTMXHandlers();
  }

  initElements() {
    this.elements = {
      textContainer: document.getElementById('text-container'),
      koreanContainer: document.getElementById('korean-container'),
      cursor: document.getElementById('cursor'),
      fileInput: document.getElementById('file-input'),
      fileUploadContainer: document.getElementById('file-upload-container'),
      sentenceSelector: document.getElementById('sentence-selector'),
      sentenceSelect: document.getElementById('sentence-select'),
      restartButton: document.getElementById('restart-button'),
      randomButton: document.getElementById('random-button'),
      container: document.getElementById('container'),
      progressInfo: document.getElementById('progress-info'),
      progressText: document.getElementById('progress-text')
    };
  }

  initHiddenInput() {
    this.hiddenInput = document.createElement('input');
    Object.assign(this.hiddenInput.style, {
      position: 'absolute',
      left: '-9999px',
      opacity: '0',
      width: '1px',
      height: '1px'
    });
    
    ['autocomplete', 'autocorrect', 'autocapitalize', 'spellcheck'].forEach(attr => {
      this.hiddenInput.setAttribute(attr, attr === 'spellcheck' ? 'false' : 'off');
    });
    
    document.body.appendChild(this.hiddenInput);
  }

  bindEvents() {
    this.elements.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    this.elements.container.addEventListener('keydown', (e) => this.handleKeyDown(e));
    this.elements.container.addEventListener('click', () => this.focusAppropriateInput());
    
    this.hiddenInput.addEventListener('compositionstart', () => this.handleCompositionStart());
    this.hiddenInput.addEventListener('compositionupdate', (e) => this.handleCompositionUpdate(e));
    this.hiddenInput.addEventListener('compositionend', (e) => this.handleCompositionEnd(e));
    this.hiddenInput.addEventListener('input', (e) => this.handleInput(e));
    this.hiddenInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  setupHTMXHandlers() {
    // HTMX 이벤트 핸들러 설정
    document.body.addEventListener('htmx:beforeRequest', (e) => {
      e.preventDefault();
      
      if (e.detail.elt.id === 'sentence-select') {
        this.handleSentenceChange();
      } else if (e.detail.elt.id === 'restart-button') {
        this.loadCurrentSentence();
      } else if (e.detail.elt.id === 'random-button') {
        this.selectRandomSentence();
      }
    });
  }

  handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file || file.type !== 'text/csv') {
      alert('CSV 파일을 선택해주세요.');
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
        complete: (results) => this.processCsvData(results.data),
        error: (error) => alert('CSV 파일 파싱 오류: ' + error.message)
      });
    };
    reader.readAsText(file, 'utf-8');
  }

  processCsvData(data) {
    this.sentences = data
      .filter(row => row.length >= 2 && row[0].trim() && row[1].trim())
      .map(row => ({
        english: row[0].trim(),
        korean: row[1].trim()
      }));

    if (this.sentences.length === 0) {
      alert('올바른 형식의 데이터가 없습니다. CSV 형식을 확인해주세요.');
      return;
    }

    this.showTypingInterface();
    this.populateSentenceSelector();
    this.currentSentenceIndex = 0;
    this.loadCurrentSentence();
  }

  showTypingInterface() {
    this.elements.fileUploadContainer.classList.add('hidden');
    ['sentenceSelector', 'container', 'progressInfo'].forEach(key => {
      this.elements[key].classList.remove('hidden');
    });
  }

  populateSentenceSelector() {
    this.elements.sentenceSelect.innerHTML = '';
    
    const randomOption = document.createElement('option');
    randomOption.value = 'random';
    randomOption.textContent = '🎲 랜덤 모드';
    this.elements.sentenceSelect.appendChild(randomOption);
    
    this.sentences.forEach((sentence, index) => {
      const option = document.createElement('option');
      option.value = index;
      const preview = sentence.english.length > 30 
        ? sentence.english.substring(0, 30) + '...' 
        : sentence.english;
      option.textContent = `${index + 1}. ${preview}`;
      this.elements.sentenceSelect.appendChild(option);
    });
  }

  loadCurrentSentence() {
    if (this.sentences.length === 0) return;
    
    const sentence = this.sentences[this.currentSentenceIndex];
    this.englishText = sentence.english;
    this.koreanText = sentence.korean;
    
    this.resetTyping();
    this.createSpans();
    this.setupInitialCursor();
    
    if (!this.isRandomMode) {
      this.elements.sentenceSelect.value = this.currentSentenceIndex;
    }
    
    const progressText = this.isRandomMode 
      ? `랜덤 모드 - 영어 타이핑 중... (${this.completedSentences.size}/${this.sentences.length} 완료)`
      : '영어 타이핑 중...';
    this.elements.progressText.textContent = progressText;
    
    this.elements.container.focus();
  }

  resetTyping() {
    this.isSwitchingPhase = false;
    this.hiddenInput.disabled = false;
    this.currentPhase = 'english';
    this.index = 0;
    this.englishSpans = [];
    this.koreanSpans = [];
    this.elements.textContainer.innerHTML = '';
    this.elements.koreanContainer.innerHTML = '';
    this.elements.koreanContainer.style.display = 'none';
    this.koreanInputBuffer = '';
    this.hiddenInput.value = '';
  }

  createSpans() {
    this.buildSpans(this.englishText, this.elements.textContainer, this.englishSpans);
    this.buildSpans(this.koreanText, this.elements.koreanContainer, this.koreanSpans);
  }

  buildSpans(text, container, spanArray) {
    container.innerHTML = '';
    spanArray.length = 0;
    
    const words = text.split(' ');
    words.forEach((word, wordIndex) => {
      const wordWrapper = document.createElement('span');
      wordWrapper.style.display = 'inline-block';

      Array.from(word).forEach(char => {
        const charSpan = document.createElement('span');
        charSpan.textContent = char;
        wordWrapper.appendChild(charSpan);
        spanArray.push(charSpan);
      });
      
      container.appendChild(wordWrapper);

      if (wordIndex < words.length - 1) {
        const spaceSpan = document.createElement('span');
        spaceSpan.textContent = ' ';
        spaceSpan.style.whiteSpace = 'pre-wrap';
        container.appendChild(spaceSpan);
        spanArray.push(spaceSpan);
      }
    });
  }

  setupInitialCursor() {
    if (this.englishSpans.length === 0) return;
    
    const { height } = this.englishSpans[0].getBoundingClientRect();
    this.elements.cursor.style.height = `${height}px`;
    
    this.positionCursor(0);
  }

  positionCursor(targetIndex) {
    const spans = this.getCurrentSpans();
    if (spans.length === 0) return;

    const containerRect = this.elements.container.getBoundingClientRect();
    let targetX, targetY;
    
    if (targetIndex < spans.length) {
      const spanRect = spans[targetIndex].getBoundingClientRect();
      targetX = spanRect.left - containerRect.left;
      targetY = spanRect.top - containerRect.top;
    } else {
      const lastSpanRect = spans[spans.length - 1].getBoundingClientRect();
      targetX = lastSpanRect.right - containerRect.left;
      targetY = lastSpanRect.top - containerRect.top;
    }
    
    this.elements.cursor.style.left = `${targetX}px`;
    this.elements.cursor.style.top = `${targetY}px`;
  }

  getCurrentSpans() {
    return this.currentPhase === 'english' ? this.englishSpans : this.koreanSpans;
  }

  getCurrentText() {
    return this.currentPhase === 'english' ? this.englishText : this.koreanText;
  }

  handleSentenceChange() {
    const selectedValue = this.elements.sentenceSelect.value;
    
    if (selectedValue === 'random') {
      this.isRandomMode = true;
      this.selectRandomSentence();
    } else {
      this.isRandomMode = false;
      this.currentSentenceIndex = parseInt(selectedValue);
      this.loadCurrentSentence();
    }
  }

  selectRandomSentence() {
    this.isRandomMode = true;
    
    if (this.completedSentences.size >= this.sentences.length) {
      this.completedSentences.clear();
    }
    
    const availableIndices = [];
    for (let i = 0; i < this.sentences.length; i++) {
      if (!this.completedSentences.has(i)) {
        availableIndices.push(i);
      }
    }
    
    if (availableIndices.length === 0) {
      this.completedSentences.clear();
      for (let i = 0; i < this.sentences.length; i++) {
        availableIndices.push(i);
      }
    }
    
    const randomIndex = Math.floor(Math.random() * availableIndices.length);
    this.currentSentenceIndex = availableIndices[randomIndex];
    
    this.elements.sentenceSelect.value = 'random';
    
    this.loadCurrentSentence();
  }

  handleKeyDown(e) {
    if (this.isSwitchingPhase) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const key = e.key;
    
    if (key === 'Backspace') {
      e.preventDefault();
      this.handleBackspace();
    } else if (this.currentPhase === 'english' && key.length === 1) {
      e.preventDefault();
      this.handleEnglishInput(key);
    }
  }

  handleBackspace() {
    if (this.currentPhase === 'korean') {
      this.handleKoreanBackspace();
    } else {
      this.handleEnglishBackspace();
    }
  }

  handleKoreanBackspace() {
    if (this.isProcessingBackspace) return;
    this.isProcessingBackspace = true;
    
    if (this.index > 0) {
      if (this.isComposing && this.koreanSpans[this.index]) {
        this.koreanSpans[this.index].classList.remove('composing');
        this.koreanSpans[this.index].textContent = this.koreanText[this.index];
        this.composingText = '';
        this.hiddenInput.value = this.koreanInputBuffer;
      } else {
        this.index--;
        this.resetSpan(this.koreanSpans[this.index], this.koreanText[this.index]);
        this.positionCursor(this.index);
        
        this.koreanInputBuffer = this.koreanInputBuffer.slice(0, -1);
        this.hiddenInput.value = this.koreanInputBuffer;
      }
    }
    
    setTimeout(() => { this.isProcessingBackspace = false; }, 0);
  }

  handleEnglishBackspace() {
    if (this.index > 0) {
      this.index--;
      this.resetSpan(this.englishSpans[this.index], this.englishText[this.index]);
      this.positionCursor(this.index);
    }
  }

  handleEnglishInput(key) {
    if (this.index >= this.englishSpans.length) return;
    
    const isCorrect = key === this.englishText[this.index];
    this.englishSpans[this.index].style.color = isCorrect ? 'white' : 'red';
    this.index++;
    this.positionCursor(this.index);
    
    if (this.index === this.englishSpans.length) {
      this.isSwitchingPhase = true;
      setTimeout(() => this.switchToKorean(), 200);
    }
  }

  switchToKorean() {
    this.currentPhase = 'korean';
    this.index = 0;
    this.elements.koreanContainer.style.display = 'block';
    this.koreanInputBuffer = '';
    this.hiddenInput.value = '';
    
    const progressText = this.isRandomMode 
      ? `랜덤 모드 - 한국어 타이핑 중... (${this.completedSentences.size}/${this.sentences.length} 완료)`
      : '한국어 타이핑 중...';
    this.elements.progressText.textContent = progressText;
    
    if (this.koreanSpans.length > 0) {
      const { height } = this.koreanSpans[0].getBoundingClientRect();
      this.elements.cursor.style.height = `${height}px`;
    }
    
    this.positionCursor(0);
    
    this.hiddenInput.disabled = false;
    this.isSwitchingPhase = false;
    setTimeout(() => this.hiddenInput.focus(), 100);
  }

  resetSpan(span, originalText) {
    span.style.color = '#888';
    span.classList.remove('composing');
    span.textContent = originalText;
  }

  handleCompositionStart(e) {
    if (this.isSwitchingPhase) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this.isComposing = true;
    if (this.currentPhase === 'korean' && this.index < this.koreanSpans.length) {
      this.koreanSpans[this.index].classList.add('composing');
    }
  }

  handleCompositionUpdate(e) {
    if (this.isSwitchingPhase) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (this.currentPhase === 'korean' && this.index < this.koreanSpans.length) {
      this.composingText = e.data || '';
      this.koreanSpans[this.index].textContent = this.composingText;
      this.koreanSpans[this.index].classList.add('composing');
    }
  }

  handleCompositionEnd(e) {
    if (this.isSwitchingPhase) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this.isComposing = false;
    this.composingText = '';
    
    if (this.currentPhase === 'korean' && this.index < this.koreanSpans.length) {
      this.koreanSpans[this.index].classList.remove('composing');
      this.koreanSpans[this.index].textContent = this.koreanText[this.index];
    }
    
    if (this.currentPhase === 'korean' && !this.isProcessingBackspace) {
      this.handleKoreanInput(e.data || '');
    }
  }

  handleInput(e) {
    if (this.isSwitchingPhase) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (this.currentPhase === 'korean' && !this.isComposing && !this.isProcessingBackspace) {
      const inputValue = e.target.value;
      if (inputValue.length > this.koreanInputBuffer.length) {
        const newChar = inputValue[inputValue.length - 1];
        this.handleKoreanInput(newChar);
        this.koreanInputBuffer = inputValue;
      } else if (inputValue.length < this.koreanInputBuffer.length) {
        e.target.value = this.koreanInputBuffer;
      }
    }
  }

  handleKoreanInput(inputChar) {
    if (this.index >= this.koreanSpans.length || !inputChar) return;
    
    const expectedChar = this.koreanText[this.index];
    const isCorrect = inputChar === expectedChar;
    this.koreanSpans[this.index].style.color = isCorrect ? 'white' : 'red';
    this.index++;
    this.positionCursor(this.index);
    
    if (this.index === this.koreanSpans.length) {
      this.hiddenInput.disabled = true;
      this.isSwitchingPhase = true;
      setTimeout(() => this.completeTyping(), 200);
    }
  }

  completeTyping() {
    this.completedSentences.add(this.currentSentenceIndex);
    
    const completedCount = this.completedSentences.size;
    const totalCount = this.sentences.length;
    
    this.elements.progressText.innerHTML = `완료! <span style="color: #4CAF50;">✓</span> ${this.isRandomMode ? `(${completedCount}/${totalCount})` : ''}`;
    
    this.hiddenInput.blur();
    this.hiddenInput.value = '';
    
    setTimeout(() => {
      if (this.isRandomMode) {
        if (completedCount >= totalCount) {
          this.elements.progressText.innerHTML = '모든 단어/문장 완료! <span style="color: #4CAF50;">🎉</span>';
          this.completedSentences.clear();
        } else {
          this.selectRandomSentence();
        }
      } else {
        if (this.currentSentenceIndex < this.sentences.length - 1) {
          this.currentSentenceIndex++;
          this.loadCurrentSentence();
        } else {
          this.elements.progressText.innerHTML = '모든 단어/문장 완료! <span style="color: #4CAF50;">🎉</span>';
        }
      }
    }, 600);
  }

  focusAppropriateInput() {
    if (this.currentPhase === 'korean') {
      this.hiddenInput.focus();
    } else {
      this.elements.container.focus();
    }
  }
}

// Initialize the application
const typingPractice = new TypingPractice();