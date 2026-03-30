import { useState, useMemo, useCallback } from 'react';
import { drugs } from '../data/drugs';

// ─────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────
const FONTS = { heading: 'Manrope, sans-serif', body: 'IBM Plex Sans, sans-serif' };
const C = {
  primary: '#1B3A6B',
  accent: '#00A99D',
  safe: '#10B981',
  caution: '#F59E0B',
  critical: '#EF4444',
  surface: '#F4F6F9',
};

const CATEGORIES = [
  'All',
  'Pain / Opioids',
  'Diabetes',
  'Insulins',
  'Cardiac / BP',
  'Anticoagulants',
  'GI / Cholesterol / Anti-inflammatory',
  'Respiratory / Antibiotics / Antiemetics',
  'Mental Health / Sedatives / Epilepsy',
  'Other',
];

const CATEGORY_EMOJI = {
  'All': '💊',
  'Pain / Opioids': '😮‍💨',
  'Diabetes': '🩸',
  'Insulins': '💉',
  'Cardiac / BP': '❤️',
  'Anticoagulants': '🩺',
  'GI / Cholesterol / Anti-inflammatory': '🫃',
  'Respiratory / Antibiotics / Antiemetics': '🫁',
  'Mental Health / Sedatives / Epilepsy': '🧠',
  'Other': '🔵',
};

const Q_COUNTS = [5, 10, 15, 20];

// ─────────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────────
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const pickRandom = (arr, n, exclude = []) => {
  const pool = arr.filter((x) => !exclude.includes(x));
  return shuffle(pool).slice(0, n);
};

const uniqueValues = (arr) => [...new Set(arr)];

// ─────────────────────────────────────────────────────────────
// Question generators
// ─────────────────────────────────────────────────────────────

/** Q-type 1: What schedule is this drug? */
const genScheduleQ = (drug, allDrugs) => {
  if (!drug.schedule) return null;
  const correctAnswer = drug.schedule;
  const allSchedules = uniqueValues(allDrugs.map((d) => d.schedule).filter(Boolean));
  const distractors = pickRandom(allSchedules, 3, [correctAnswer]);
  if (distractors.length < 3) return null;
  return {
    type: 'schedule',
    question: `What schedule is ${drug.genericName}?`,
    context: drug.drugClass,
    correctAnswer,
    options: shuffle([correctAnswer, ...distractors]),
    drugId: drug.id,
  };
};

/** Q-type 2: Which brand name belongs to this drug? */
const genBrandQ = (drug, allDrugs) => {
  if (!drug.brandNames || drug.brandNames.length === 0) return null;
  const correctAnswer = drug.brandNames[0];
  const allBrands = allDrugs
    .filter((d) => d.id !== drug.id && d.brandNames && d.brandNames.length > 0)
    .map((d) => d.brandNames[0]);
  const distractors = pickRandom(allBrands, 3, [correctAnswer]);
  if (distractors.length < 3) return null;
  return {
    type: 'brand',
    question: `Which brand name belongs to ${drug.genericName}?`,
    context: drug.drugClass,
    correctAnswer,
    options: shuffle([correctAnswer, ...distractors]),
    drugId: drug.id,
  };
};

/** Q-type 3: Hold if — which drug has this hold condition? */
const genHoldQ = (drug, allDrugs) => {
  if (!drug.holdIf || drug.holdIf.length === 0) return null;
  const holdCondition = drug.holdIf[Math.floor(Math.random() * drug.holdIf.length)];
  const correctAnswer = drug.genericName;
  const distractors = pickRandom(
    allDrugs.filter((d) => d.id !== drug.id).map((d) => d.genericName),
    3,
    [correctAnswer]
  );
  if (distractors.length < 3) return null;
  return {
    type: 'holdIf',
    question: `Which drug should be held if: "${holdCondition}"?`,
    context: null,
    correctAnswer,
    options: shuffle([correctAnswer, ...distractors]),
    drugId: drug.id,
  };
};

/** Q-type 4: Drug class identification */
const genClassQ = (drug, allDrugs) => {
  if (!drug.drugClass) return null;
  const correctAnswer = drug.genericName;
  const distractors = pickRandom(
    allDrugs.filter((d) => d.id !== drug.id && d.drugClass !== drug.drugClass).map((d) => d.genericName),
    3,
    [correctAnswer]
  );
  if (distractors.length < 3) return null;
  return {
    type: 'class',
    question: `Which drug belongs to the class: "${drug.drugClass}"?`,
    context: drug.category,
    correctAnswer,
    options: shuffle([correctAnswer, ...distractors]),
    drugId: drug.id,
  };
};

