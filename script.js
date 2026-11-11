const dialog = document.querySelector('.clip-dialog');
const excerpt = dialog.querySelector('video');
const clipTitle = document.querySelector('#clip-title');
let range = null;
let trigger = null;

for (const link of document.querySelectorAll('[data-clip]')) {
  link.addEventListener('click', (event) => {
    if (!dialog.showModal || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const match = new URL(link.href).hash.match(/^#t=([\d.]+),([\d.]+)$/);
    if (!match) return;

    event.preventDefault();
    range = {start: Number(match[1]), end: Number(match[2])};
    trigger = link;
    const label = link.querySelector('.clip-label strong, .hero-panel-caption > span');
    clipTitle.textContent = label.querySelector('small') ? label.lastChild.textContent.trim() : label.textContent;
    dialog.showModal();
    excerpt.src = link.href;
    excerpt.play().catch(() => {});
  });
}

excerpt.addEventListener('loadedmetadata', () => {
  if (range && Math.abs(excerpt.currentTime - range.start) > .2) excerpt.currentTime = range.start;
});
excerpt.addEventListener('timeupdate', () => {
  if (range && excerpt.currentTime >= range.end) excerpt.pause();
});
excerpt.addEventListener('play', () => {
  if (range && excerpt.readyState > 0 && excerpt.currentTime >= range.end) excerpt.currentTime = range.start;
});
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener('close', () => {
  excerpt.pause();
  excerpt.removeAttribute('src');
  excerpt.load();
  range = null;
  trigger?.focus({preventScroll: true});
  trigger = null;
});

const fullDemo = document.querySelector('#full-demo');
const chapters = [...document.querySelectorAll('[data-chapter]')];
let pendingSeek = null;

for (const chapter of chapters) {
  chapter.addEventListener('click', (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const start = Number(chapter.dataset.chapter);
    if (fullDemo.readyState) {
      fullDemo.currentTime = start;
    } else {
      pendingSeek = start;
    }
    fullDemo.play().catch(() => {});
  });
}
fullDemo.addEventListener('loadedmetadata', () => {
  if (pendingSeek !== null) fullDemo.currentTime = pendingSeek;
  pendingSeek = null;
});
fullDemo.addEventListener('timeupdate', () => {
  const current = chapters.findLast((chapter) => Number(chapter.dataset.chapter) <= fullDemo.currentTime + .1);
  for (const chapter of chapters) {
    if (chapter === current) chapter.setAttribute('aria-current', 'true');
    else chapter.removeAttribute('aria-current');
  }
});

const copyButton = document.querySelector('.copy-button');
const citation = document.querySelector('#bibtex');
const copyStatus = document.querySelector('#copy-status');
copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(citation.textContent);
    copyButton.textContent = 'Copied';
    copyStatus.textContent = 'BibTeX copied to clipboard.';
    setTimeout(() => { copyButton.textContent = 'Copy BibTeX'; }, 1800);
  } catch {
    const selection = window.getSelection();
    const selectedText = document.createRange();
    selectedText.selectNodeContents(citation);
    selection.removeAllRanges();
    selection.addRange(selectedText);
    copyStatus.textContent = 'BibTeX selected. Copy it using the keyboard.';
  }
});
