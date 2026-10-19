import React, { useState, useEffect, useRef } from "react";
import { Check, X, HelpCircle, ArrowRight, Award, Zap, Timer, BookOpen } from "lucide-react";

interface Question {
  type: "MCQ" | "MSQ" | "TF" | "FITB" | "COP";
  question: string;
  options: string[];
  answer: string | string[];
  concept: string;
  hint: string;
  explanation: string;
}

interface QuizData {
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  questions: Question[];
}

interface InteractiveQuizProps {
  quizData: QuizData;
  chatId: string;
  onPointsUpdate?: (newScore: number, newLevel: number, newStreak: number) => void;
}

export default function InteractiveQuiz({ quizData, chatId, onPointsUpdate }: InteractiveQuizProps) {
  const { topic, difficulty, questions } = quizData;

  const [revisionMode, setRevisionMode] = useState(false);
  const [revisionSummary, setRevisionSummary] = useState("");
  const [quizStarted, setQuizStarted] = useState(false);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [selectedMSQOptions, setSelectedMSQOptions] = useState<string[]>([]);
  const [fitbInput, setFitbInput] = useState<string>("");
  
  const [answerLocked, setAnswerLocked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  
  // Timer States
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [submittingToDb, setSubmittingToDb] = useState(false);
  const [dbResult, setDbResult] = useState<any>(null);

  const currentQuestion = questions[currentIndex];

  // Start Timer when quiz starts
  useEffect(() => {
    if (quizStarted && !quizCompleted) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [quizStarted, quizCompleted]);

  // Load simulated revision notes
  const startRevision = () => {
    setRevisionMode(true);
    setRevisionSummary(
      `Quick Revision: ${topic} (${difficulty.toUpperCase()})\n\n` +
      `• Key Concepts: ${questions.map((q) => q.concept).filter((v, i, a) => a.indexOf(v) === i).join(", ")}\n` +
      `• Important Details: Pay attention to edge cases. Recall that ${difficulty === "easy" ? "basic syntax" : difficulty === "medium" ? "algorithmic rotations & node replacements" : "worst-case complexities and balancing factors"} apply.\n\n` +
      `Take a breath. When ready, click 'Start Quiz' to begin!`
    );
  };

  const handleMCQSelect = (option: string) => {
    if (answerLocked) return;
    const optionLetter = option.charAt(0); // e.g. "A"
    setSelectedOption(optionLetter);
    
    const correctLetter = String(currentQuestion.answer);
    const correct = optionLetter === correctLetter;
    setIsCorrect(correct);
    setAnswerLocked(true);

    const points = correct ? 10 : -5;
    
    setSubmissions((prev) => [
      ...prev,
      {
        questionIndex: currentIndex,
        question: currentQuestion.question,
        selectedOption: optionLetter,
        correctOption: correctLetter,
        isCorrect: correct ? 1 : 0,
        pointsEarned: points,
        concept: currentQuestion.concept,
      },
    ]);
  };

  const handleMSQToggle = (option: string) => {
    if (answerLocked) return;
    const letter = option.charAt(0);
    setSelectedMSQOptions((prev) =>
      prev.includes(letter) ? prev.filter((o) => o !== letter) : [...prev, letter]
    );
  };

  const submitMSQ = () => {
    if (answerLocked) return;
    const correctLetters = currentQuestion.answer as string[];
    
    // Check if sorted elements match
    const correct =
      selectedMSQOptions.length === correctLetters.length &&
      selectedMSQOptions.every((val) => correctLetters.includes(val));
    
    setIsCorrect(correct);
    setAnswerLocked(true);

    const points = correct ? 10 : -5;

    setSubmissions((prev) => [
      ...prev,
      {
        questionIndex: currentIndex,
        question: currentQuestion.question,
        selectedOption: selectedMSQOptions.join(","),
        correctOption: correctLetters.join(","),
        isCorrect: correct ? 1 : 0,
        pointsEarned: points,
        concept: currentQuestion.concept,
      },
    ]);
  };

  const submitFITB = () => {
    if (answerLocked) return;
    const cleanInput = fitbInput.trim().toLowerCase();
    const correctAns = String(currentQuestion.answer).trim().toLowerCase();
    
    const correct = cleanInput === correctAns;
    setIsCorrect(correct);
    setAnswerLocked(true);

    const points = correct ? 10 : -5;

    setSubmissions((prev) => [
      ...prev,
      {
        questionIndex: currentIndex,
        question: currentQuestion.question,
        selectedOption: fitbInput,
        correctOption: String(currentQuestion.answer),
        isCorrect: correct ? 1 : 0,
        pointsEarned: points,
        concept: currentQuestion.concept,
      },
    ]);
  };

  const nextQuestion = () => {
    // Reset state variables
    setSelectedOption("");
    setSelectedMSQOptions([]);
    setFitbInput("");
    setAnswerLocked(false);
    setIsCorrect(null);
    setShowHint(false);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setQuizCompleted(true);
      submitQuizResults();
    }
  };

  const submitQuizResults = async () => {
    setSubmittingToDb(true);
    try {
      const finalSubmissions = submissions.length === questions.length 
        ? submissions 
        : [
            ...submissions,
            // Fallback for any uncompleted steps
          ];

      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          topic,
          difficulty,
          timeTaken: timerSeconds,
          summary: `Completed ${topic} adaptive quiz (${difficulty}) with ${Math.round((submissions.filter(s => s.isCorrect === 1).length / questions.length) * 100)}% accuracy.`,
          submissions: finalSubmissions,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDbResult(data);
        if (onPointsUpdate && data) {
          onPointsUpdate(data.score, data.level, data.currentStreak);
        }
      }
    } catch (e) {
      console.error("Failed to submit quiz statistics:", e);
    } finally {
      setSubmittingToDb(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // 1. Splash Screen
  if (!quizStarted) {
    return (
      <div className="glass-panel border border-zinc-800/80 p-6 rounded-2xl max-w-xl mx-auto space-y-4 shadow-xl bg-zinc-950/40 text-zinc-200">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div className="flex items-center gap-2">
            <Award className="text-amber-500" size={20} />
            <h3 className="text-sm font-black tracking-wide text-white uppercase">{topic} Quiz</h3>
          </div>
          <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase">
            {difficulty}
          </span>
        </div>

        {revisionMode ? (
          <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-900 text-xs leading-relaxed space-y-3 whitespace-pre-line text-zinc-350">
            {revisionSummary}
            <button
              onClick={() => {
                setRevisionMode(false);
                setQuizStarted(true);
              }}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-xl font-bold text-xs text-white transition cursor-pointer"
            >
              Start Quiz Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Test your understanding of <strong className="text-white">{topic}</strong>! This quiz adapts in difficulty based on your accuracy history.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={startRevision}
                className="flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 py-3 rounded-xl font-bold text-xs text-zinc-350 transition cursor-pointer"
              >
                <BookOpen size={14} />
                5-Min Revision
              </button>
              <button
                onClick={() => setQuizStarted(true)}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold text-xs text-white transition cursor-pointer"
              >
                <Zap size={14} />
                Start Quiz
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Summary Screen (Completed)
  if (quizCompleted) {
    const totalXP = submissions.reduce((sum: number, s: any) => sum + s.pointsEarned, 0);
    const scoreText = totalXP >= 0 ? `+${totalXP}` : `${totalXP}`;
    const correctCount = submissions.filter((s: any) => s.isCorrect === 1).length;

    return (
      <div className="glass-panel border border-zinc-800/80 p-6 rounded-2xl max-w-xl mx-auto space-y-5 shadow-2xl bg-zinc-950/40 text-zinc-200 text-center animate-slide-up">
        <Award className="mx-auto text-amber-500 animate-bounce" size={48} />
        
        <div>
          <h3 className="text-lg font-black text-white">Quiz Completed!</h3>
          <p className="text-xxs text-zinc-500 mt-0.5 uppercase tracking-wider font-semibold">
            {topic} • {difficulty}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-zinc-900/50 border border-zinc-900 p-3 rounded-xl">
            <span className="text-[10px] font-bold text-zinc-500 block uppercase">Accuracy</span>
            <span className="text-lg font-black text-white font-mono">
              {Math.round((correctCount / questions.length) * 100)}%
            </span>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-900 p-3 rounded-xl">
            <span className="text-[10px] font-bold text-zinc-500 block uppercase">Time Taken</span>
            <span className="text-lg font-black text-white font-mono">{formatTime(timerSeconds)}</span>
          </div>
          <div className={`border p-3 rounded-xl ${totalXP >= 0 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
            <span className="text-[10px] font-bold text-zinc-500 block uppercase">Points</span>
            <span className={`text-lg font-black font-mono ${totalXP >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {scoreText} XP
            </span>
          </div>
        </div>

        {submittingToDb ? (
          <div className="text-xxs text-zinc-500 animate-pulse py-2">Syncing telemetry to Supermemory database...</div>
        ) : (
          dbResult && (
            <div className="bg-zinc-900/40 border border-zinc-900/50 p-4 rounded-xl text-left text-xxs text-zinc-400 space-y-2">
              <p className="font-bold text-white uppercase text-[9px] tracking-wider text-indigo-400">Telemetry Sync complete:</p>
              <div className="grid grid-cols-2 gap-1.5 font-mono">
                <div>• Current Level: <span className="text-white">{dbResult.level}</span></div>
                <div>• Total Score: <span className="text-white">{dbResult.score} XP</span></div>
                <div>• Topic Mastery: <span className="text-white">{dbResult.topicMastery}%</span></div>
                <div>• Current Streak: <span className="text-white">{dbResult.currentStreak} Days</span></div>
              </div>
              
              {Array.isArray(dbResult.newBadges) && dbResult.newBadges.length > 0 && (
                <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex flex-col gap-1">
                  <span className="text-amber-400 font-bold uppercase text-[9px]">🏆 UNLOCKED BADGES:</span>
                  {dbResult.newBadges.map((b: string) => (
                    <span key={b} className="text-white font-semibold">• {b}</span>
                  ))}
                </div>
              )}

              {/* Dynamic Certificate display */}
              {dbResult.topicMastery >= 90 && (
                <a
                  href={`/api/certificate/generate?topic=${encodeURIComponent(topic)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 flex items-center justify-center gap-1.5 w-full bg-amber-500 hover:bg-amber-600 text-black py-2 rounded-xl font-bold text-xs transition cursor-pointer shadow-lg"
                >
                  <Award size={13} />
                  Download Certificate of Mastery
                </a>
              )}
            </div>
          )
        )}
      </div>
    );
  }

  // 3. Question Screen
  return (
    <div className="glass-panel border border-zinc-800/80 p-5 rounded-2xl max-w-xl mx-auto space-y-4 shadow-xl bg-zinc-950/40 text-zinc-200 animate-slide-up">
      {/* Progress & Timer Header */}
      <div className="flex items-center justify-between text-xxs text-zinc-450 border-b border-zinc-900 pb-2.5">
        <span className="font-bold uppercase tracking-wider">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <div className="flex items-center gap-1 font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-800">
          <Timer size={11} className="text-zinc-500" />
          {formatTime(timerSeconds)}
        </div>
      </div>

      {/* Concept tag */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          Concept: {currentQuestion.concept}
        </span>
        <span className="text-[10px] font-black uppercase text-indigo-400 font-mono">
          {currentQuestion.type}
        </span>
      </div>

      {/* Question Text */}
      <p className="text-xs font-semibold leading-relaxed text-white">
        {currentQuestion.question}
      </p>

      {/* Question Options UI */}
      <div className="space-y-2.5 pt-1">
        {/* Render MCQ / TF options */}
        {(currentQuestion.type === "MCQ" || currentQuestion.type === "TF" || currentQuestion.type === "COP") &&
          (currentQuestion.options || (currentQuestion.type === "TF" ? ["A) True", "B) False"] : [])).map((opt) => {
            const letter = opt.charAt(0);
            const isSelected = selectedOption === letter;
            const isAnswerKey = String(currentQuestion.answer) === letter;
            
            let btnClass = "border-zinc-800 hover:border-zinc-700 bg-zinc-950/20";
            if (answerLocked) {
              if (isAnswerKey) btnClass = "border-emerald-500 bg-emerald-500/10 text-emerald-300";
              else if (isSelected) btnClass = "border-red-500 bg-red-500/10 text-red-300";
            } else if (isSelected) {
              btnClass = "border-indigo-500 bg-indigo-500/10 text-indigo-300";
            }

            return (
              <button
                key={opt}
                disabled={answerLocked}
                onClick={() => handleMCQSelect(opt)}
                className={`w-full text-left px-3.5 py-3 rounded-xl border text-xs font-medium transition cursor-pointer flex items-center justify-between ${btnClass}`}
              >
                <span>{opt}</span>
                {answerLocked && isAnswerKey && <Check className="text-emerald-500" size={14} />}
                {answerLocked && isSelected && !isAnswerKey && <X className="text-red-500" size={14} />}
              </button>
            );
          })}

        {/* Render MSQ (Multiple Select) options */}
        {currentQuestion.type === "MSQ" && (
          <div className="space-y-2.5">
            {(currentQuestion.options || []).map((opt) => {
              const letter = opt.charAt(0);
              const isChecked = selectedMSQOptions.includes(letter);
              const isCorrectPart = (currentQuestion.answer as string[]).includes(letter);

              let btnClass = "border-zinc-800 hover:border-zinc-700 bg-zinc-950/20";
              if (answerLocked) {
                if (isCorrectPart && isChecked) btnClass = "border-emerald-500 bg-emerald-500/10 text-emerald-300";
                else if (isChecked) btnClass = "border-red-500 bg-red-500/10 text-red-300";
                else if (isCorrectPart) btnClass = "border-emerald-500/40 bg-emerald-500/5 text-emerald-400/80";
              } else if (isChecked) {
                btnClass = "border-indigo-500 bg-indigo-500/10 text-indigo-300";
              }

              return (
                <button
                  key={opt}
                  disabled={answerLocked}
                  onClick={() => handleMSQToggle(opt)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl border text-xs font-medium transition cursor-pointer flex items-center justify-between ${btnClass}`}
                >
                  <span>{opt}</span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    readOnly
                    className="accent-indigo-500 h-3 w-3 rounded cursor-pointer pointer-events-none"
                  />
                </button>
              );
            })}
            {!answerLocked && (
              <button
                onClick={submitMSQ}
                className="w-full bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-xl font-bold text-xs text-white transition cursor-pointer"
              >
                Submit Answers
              </button>
            )}
          </div>
        )}

        {/* Render FITB (Fill in the Blank) Input */}
        {currentQuestion.type === "FITB" && (
          <div className="space-y-2.5">
            <input
              type="text"
              disabled={answerLocked}
              value={fitbInput}
              onChange={(e) => setFitbInput(e.target.value)}
              className={`w-full bg-zinc-900 border ${
                answerLocked 
                  ? isCorrect 
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                    : "border-red-500 bg-red-500/10 text-red-300"
                  : "border-zinc-800 focus:border-indigo-500"
              } rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition`}
              placeholder="Type your answer here..."
            />
            {answerLocked && (
              <div className="text-[10px] text-zinc-400">
                Correct Answer: <span className="font-mono text-emerald-400 font-bold">{String(currentQuestion.answer)}</span>
              </div>
            )}
            {!answerLocked && (
              <button
                onClick={submitFITB}
                className="w-full bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-xl font-bold text-xs text-white transition cursor-pointer"
              >
                Submit Answer
              </button>
            )}
          </div>
        )}
      </div>

      {/* Hints & Explanations Panel */}
      {answerLocked && (
        <div className="p-3.5 bg-zinc-900/40 border border-zinc-900/60 rounded-xl space-y-1.5 animate-fade-in">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            <HelpCircle size={11} className="text-zinc-500" />
            <span>Explanation</span>
          </div>
          <p className="text-xxs text-zinc-400 leading-relaxed leading-normal">
            {currentQuestion.explanation}
          </p>
        </div>
      )}

      {/* Buttons: Hint and Next */}
      <div className="flex justify-between items-center pt-2 border-t border-zinc-900">
        {!answerLocked ? (
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-zinc-500 hover:text-zinc-300 text-xxs font-bold uppercase tracking-wider flex items-center gap-1 transition cursor-pointer"
          >
            <HelpCircle size={12} />
            {showHint ? "Hide Hint" : "Need a Hint?"}
          </button>
        ) : (
          <div />
        )}

        {answerLocked && (
          <button
            onClick={nextQuestion}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
          >
            <span>{currentIndex + 1 === questions.length ? "Finish Quiz" : "Next Question"}</span>
            <ArrowRight size={13} />
          </button>
        )}
      </div>

      {showHint && !answerLocked && (
        <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-xxs text-indigo-400 leading-normal animate-slide-up">
          <strong>Hint:</strong> {currentQuestion.hint}
        </div>
      )}
    </div>
  );
}
