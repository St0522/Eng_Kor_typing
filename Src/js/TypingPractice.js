import { setupElements, createHiddenInput, showTypingInterface } from './elements.js';
import { parseCsvFile, transformCsvData } from './csvService.js';
import { SentenceManager } from './sentenceManager.js';
import { TypingDisplay } from './typingDisplay.js';

export class TypingPractice {
  constructor() {
    this.elements = setupElements();
    this.hiddenInput = createHiddenInput();
    this.sentenceManager = new SentenceManager();
    this.display = new TypingDisplay(this.elements);

    this.isSwitchingPhase = false;
    this.isComposing = false;
    this.koreanInputBuffer = '';
    this.composingText = '';
    this.isProcessingBackspace = false;

    this.bindEvents();
    this.setupHTMXHandlers();
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
    parseCsvFile(
      file,
      (data) => this.processCsvData(data),
      (message) => alert(message)
    );
  }

  processCsvData(data) {
    const sentences = transformCsvData(data);

    if (sentences.length === 0) {
      alert('올바 형식의 데이터가 없습니다. CSV 형식을 확인해주세요.');
      return;
    }

    this.sentenceManager.setSentences(sentences);
    showTypingInterface(this.elements);
    this.sentenceManager.populateSelector(this.elements.sentenceSelect);
    this.loadCurrentSentence();
  }

  loadCurrentSentence() {
    if (!this.sentenceManager.hasSentences()) return;

    const sentence = this.sentenceManager.getCurrentSentence();
    this.display.resetState();
    this.display.setTexts(sentence.english, sentence.korean);
    this.display.createSpans();
    this.display.setupInitialCursor();

    if (!this.sentenceManager.isRandomMode) {
      this.elements.sentenceSelect.value = this.sentenceManager.currentSentenceIndex;
    } else {
      this.elements.sentenceSelect.value = 'random';
    }

    this.elements.progressText.textContent = this.sentenceManager.buildProgressText('english');

    this.koreanInputBuffer = '';
    this.hiddenInput.disabled = false;
    this.hiddenInput.value = '';
    this.elements.container.focus();
  }

  handleSentenceChange() {
    const selectedValue = this.elements.sentenceSelect.value;
    this.sentenceManager.setSentenceBySelectorValue(selectedValue);
    this.loadCurrentSentence();
  }

