export class SentenceManager {
  constructor() {
    this.sentences = [];
    this.currentSentenceIndex = 0;
    this.isRandomMode = false;
    this.completedSentences = new Set();
  }

  setSentences(sentences) {
    this.sentences = sentences;
    this.currentSentenceIndex = 0;
    this.completedSentences.clear();
  }

  hasSentences() {
    return this.sentences.length > 0;
  }

  getCurrentSentence() {
    return this.sentences[this.currentSentenceIndex];
  }

  populateSelector(selectElement) {
    selectElement.innerHTML = '';

    const randomOption = document.createElement('option');
    randomOption.value = 'random';
    randomOption.textContent = '🎲 랜덤 모드';
    selectElement.appendChild(randomOption);

    this.sentences.forEach((sentence, index) => {
      const option = document.createElement('option');
      option.value = index;
      const preview = sentence.english.length > 30
        ? sentence.english.substring(0, 30) + '...'
        : sentence.english;
      option.textContent = `${index + 1}. ${preview}`;
      selectElement.appendChild(option);
    });
  }

  setSentenceBySelectorValue(value) {
    if (value === 'random') {
      this.isRandomMode = true;
      this.selectRandomSentence();
    } else {
      this.isRandomMode = false;
      this.currentSentenceIndex = parseInt(value, 10);
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
  }

  markCurrentSentenceComplete() {
    this.completedSentences.add(this.currentSentenceIndex);
  }

  moveToNextSequential() {
    if (this.currentSentenceIndex < this.sentences.length - 1) {
      this.currentSentenceIndex++;
      return true;
    }
    return false;
  }

  resetIfCompleted() {
    if (this.completedSentences.size >= this.sentences.length) {
      this.completedSentences.clear();
      return true;
    }
    return false;
  }

  buildProgressText(phase) {
    const modePrefix = this.isRandomMode ? '랜덤 모드 - ' : '';
    const phaseText = phase === 'english' ? '영어 타이핑 중...' : '한국어 타이핑 중...';

    if (!this.isRandomMode) {
      return `${modePrefix}${phaseText}`;
    }

    return `${modePrefix}${phaseText} (${this.completedSentences.size}/${this.sentences.length} 완료)`;
  }
}
