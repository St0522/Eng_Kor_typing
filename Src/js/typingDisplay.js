export class TypingDisplay {
  constructor(elements) {
    this.elements = elements;
    this.resetState();
  }

  resetState() {
    this.currentPhase = 'english';
    this.index = 0;
    this.englishText = '';
    this.koreanText = '';
    this.englishSpans = [];
    this.koreanSpans = [];
    this.elements.textContainer.innerHTML = '';
    this.elements.koreanContainer.innerHTML = '';
    this.elements.koreanContainer.style.display = 'none';
  }

  setTexts(englishText, koreanText) {
    this.englishText = englishText;
    this.koreanText = koreanText;
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

  showKoreanText(cursorHeight) {
    this.currentPhase = 'korean';
    this.index = 0;
    this.elements.koreanContainer.style.display = 'block';
    if (this.koreanSpans.length > 0) {
      const { height } = this.koreanSpans[0].getBoundingClientRect();
      this.elements.cursor.style.height = `${height}px`;
    }
    this.positionCursor(0);
  }

  setCursorHeightForKorean() {
    if (this.koreanSpans.length > 0) {
      const { height } = this.koreanSpans[0].getBoundingClientRect();
      this.elements.cursor.style.height = `${height}px`;
    }
  }

  resetSpan(span, originalText) {
    span.style.color = '#888';
    span.classList.remove('composing');
    span.textContent = originalText;
  }
}
