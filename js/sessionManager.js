export class SessionManager {
  constructor(items, { timerMinutes } = {}) {
    this.items = items;
    this.currentIndex = 0;
    this.answers = [];       // { questionId, userAnswer, isCorrect, topic, difficulty }
    this.startTime = Date.now();
    this.timerInterval = null;
    this.remainingSeconds = timerMinutes ? timerMinutes * 60 : null;
    this._onTick = null;
    this._onTimeUp = null;
  }

  getCurrentQuestion() {
    return this.items[this.currentIndex];
  }

  nextQuestion() {
    if (this.currentIndex < this.items.length - 1) {
      this.currentIndex++;
      return true;
    }
    return false;
  }

  isLastQuestion() {
    return this.currentIndex === this.items.length - 1;
  }

  /**
   * Record answer. May be called multiple times for the same question
   * (e.g. by handleAnswer and then Next). Only the first call with a definitive
   * isCorrect (or self-assess) is kept; subsequent calls are ignored.
   */
  recordAnswer(userAnswer, selfAssessCorrect) {
    // Check if this question already has an answer recorded
    const existing = this.answers[this.currentIndex];
    if (existing && existing.isCorrect !== null) {
      // Already recorded with a definitive correctness; ignore duplicates
      return;
    }

    const q = this.getCurrentQuestion();
    const answerText = userAnswer || '';

    let isCorrect;
    if (selfAssessCorrect !== undefined) {
      // Self-assessment provided (text questions)
        isCorrect = selfAssessCorrect;
    } else if (q.type === 'mcq' || q.type === 'true_false') {
      isCorrect = (answerText === q.answer);
    } else {
      // Text question with no self-assessment → treat as wrong (empty or skipped)
      isCorrect = false;
    }

    // Save answer at current index, overwriting if skip was recorded earlier
    this.answers[this.currentIndex] = {
      questionId: q.id,
      userAnswer: answerText,
      isCorrect,
      topic: q.topic,
      difficulty: q.difficulty
    };
  }

  startTimer(onTick, onTimeUp) {
    if (!this.remainingSeconds) return;
    this._onTick = onTick;
    this._onTimeUp = onTimeUp;
    onTick(this.remainingSeconds);
    this.timerInterval = setInterval(() => {
      this.remainingSeconds--;
      onTick(this.remainingSeconds);
      if (this.remainingSeconds <= 0) {
        this.stopTimer();
        onTimeUp();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  getResults() {
    const total = this.items.length;
    // Ensure every index has an answer entry (fill missing with skipped)
    while (this.answers.length < total) {
      this.answers.push({
        questionId: this.items[this.answers.length].id,
        userAnswer: '',
        isCorrect: false,
        topic: this.items[this.answers.length].topic,
        difficulty: this.items[this.answers.length].difficulty
      });
    }
    const correct = this.answers.filter(a => a.isCorrect === true).length;
    const duration = Math.floor((Date.now() - this.startTime) / 1000);
    return {
      total,
      correct,
      answered: this.answers.filter(a => a.userAnswer && a.userAnswer.trim() !== '').length,
      score: total > 0 ? Math.round((correct / total) * 100) : 0,
      duration,
      answers: this.answers
    };
  }
}