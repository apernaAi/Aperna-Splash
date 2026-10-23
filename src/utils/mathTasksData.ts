/**
 * Dynamic Daily Math Quiz Generator for Music Mimi ($MIMI) Protocol
 * 30 Math Quiz Tasks with operations: Addition (+), Subtraction (-), Multiplication (×), Division (÷)
 *
 * When daily reset occurs, the date changes and all 30 questions rotate to brand new,
 * freshly generated math questions deterministically seeded by the new calendar date.
 */

import { AirdropTask } from '../types/airdrop.ts';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Deterministic Pseudo-Random Number Generator based on Linear Congruential Generator
function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function createSeededRng(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Deterministic array shuffle using seeded RNG
function shuffleArray<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Generate 4 unique positive options including the correct answer
function buildUniqueOptions(correct: number, rng: () => number, spread: number = 10): number[] {
  const optionsSet = new Set<number>();
  optionsSet.add(correct);

  // Preferred offset deltas
  const deltas = [
    spread,
    -spread,
    spread * 2,
    -spread * 2,
    2,
    -2,
    3,
    -3,
    5,
    -5,
    1,
    -1,
    4,
    -4,
    spread + 2,
    spread - 2,
  ];

  const shuffledDeltas = shuffleArray(deltas, rng);

  for (const delta of shuffledDeltas) {
    if (optionsSet.size >= 4) break;
    const candidate = correct + delta;
    if (candidate > 0 && !optionsSet.has(candidate)) {
      optionsSet.add(candidate);
    }
  }

  // Fallback if needed
  let step = 1;
  while (optionsSet.size < 4) {
    const candidate = correct + step * (rng() > 0.5 ? 1 : -1) * Math.floor(rng() * 6 + 1);
    if (candidate > 0 && !optionsSet.has(candidate)) {
      optionsSet.add(candidate);
    }
    step++;
  }

  return shuffleArray(Array.from(optionsSet), rng);
}

interface GeneratedQuestion {
  question: string;
  options: number[];
  correctAnswer: number;
  operation: '+' | '-' | '×' | '÷';
  titleHi: string;
  titleEn: string;
  descHi: string;
  descEn: string;
}

function generateQuestionForIndex(index: number, dateStr: string): GeneratedQuestion {
  const seed = stringToSeed(`${dateStr}:math-task-${index}`);
  const rng = createSeededRng(seed);

  // 30 Tasks Distribution:
  // 0 - 7: Addition (+) [8 tasks]
  // 8 - 15: Subtraction (-) [8 tasks]
  // 16 - 22: Multiplication (×) [7 tasks]
  // 23 - 29: Division (÷) [7 tasks]

  if (index <= 7) {
    // Addition (+)
    const a = Math.floor(rng() * 85) + 20; // 20 to 104
    const b = Math.floor(rng() * 75) + 15; // 15 to 89
    const correct = a + b;
    const options = buildUniqueOptions(correct, rng, 10);
    const question = `${a} + ${b} = ?`;

    return {
      question,
      options,
      correctAnswer: correct,
      operation: '+',
      titleHi: `जोड़ क्विज: ${question}`,
      titleEn: `Addition Quiz: ${question}`,
      descHi: `सही जोड़ चुनकर 15 $MIMI जीतें! (1 मौका आज)`,
      descEn: `Add numbers correctly to win 15 $MIMI! (1 try today)`,
    };
  } else if (index <= 15) {
    // Subtraction (-)
    const b = Math.floor(rng() * 70) + 25; // 25 to 94
    const diff = Math.floor(rng() * 65) + 20; // 20 to 84
    const a = b + diff; // always a > b, so a - b = diff > 0
    const correct = diff;
    const options = buildUniqueOptions(correct, rng, 10);
    const question = `${a} - ${b} = ?`;

    return {
      question,
      options,
      correctAnswer: correct,
      operation: '-',
      titleHi: `घटाव क्विज: ${question}`,
      titleEn: `Subtract Quiz: ${question}`,
      descHi: `घटाव का सही उत्तर चुनकर 15 $MIMI अर्जित करें।`,
      descEn: `Pick the right subtraction answer to earn 15 $MIMI.`,
    };
  } else if (index <= 22) {
    // Multiplication (×)
    const a = Math.floor(rng() * 12) + 11; // 11 to 22
    const b = Math.floor(rng() * 8) + 3;  // 3 to 10
    const correct = a * b;
    const options = buildUniqueOptions(correct, rng, a);
    const question = `${a} × ${b} = ?`;

    return {
      question,
      options,
      correctAnswer: correct,
      operation: '×',
      titleHi: `गुणा क्विज: ${question}`,
      titleEn: `Multiply Quiz: ${question}`,
      descHi: `पहाड़े का सही जवाब दें और 15 $MIMI पाएं।`,
      descEn: `Solve the multiplication for 15 $MIMI.`,
    };
  } else {
    // Division (÷)
    const divisor = Math.floor(rng() * 11) + 4; // 4 to 14
    const quotient = Math.floor(rng() * 16) + 8; // 8 to 23
    const dividend = divisor * quotient; // always perfectly divisible
    const correct = quotient;
    const options = buildUniqueOptions(correct, rng, 2);
    const question = `${dividend} ÷ ${divisor} = ?`;

    return {
      question,
      options,
      correctAnswer: correct,
      operation: '÷',
      titleHi: `भाग क्विज: ${question}`,
      titleEn: `Division Quiz: ${question}`,
      descHi: `भागफल का सही उत्तर चुनकर 15 $MIMI क्लेम करें।`,
      descEn: `Solve the division correctly to claim 15 $MIMI.`,
    };
  }
}

/**
 * Generates all 30 math quiz tasks for a given calendar date.
 * When a new day comes or reset occurs, calling this produces 30 new, different questions!
 */
export function generateDailyMathQuizTasks(dateStr: string = getTodayDateString()): AirdropTask[] {
  const tasks: AirdropTask[] = [];

  for (let i = 0; i < 30; i++) {
    const id = `math-quiz-${i + 1}`;
    const q = generateQuestionForIndex(i, dateStr);

    tasks.push({
      id,
      category: 'math',
      subType: 'math',
      iconType: 'math',
      title: `${q.titleHi} (+15 $MIMI)`,
      titleEn: `${q.titleEn} (+15 $MIMI)`,
      description: q.descHi,
      descriptionEn: q.descEn,
      reward: 15,
      isCompleted: false,
      isDailyRepeatable: true,
      verificationType: 'auto',
      quizData: {
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        operation: q.operation,
        dateGenerated: dateStr,
      },
    });
  }

  return tasks;
}

// Default export of tasks generated for today's date
export const MATH_QUIZ_TASKS: AirdropTask[] = generateDailyMathQuizTasks();
