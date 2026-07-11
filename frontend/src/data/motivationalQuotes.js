export const QUOTES = [
  {
    text: "The end of one chapter is the beginning of your next success.",
    subtitle: "Every topic mastered. Every mock completed. Every mistake corrected. Every day brings you closer to AIR.",
    tags: ['resilience', 'motivation'],
  },
  {
    text: "Discipline today becomes freedom tomorrow.",
    subtitle: "The choices you make now determine the ranks you see later.",
    tags: ['discipline', 'consistency'],
  },
  {
    text: "Small improvements every day create extraordinary results.",
    subtitle: "Consistency compounds. One more question, one more revision, one more step forward.",
    tags: ['consistency', 'discipline'],
  },
  {
    text: "Consistency beats motivation.",
    subtitle: "Motivation fades. Habits endure. Show up even when you don't feel like it.",
    tags: ['discipline', 'consistency'],
  },
  {
    text: "One more question solved is one step closer to AIR.",
    subtitle: "Every problem you solve today is a mark gained on exam day.",
    tags: ['focus', 'motivation'],
  },
  {
    text: "Every revision rewrites your future.",
    subtitle: "What you review today could be the difference between rank 1 and rank 100.",
    tags: ['focus', 'resilience'],
  },
  {
    text: "Dreams become ranks through daily effort.",
    subtitle: "Your AIR is not a wish — it is the sum of every hour you invest.",
    tags: ['motivation', 'discipline'],
  },
  {
    text: "Success is built long before results appear.",
    subtitle: "The work you do when no one is watching is what counts on result day.",
    tags: ['discipline', 'resilience'],
  },
  {
    text: "Focus on the process, not the outcome.",
    subtitle: "Master each topic. The rank will follow.",
    tags: ['focus', 'discipline'],
  },
  {
    text: "Your only competition is yesterday's version of yourself.",
    subtitle: "Compare your progress to where you started, not to anyone else.",
    tags: ['motivation', 'resilience'],
  },
  {
    text: "The best time to start was yesterday. The next best time is now.",
    subtitle: "Stop waiting for the perfect moment. Begin where you are with what you have.",
    tags: ['motivation', 'discipline'],
  },
  {
    text: "Pressure is a privilege.",
    subtitle: "The weight you feel means you care. Channel it into focused action.",
    tags: ['resilience', 'focus'],
  },
  {
    text: "Every mistake is a lesson in disguise.",
    subtitle: "Analyze your errors. Each one is a stepping stone to mastery.",
    tags: ['resilience', 'mistakes'],
  },
  {
    text: "Your future self will thank you for today's effort.",
    subtitle: "The sacrifice of now is the reward of tomorrow. Keep going.",
    tags: ['motivation', 'discipline'],
  },
  {
    text: "The only way out is through.",
    subtitle: "There are no shortcuts to AIR. Study hard, stay consistent, trust the process.",
    tags: ['resilience', 'motivation'],
  },
];

const TAG_INDEX = {};
QUOTES.forEach((q, i) => {
  q.tags.forEach((t) => {
    if (!TAG_INDEX[t]) TAG_INDEX[t] = [];
    TAG_INDEX[t].push(i);
  });
});

function hashDate(dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getDailyQuote() {
  const today = new Date().toDateString();
  const index = hashDate(today) % QUOTES.length;
  return QUOTES[index];
}

export function getQuoteForContext(context = {}) {
  const { streak, mockCompleted, isResult } = context;

  if (isResult) {
    return QUOTES.find((q) => q.tags.includes('resilience') && q.tags.includes('mistakes'))
      || QUOTES.find((q) => q.tags.includes('resilience'))
      || getDailyQuote();
  }

  if (typeof streak === 'number') {
    if (streak === 0) {
      return QUOTES.find((q) => q.tags.includes('discipline'))
        || getDailyQuote();
    }
    if (streak >= 7) {
      return QUOTES.find((q) => q.tags.includes('consistency'))
        || getDailyQuote();
    }
  }

  if (mockCompleted === true) {
    return QUOTES.find((q) => q.tags.includes('focus'))
      || getDailyQuote();
  }

  return getDailyQuote();
}

export function getRandomQuote() {
  return getDailyQuote();
}
