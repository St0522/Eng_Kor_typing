export function setupElements() {
  return {
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

export function createHiddenInput() {
  const hiddenInput = document.createElement('input');
  Object.assign(hiddenInput.style, {
    position: 'absolute',
    left: '-9999px',
    opacity: '0',
    width: '1px',
    height: '1px'
  });

  ['autocomplete', 'autocorrect', 'autocapitalize', 'spellcheck'].forEach(attr => {
    hiddenInput.setAttribute(attr, attr === 'spellcheck' ? 'false' : 'off');
  });

  document.body.appendChild(hiddenInput);
  return hiddenInput;
}

export function showTypingInterface(elements) {
  elements.fileUploadContainer.classList.add('hidden');
  ['sentenceSelector', 'container', 'progressInfo'].forEach(key => {
    elements[key].classList.remove('hidden');
  });
}
