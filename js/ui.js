/**
 * ui.js
 * Renders a question inside a container and returns a function to retrieve
 * the user's answer. Supports all question types.
 */


export function renderQuestion(q, isPractice, onAnswer) {
  const container = document.createElement('div');
  container.className = 'question-container';

  const questionText = document.createElement('div');
  questionText.className = 'question-text';
  questionText.textContent = q.question;
  container.appendChild(questionText);

  const revealArea = createRevealArea(q);

  if (q.type === 'mcq') {
    renderMCQ(container, q, true, onAnswer, revealArea);
  } else if (q.type === 'true_false') {
    renderTrueFalse(container, q, true, onAnswer, revealArea);
  } else {
    renderTextAnswer(container, q, true, onAnswer, revealArea);
  }

  container.appendChild(revealArea);
  return {
    container,
    getAnswer: () => extractAnswer(container, q)
  };
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function createRevealArea(q) {
  const div = document.createElement('div');
  div.className = 'answer-reveal hidden'; // hidden by default
  div.innerHTML = `
    <div class="answer-label">Correct answer</div>
    <div class="answer-value${['coding', 'debug', 'trace'].includes(q.type) ? ' code-block' : ''}">${escapeHTML(q.answer)}</div>
    ${q.explanation ? `<div class="explanation">${escapeHTML(q.explanation)}</div>` : ''}
  `;
  return div;
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderMCQ(container, q, isPractice, onAnswer, revealArea) {
  // Shuffle answer choices
  const shuffledChoices = shuffleArray([...q.choices]); // copy & shuffle
  q._shuffledChoices = shuffledChoices; // store for later extraction

  const choicesGrid = document.createElement('div');
  choicesGrid.className = 'choices-grid';

  shuffledChoices.forEach((choice, idx) => {
    const label = document.createElement('label');
    label.className = 'choice-label';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'mcq-choice';
    radio.value = choice;

    label.appendChild(radio);
    label.appendChild(document.createTextNode(choice));
    choicesGrid.appendChild(label);

    radio.addEventListener('change', () => {
        // Auto-reveal correct answer and disable
        revealArea.classList.remove('hidden');
        container.querySelectorAll('.choice-label').forEach(l => {
          l.style.pointerEvents = 'none';
          // Highlight correct / wrong
          if (l.contains(radio) && radio.value === q.answer) {
            l.style.borderColor = '#4ade80';
            l.style.background = '#052e16';
          } else if (l.contains(radio) && radio.checked) {
            l.style.borderColor = '#f87171';
            l.style.background = '#450a0a';
          }
        });
        const isCorrect = radio.value === q.answer;
        onAnswer(radio.value, isCorrect);
    });
  });

  container.appendChild(choicesGrid);
}

function renderTrueFalse(container, q, isPractice, onAnswer, revealArea) {
  const buttonsDiv = document.createElement('div');
  buttonsDiv.className = 'tf-buttons';

  const btnTrue = createTFButton('True', q, isPractice, onAnswer, revealArea, container);
  const btnFalse = createTFButton('False', q, isPractice, onAnswer, revealArea, container);

  buttonsDiv.appendChild(btnTrue);
  buttonsDiv.appendChild(btnFalse);
  container.appendChild(buttonsDiv);
}

function createTFButton(text, q, isPractice, onAnswer, revealArea, container) {
  const btn = document.createElement('button');
  btn.className = 'tf-btn';
  btn.textContent = text;
  btn.dataset.value = text;

  btn.addEventListener('click', () => {
    // Deselect other
    container.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

      revealArea.classList.remove('hidden');
      container.querySelectorAll('.tf-btn').forEach(b => {
        b.disabled = true;
        if (b.dataset.value === q.answer) {
          b.style.borderColor = '#4ade80';
          b.style.background = '#052e16';
        } else if (b.classList.contains('selected')) {
          b.style.borderColor = '#f87171';
          b.style.background = '#450a0a';
        }
      });
      const isCorrect = text === q.answer;
      onAnswer(text, isCorrect);
  });

  return btn;
}

function renderTextAnswer(container, q, isPractice, onAnswer, revealArea) {
  // isPractice is always true, so we don't need to check
  const textarea = document.createElement('textarea');
  textarea.className = 'text-answer-input';
  if (['coding', 'debug', 'trace'].includes(q.type)) {
    textarea.classList.add('code-input');
  }
  textarea.placeholder = 'Type your answer…';
  container.appendChild(textarea);

  const revealBtn = document.createElement('button');
  revealBtn.className = 'reveal-btn';
  revealBtn.textContent = 'Reveal Answer';
  container.appendChild(revealBtn);

  let selfAssessDiv = null;
  revealBtn.addEventListener('click', () => {
    revealArea.classList.remove('hidden');
    revealBtn.disabled = true;
    textarea.disabled = true;

    if (!selfAssessDiv) {
      selfAssessDiv = document.createElement('div');
      selfAssessDiv.className = 'self-assess';
      selfAssessDiv.innerHTML = `
        <div class="self-assess-label">How’d you do?</div>
        <div class="self-assess-buttons">
          <button class="self-btn self-correct">✓ I was correct</button>
          <button class="self-btn self-wrong">✗ I was wrong</button>
        </div>
      `;
      container.insertBefore(selfAssessDiv, revealArea.nextSibling);

      selfAssessDiv.querySelector('.self-correct').addEventListener('click', (e) => {
        e.target.style.opacity = '1';
        e.target.style.borderWidth = '2px';
        const wrongBtn = selfAssessDiv.querySelector('.self-wrong');
        wrongBtn.style.display = 'none';
        onAnswer(textarea.value, true);
        e.target.disabled = true;
        wrongBtn.disabled = true;
      });

      selfAssessDiv.querySelector('.self-wrong').addEventListener('click', (e) => {
        e.target.style.opacity = '1';
        e.target.style.borderWidth = '2px';
        const correctBtn = selfAssessDiv.querySelector('.self-correct');
        correctBtn.style.display = 'none';
        onAnswer(textarea.value, false);
        e.target.disabled = true;
        correctBtn.disabled = true;
      });
    }
  });
}

function disableSelfAssess(div) {
  div.querySelectorAll('button').forEach(b => b.disabled = true);
  div.style.pointerEvents = 'none';
}

function extractAnswer(container, q) {
  if (q.type === 'mcq') {
    const selected = container.querySelector('input[name="mcq-choice"]:checked');
    return selected ? selected.value : null; // value is the choice string now
  }
  if (q.type === 'true_false') {
    const sel = container.querySelector('.tf-btn.selected');
    return sel ? sel.dataset.value : null;
  }
  const ta = container.querySelector('textarea');
  return ta ? ta.value.trim() : null;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}