/** Q-type 5: Red flag recognition */
const genRedFlagQ = (drug, allDrugs) => {
  if (!drug.redFlags || drug.redFlags.length === 0) return null;
  const redFlag = drug.redFlags[Math.floor(Math.random() * drug.redFlags.length)];
  const correctAnswer = drug.genericName;
  const distractors = pickRandom(
    allDrugs.filter((d) => d.id !== drug.id).map((d) => d.genericName),
    3,
    [correctAnswer]
  );
  if (distractors.length < 3) return null;
  return {
    type: 'redFlag',
    question: `Which drug is associated with this red flag?`,
    context: `⚠️ "${redFlag}"`,
    correctAnswer,
    options: shuffle([correctAnswer, ...distractors]),
    drugId: drug.id,
  };
};

const GENERATORS = [genScheduleQ, genBrandQ, genHoldQ, genClassQ, genRedFlagQ];

const TYPE_LABELS = {
  schedule: '📋 Schedule',
  brand: '🏷️ Brand Name',
  holdIf: '⛔ Hold If',
  class: '🔬 Drug Class',
  redFlag: '🚨 Red Flag',
};

/** Build a quiz question bank from filtered drugs */
const buildQuestions = (filteredDrugs, allDrugs, count) => {
  const candidates = [];
  const shuffledDrugs = shuffle(filteredDrugs);
  for (const drug of shuffledDrugs) {
    const shuffledGens = shuffle(GENERATORS);
    for (const gen of shuffledGens) {
      const q = gen(drug, allDrugs);
      if (q) candidates.push(q);
    }
  }
  return shuffle(candidates).slice(0, count);
};

// ─────────────────────────────────────────────────────────────
// Performance badge
// ─────────────────────────────────────────────────────────────
const performanceBadge = (pct) => {
  if (pct >= 90) return { label: 'Excellent! 🌟', color: C.safe, bg: '#10B98120' };
  if (pct >= 70) return { label: 'Good Work 👍', color: '#3B82F6', bg: '#3B82F620' };
  if (pct >= 50) return { label: 'Getting There 💪', color: C.caution, bg: '#F59E0B20' };
  return { label: 'Needs Practice 📖', color: C.critical, bg: '#EF444420' };
};