  selectRandomSentence() {
    this.sentenceManager.selectRandomSentence();
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
    } else if (this.display.currentPhase === 'english' && key.length === 1) {
      e.preventDefault();
      this.handleEnglishInput(key);
    }
  }

  handleBackspace() {
    if (this.display.currentPhase === 'korean') {
      this.handleKoreanBackspace();
    } else {
      this.handleEnglishBackspace();
    }
  }

  handleEnglishBackspace() {
    if (this.display.index > 0) {
      this.display.index--;
      this.display.resetSpan(
        this.display.englishSpans[this.display.index],
        this.display.englishText[this.display.index]
      );
      this.display.positionCursor(this.display.index);
    }
  }

  handleEnglishInput(key) {
    if (this.display.index >= this.display.englishSpans.length) return;

    const isCorrect = key === this.display.englishText[this.display.index];
    this.display.englishSpans[this.display.index].style.color = isCorrect ? 'white' : 'red';
    this.display.index++;
    this.display.positionCursor(this.display.index);

    if (this.display.index === this.display.englishSpans.length) {
      this.isSwitchingPhase = true;
      setTimeout(() => this.switchToKorean(), 200);
    }
  }

  switchToKorean() {
    this.display.currentPhase = 'korean';
    this.display.index = 0;
    this.display.showKoreanText();
    this.koreanInputBuffer = '';
    this.hiddenInput.value = '';

    this.elements.progressText.textContent = this.sentenceManager.buildProgressText('korean');

    this.display.setCursorHeightForKorean();
    this.display.positionCursor(0);

    this.hiddenInput.disabled = false;
    this.isSwitchingPhase = false;
    setTimeout(() => this.hiddenInput.focus(), 100);
  }

  handleKoreanBackspace() {
    if (this.isProcessingBackspace) return;
    this.isProcessingBackspace = true;

    if (this.display.index > 0) {
      if (this.isComposing && this.display.koreanSpans[this.display.index]) {
        this.display.koreanSpans[this.display.index].classList.remove('composing');
        this.display.koreanSpans[this.display.index].textContent = this.display.koreanText[this.display.index];
        this.composingText = '';
        this.hiddenInput.value = this.koreanInputBuffer;
      } else {
        this.display.index--;
        this.display.resetSpan(
          this.display.koreanSpans[this.display.index],
          this.display.koreanText[this.display.index]
        );
        this.display.positionCursor(this.display.index);

        this.koreanInputBuffer = this.koreanInputBuffer.slice(0, -1);
        this.hiddenInput.value = this.koreanInputBuffer;
      }
    }

    setTimeout(() => { this.isProcessingBackspace = false; }, 0);
  }

  handleKoreanInput(inputChar) {
    if (this.display.index >= this.display.koreanSpans.length || !inputChar) return;

    const expectedChar = this.display.koreanText[this.display.index];
    const isCorrect = inputChar === expectedChar;
    this.display.koreanSpans[this.display.index].style.color = isCorrect ? 'white' : 'red';
    this.display.index++;
    this.display.positionCursor(this.display.index);

    if (this.display.index === this.display.koreanSpans.length) {
      this.hiddenInput.disabled = true;
      this.isSwitchingPhase = true;
      setTimeout(() => this.completeTyping(), 200);
    }
  }

  handleCompositionStart(e) {
    if (this.isSwitchingPhase) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this.isComposing = true;
    if (this.display.currentPhase === 'korean' && this.display.index < this.display.koreanSpans.length) {
      this.display.koreanSpans[this.display.index].classList.add('composing');
    }
  }

  handleCompositionUpdate(e) {
    if (this.isSwitchingPhase) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (this.display.currentPhase === 'korean' && this.display.index < this.display.koreanSpans.length) {
      this.composingText = e.data || '';
      this.display.koreanSpans[this.display.index].textContent = this.composingText;
      this.display.koreanSpans[this.display.index].classList.add('composing');
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

    if (this.display.currentPhase === 'korean' && this.display.index < this.display.koreanSpans.length) {
      this.display.koreanSpans[this.display.index].classList.remove('composing');
      this.display.koreanSpans[this.display.index].textContent = this.display.koreanText[this.display.index];
    }

    if (this.display.currentPhase === 'korean' && !this.isProcessingBackspace) {
      this.handleKoreanInput(e.data || '');
    }
  }

  handleInput(e) {
    if (this.isSwitchingPhase) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (this.display.currentPhase === 'korean' && !this.isComposing && !this.isProcessingBackspace) {
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

  completeTyping() {
    this.sentenceManager.markCurrentSentenceComplete();

    const completedCount = this.sentenceManager.completedSentences.size;
    const totalCount = this.sentenceManager.sentences.length;

    this.elements.progressText.innerHTML = `완료! <span style="color: #4CAF50;">✓</span> ${this.sentenceManager.isRandomMode ? `(${completedCount}/${totalCount})` : ''}`;

    this.hiddenInput.blur();
    this.hiddenInput.value = '';

    setTimeout(() => {
      if (this.sentenceManager.isRandomMode) {
        if (this.sentenceManager.resetIfCompleted()) {
          this.elements.progressText.innerHTML = '모든 단어/문장 완료! <span style="color: #4CAF50;">🎉</span>';
        } else {
          this.selectRandomSentence();
        }
      } else {
        if (this.sentenceManager.moveToNextSequential()) {
          this.loadCurrentSentence();
        } else {
          this.elements.progressText.innerHTML = '모든 단어/문장 완료! <span style="color: #4CAF50;">🎉</span>';
        }
      }
    }, 600);
  }

  focusAppropriateInput() {
    if (this.display.currentPhase === 'korean') {
      this.hiddenInput.focus();
    } else {
      this.elements.container.focus();
    }
  }
}
