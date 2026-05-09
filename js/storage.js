/**
 * storage.js
 * Local persistence of weak spots (incorrect answers).
 */

const STORAGE_KEY = 'quizlab_weakspots';

/**
 * Save a list of answer objects from a completed session.
 * Only incorrect answers are recorded.
 *
 * @param {Array}  answers   – array of { questionId, isCorrect, topic, ... }
 * @param {string} classSlug
 */
export function saveWeakSpots(answers, classSlug) {
  const weakSpots = loadWeakSpots();

  if (!weakSpots[classSlug]) {
    weakSpots[classSlug] = {};
  }

  answers.forEach(a => {
    if (a.isCorrect === false) {
      const topic = a.topic || 'uncategorized';
      if (!weakSpots[classSlug][topic]) {
        weakSpots[classSlug][topic] = [];
      }
      if (!weakSpots[classSlug][topic].includes(a.questionId)) {
        weakSpots[classSlug][topic].push(a.questionId);
      }
    }
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(weakSpots));
}

/**
 * Retrieve all stored weak spots.
 * Format: { [classSlug]: { [topic]: [questionId, ...] } }
 */
export function loadWeakSpots() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Remove weak spots for a specific class, or all if no argument.
 */
export function clearWeakSpots(classSlug = null) {
  if (classSlug) {
    const spots = loadWeakSpots();
    delete spots[classSlug];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(spots));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}