// ─────────────────────────────────────────────────────────────
// QuizHome — category + count selection
// ─────────────────────────────────────────────────────────────
export const QuizHome = ({ onStart }) => {
  const [category, setCategory] = useState('All');
  const [count, setCount] = useState(10);

  const availableDrugs = useMemo(
    () => (category === 'All' ? drugs : drugs.filter((d) => d.category === category)),
    [category]
  );

  const maxQuestions = Math.min(availableDrugs.length * GENERATORS.length, 20);
  const validCounts = Q_COUNTS.filter((n) => n <= maxQuestions);
  const safeCount = validCounts.includes(count) ? count : validCounts[validCounts.length - 1] || 5;

  return (
    <div className="flex flex-col h-full bg-[#F4F6F9]" style={{ maxWidth: '448px', margin: '0 auto' }}>
      {/* Header */}
      <div className="bg-white px-5 pt-8 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">🧠</span>
          <div>
            <h1 className="text-2xl font-bold text-[#1B3A6B]" style={{ fontFamily: FONTS.heading }}>
              Quiz Mode
            </h1>
            <p className="text-sm text-gray-400" style={{ fontFamily: FONTS.body }}>
              Test your drug knowledge
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        {/* Category picker */}
        <div>
          <h2
            className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3"
            style={{ fontFamily: FONTS.body }}
          >
            Choose Category
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <button
                  key={cat}
                  data-testid={`category-btn-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => setCategory(cat)}
                  className="flex items-center gap-2 px-3 py-3 rounded-2xl text-left transition-all"
                  style={{
                    minHeight: '48px',
                    background: active ? C.primary : '#FFFFFF',
                    border: `1.5px solid ${active ? C.primary : '#E5E7EB'}`,
                    fontFamily: FONTS.body,
                  }}
                >
                  <span className="text-base flex-shrink-0">{CATEGORY_EMOJI[cat]}</span>
                  <span
                    className="text-xs font-semibold leading-tight"
                    style={{ color: active ? '#FFFFFF' : '#374151' }}
                  >
                    {cat}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Question count */}
        <div>
          <h2
            className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3"
            style={{ fontFamily: FONTS.body }}
          >
            Number of Questions
          </h2>
          <div className="flex gap-3">
            {Q_COUNTS.map((n) => {
              const disabled = n > maxQuestions;
              const active = safeCount === n && !disabled;
              return (
                <button
                  key={n}
                  data-testid={`count-btn-${n}`}
                  onClick={() => !disabled && setCount(n)}
                  disabled={disabled}
                  className="flex-1 py-3 rounded-full text-sm font-bold transition-all"
                  style={{
                    minHeight: '48px',
                    background: active ? C.accent : disabled ? '#F4F6F9' : '#FFFFFF',
                    color: active ? '#FFFFFF' : disabled ? '#D1D5DB' : C.primary,
                    border: `1.5px solid ${active ? C.accent : disabled ? '#E5E7EB' : '#E5E7EB'}`,
                    fontFamily: FONTS.heading,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pool info */}
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: '#1B3A6B10', border: '1px solid #1B3A6B20' }}
        >
          <span className="text-xl">💊</span>
          <p className="text-xs text-[#1B3A6B]" style={{ fontFamily: FONTS.body }}>
            <strong>{availableDrugs.length} drugs</strong> in pool · up to{' '}
            <strong>{maxQuestions} questions</strong> available
          </p>
        </div>

        {/* Start button */}
        <button
          data-testid="start-quiz-btn"
          onClick={() => onStart(category, safeCount)}
          className="w-full rounded-full py-4 text-base font-bold text-white transition-opacity active:opacity-80"
          style={{
            background: C.primary,
            fontFamily: FONTS.heading,
            minHeight: '56px',
          }}
        >
          Start Quiz →
        </button>

        <div className="h-4" />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// QuizQuestion — single question view
// ─────────────────────────────────────────────────────────────
export const QuizQuestion = ({ question, index, total, onAnswer, answered }) => {
  const [selected, setSelected] = useState(null);

  const handleSelect = (option) => {
    if (answered) return;
    setSelected(option);
    onAnswer(option);
  };

  const isCorrect = selected === question.correctAnswer;

  const optionStyle = (option) => {
    if (!selected) {
      return {
        background: '#FFFFFF',
        border: '1.5px solid #E5E7EB',
        color: '#1F2937',
      };
    }
    if (option === question.correctAnswer) {
      return {
        background: '#10B98115',
        border: `2px solid ${C.safe}`,
        color: C.safe,
      };
    }
    if (option === selected) {
      return {
        background: '#EF444415',
        border: `2px solid ${C.critical}`,
        color: C.critical,
      };
    }
    return {
      background: '#F9FAFB',
      border: '1.5px solid #E5E7EB',
      color: '#9CA3AF',
    };
  };

  const optionIcon = (option) => {
    if (!selected) return null;
    if (option === question.correctAnswer) return '✓';
    if (option === selected) return '✗';
    return null;
  };

  const progress = ((index) / total) * 100;

  return (
    <div className="flex flex-col h-full bg-[#F4F6F9]" style={{ maxWidth: '448px', margin: '0 auto' }}>
      {/* Progress header */}
      <div className="bg-white px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{
              background: '#1B3A6B15',
              color: C.primary,
              fontFamily: FONTS.body,
            }}
          >
            {TYPE_LABELS[question.type]}
          </span>
          <span
            className="text-xs font-semibold text-gray-400"
            style={{ fontFamily: FONTS.body }}
          >
            {index + 1} / {total}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            data-testid="progress-bar"
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${C.accent}, #1B3A6B)`,
            }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {/* Context chip */}
        {question.context && (
          <div
            className="inline-block mb-4 px-3 py-1.5 rounded-xl text-xs font-medium"
            style={{
              background: '#00A99D15',
              color: C.accent,
              fontFamily: FONTS.body,
            }}
          >
            {question.context}
          </div>
        )}

        <h2
          data-testid="question-text"
          className="text-lg font-bold text-[#1B3A6B] leading-snug mb-6"
          style={{ fontFamily: FONTS.heading }}
        >
          {question.question}
        </h2>

        {/* Answer options */}
        <div className="space-y-3" role="group" aria-label="Answer options">
          {question.options.map((option, i) => (
            <button
              key={option}
              data-testid={`answer-option-${i}`}
              onClick={() => handleSelect(option)}
              disabled={!!selected}
              className="w-full px-4 py-3.5 rounded-2xl text-left font-semibold transition-all flex items-center justify-between gap-3"
              style={{
                minHeight: '56px',
                fontFamily: FONTS.body,
                fontSize: '14px',
                cursor: selected ? 'default' : 'pointer',
                ...optionStyle(option),
              }}
              aria-pressed={selected === option}
            >
              <span className="flex-1 leading-snug">{option}</span>
              {optionIcon(option) && (
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{
                    background: option === question.correctAnswer ? C.safe : C.critical,
                  }}
                >
                  {optionIcon(option)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Feedback */}
        {selected && (
          <div
            data-testid="answer-feedback"
            className="mt-5 rounded-2xl px-4 py-3"
            style={{
              background: isCorrect ? '#10B98115' : '#EF444415',
              border: `1px solid ${isCorrect ? C.safe : C.critical}40`,
            }}
          >
            <p
              className="text-sm font-bold mb-0.5"
              style={{ color: isCorrect ? C.safe : C.critical, fontFamily: FONTS.heading }}
            >
              {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            </p>
            {!isCorrect && (
              <p className="text-xs text-gray-600" style={{ fontFamily: FONTS.body }}>
                The correct answer is <strong>{question.correctAnswer}</strong>
              </p>
            )}
          </div>
        )}

        <div className="h-24" />
      </div>

      {/* Next button — appears after answering */}
      {selected && (
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-3 bg-gradient-to-t from-[#F4F6F9] via-[#F4F6F9]"
          style={{ maxWidth: '448px', margin: '0 auto' }}
        >
          <button
            data-testid="next-btn"
            onClick={() => onAnswer(selected, true)}
            className="w-full rounded-full py-3.5 text-sm font-bold text-white transition-opacity active:opacity-80"
            style={{
              background: C.primary,
              fontFamily: FONTS.heading,
              minHeight: '52px',
            }}
          >
            {index + 1 >= total ? 'See Results →' : 'Next Question →'}
          </button>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// QuizResults — score + review
// ─────────────────────────────────────────────────────────────
export const QuizResults = ({ questions, answers, onRetry, onNewQuiz }) => {
  const score = answers.filter((a, i) => a === questions[i].correctAnswer).length;
  const total = questions.length;
  const pct = Math.round((score / total) * 100);
  const badge = performanceBadge(pct);

  return (
    <div className="flex flex-col h-full bg-[#F4F6F9]" style={{ maxWidth: '448px', margin: '0 auto' }}>
      {/* Header */}
      <div className="bg-white px-5 pt-8 pb-5 border-b border-gray-100 flex-shrink-0">
        <h1
          className="text-xl font-bold text-[#1B3A6B] mb-1"
          style={{ fontFamily: FONTS.heading }}
        >
          Quiz Complete!
        </h1>

        {/* Score */}
        <div
          data-testid="score-display"
          className="flex items-end gap-3 mt-4"
        >
          <span
            className="text-6xl font-bold"
            style={{ fontFamily: FONTS.heading, color: C.primary, lineHeight: 1 }}
          >
            {score}
          </span>
          <div className="pb-1">
            <span className="text-2xl text-gray-300 font-bold" style={{ fontFamily: FONTS.heading }}>
              / {total}
            </span>
          </div>
          <div
            className="ml-auto px-3 py-2 rounded-2xl text-sm font-bold text-center"
            style={{
              background: badge.bg,
              color: badge.color,
              fontFamily: FONTS.heading,
              minWidth: '80px',
            }}
            data-testid="performance-badge"
          >
            <div className="text-2xl font-black" style={{ fontFamily: FONTS.heading }}>
              {pct}%
            </div>
            <div style={{ fontSize: '11px' }}>{badge.label}</div>
          </div>
        </div>

        {/* Score bar */}
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mt-4">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${badge.color}, ${C.primary})`,
              transition: 'width 0.8s ease',
            }}
          />
        </div>
      </div>

      {/* Review list */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <h2
          className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3"
          style={{ fontFamily: FONTS.body }}
        >
          Question Review
        </h2>

        <div className="space-y-2 mb-6">
          {questions.map((q, i) => {
            const userAnswer = answers[i];
            const correct = userAnswer === q.correctAnswer;
            return (
              <div
                key={i}
                data-testid={`review-item-${i}`}
                className="bg-white rounded-2xl px-4 py-3"
                style={{ border: `1px solid ${correct ? C.safe : C.critical}25` }}
              >
                <div className="flex items-start gap-2">
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5"
                    style={{ background: correct ? C.safe : C.critical }}
                  >
                    {correct ? '✓' : '✗'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-bold mb-0.5"
                      style={{ color: '#6B7280', fontFamily: FONTS.body }}
                    >
                      {TYPE_LABELS[q.type]}
                    </p>
                    <p
                      className="text-sm font-semibold text-[#1B3A6B] leading-snug"
                      style={{ fontFamily: FONTS.body }}
                    >
                      {q.question.length > 70 ? q.question.slice(0, 70) + '…' : q.question}
                    </p>
                    {!correct && (
                      <p className="text-xs mt-1" style={{ fontFamily: FONTS.body, color: C.critical }}>
                        Your answer: <span className="font-semibold">{userAnswer || '—'}</span>
                      </p>
                    )}
                    <p
                      className="text-xs mt-0.5"
                      style={{ fontFamily: FONTS.body, color: correct ? C.safe : '#6B7280' }}
                    >
                      {correct ? '' : 'Correct: '}
                      <span className="font-semibold">{q.correctAnswer}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="space-y-3 pb-6">
          <button
            data-testid="retry-btn"
            onClick={onRetry}
            className="w-full rounded-full py-3.5 text-sm font-bold text-white transition-opacity active:opacity-80"
            style={{ background: C.primary, fontFamily: FONTS.heading, minHeight: '52px' }}
          >
            Retry Same Settings 🔄
          </button>
          <button
            data-testid="new-quiz-btn"
            onClick={onNewQuiz}
            className="w-full rounded-full py-3.5 text-sm font-bold transition-opacity active:opacity-80"
            style={{
              background: '#FFFFFF',
              border: `2px solid ${C.primary}`,
              color: C.primary,
              fontFamily: FONTS.heading,
              minHeight: '52px',
            }}
          >
            New Quiz ✨
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// QuizPage — orchestrator
// ─────────────────────────────────────────────────────────────
const SCREENS = { HOME: 'home', QUESTION: 'question', RESULTS: 'results' };

const QuizPage = () => {
  const [screen, setScreen] = useState(SCREENS.HOME);
  const [quizSettings, setQuizSettings] = useState({ category: 'All', count: 10 });
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [awaitingNext, setAwaitingNext] = useState(false);

  const startQuiz = useCallback((category, count) => {
    const pool = category === 'All' ? drugs : drugs.filter((d) => d.category === category);
    const qs = buildQuestions(pool, drugs, count);
    if (qs.length === 0) return;
    setQuizSettings({ category, count });
    setQuestions(qs);
    setCurrentIndex(0);
    setAnswers([]);
    setAwaitingNext(false);
    setScreen(SCREENS.QUESTION);
  }, []);

  const handleAnswer = useCallback(
    (selectedOption, isNext = false) => {
      if (isNext) {
        // Advance to next question or results
        if (currentIndex + 1 >= questions.length) {
          setScreen(SCREENS.RESULTS);
        } else {
          setCurrentIndex((i) => i + 1);
          setAwaitingNext(false);
        }
        return;
      }
      // Record answer
      setAnswers((prev) => {
        const next = [...prev];
        next[currentIndex] = selectedOption;
        return next;
      });
      setAwaitingNext(true);
    },
    [currentIndex, questions.length]
  );

  const handleRetry = useCallback(() => {
    startQuiz(quizSettings.category, quizSettings.count);
  }, [quizSettings, startQuiz]);

  const handleNewQuiz = useCallback(() => {
    setScreen(SCREENS.HOME);
  }, []);

  if (screen === SCREENS.HOME) {
    return <QuizHome onStart={startQuiz} />;
  }

  if (screen === SCREENS.QUESTION && questions[currentIndex]) {
    return (
      <div className="relative h-full">
        <QuizQuestion
          key={`${currentIndex}-${questions[currentIndex].drugId}`}
          question={questions[currentIndex]}
          index={currentIndex}
          total={questions.length}
          onAnswer={handleAnswer}
          answered={awaitingNext}
        />
      </div>
    );
  }

  if (screen === SCREENS.RESULTS) {
    return (
      <QuizResults
        questions={questions}
        answers={answers}
        onRetry={handleRetry}
        onNewQuiz={handleNewQuiz}
      />
    );
  }

  return null;
};

export default QuizPage;
