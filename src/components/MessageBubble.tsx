"use client";

import { Copy, Check, User, Bot, Volume2, VolumeX, Code, ArrowRight } from "lucide-react";
import { useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer";
import InteractiveQuiz from "./chat/InteractiveQuiz";

interface Props {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  messageId?: string;
  isSpeaking?: boolean;
  onSpeakToggle?: (messageId: string, text: string) => void;
  chatId?: string | null;
  onPointsUpdate?: (newScore: number, newLevel: number, newStreak: number) => void;
}

export default function MessageBubble({
  role,
  content,
  isStreaming = false,
  messageId,
  isSpeaking = false,
  onSpeakToggle,
  chatId,
  onPointsUpdate,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function copyMessage() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  // Parse quiz structures from text content
  let parsedQuizData: any = null;
  let cleanContent = content;

  if (content.includes("<quiz>")) {
    let quizText = content.split("<quiz>")[1] || "";
    if (quizText.includes("</quiz>")) {
      quizText = quizText.split("</quiz>")[0];
    } else {
      // Incomplete block, try to make it valid JSON by adding closing braces/brackets
      const lastQuestionClose = quizText.lastIndexOf("}");
      if (lastQuestionClose !== -1) {
        quizText = quizText.slice(0, lastQuestionClose + 1) + "\n]\n}";
      }
    }

    try {
      const cleanedJson = quizText
        .trim()
        .replace(/,\s*\]/, "]")
        .replace(/,\s*\}/, "}");
      
      const parsed = JSON.parse(cleanedJson);
      if (parsed && parsed.questions && parsed.questions.length > 0) {
        parsedQuizData = parsed;
        cleanContent = content.split("<quiz>")[0];
      }
    } catch (e) {
      console.warn("Quiz JSON recovery failed:", e);
    }
  }

  // Parse challenge structures from text content
  let parsedChallengeData: any = null;
  
  if (content.includes("<challenge>")) {
    let challengeText = content.split("<challenge>")[1] || "";
    if (challengeText.includes("</challenge>")) {
      challengeText = challengeText.split("</challenge>")[0];
    } else {
      const lastClose = challengeText.lastIndexOf("}");
      if (lastClose !== -1) {
        challengeText = challengeText.slice(0, lastClose + 1);
      }
    }

    try {
      const parsed = JSON.parse(challengeText.trim());
      if (parsed && parsed.title && parsed.starterCode) {
        parsedChallengeData = parsed;
        cleanContent = content.split("<challenge>")[0];
      }
    } catch (e) {
      console.warn("Challenge JSON recovery failed:", e);
    }
  }

  if (role !== "assistant") {
    return (
      <div className="ml-auto max-w-3xl rounded-2xl border border-indigo-500/20 bg-indigo-950/20 px-6 py-4 text-zinc-150 shadow-md backdrop-blur-md animate-slide-up">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
          <User size={14} />
          <span>You</span>
        </div>
        <div className="text-zinc-100 whitespace-pre-wrap leading-relaxed">{content}</div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-zinc-800/60 bg-zinc-900/30 px-6 py-5 shadow-lg backdrop-blur-md animate-slide-up">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
          <Bot size={14} />
          <span>CodeMentor AI</span>
          
          {/* Animated sound wave during active TTS speech */}
          {isSpeaking && (
            <div className="flex items-end gap-0.5 h-3 px-1">
              <span className="w-[1.5px] bg-purple-400 rounded-full animate-audio-bar-1 h-1"></span>
              <span className="w-[1.5px] bg-purple-400 rounded-full animate-audio-bar-2 h-2.5"></span>
              <span className="w-[1.5px] bg-purple-400 rounded-full animate-audio-bar-3 h-1.5"></span>
              <span className="w-[1.5px] bg-purple-400 rounded-full animate-audio-bar-4 h-0.5"></span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onSpeakToggle && messageId && (
            <button
              onClick={() => onSpeakToggle(messageId, content)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/40 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition cursor-pointer"
              title={isSpeaking ? "Stop Voice" : "Listen to Explanation"}
            >
              {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
              <span>{isSpeaking ? "Stop" : "Listen"}</span>
            </button>
          )}

          <button
            onClick={copyMessage}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all duration-200"
          >
            {copied ? (
              <>
                <Check size={13} />
                Copied
              </>
            ) : (
              <>
                <Copy size={13} />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      <div className="relative leading-relaxed">
        {cleanContent.trim() && <MarkdownRenderer content={cleanContent} />}
        
        {parsedQuizData && chatId && (
          <div className="mt-4">
            <InteractiveQuiz 
              quizData={parsedQuizData} 
              chatId={chatId} 
              onPointsUpdate={onPointsUpdate} 
            />
          </div>
        )}

        {parsedChallengeData && (
          <div className="mt-5 p-5 bg-zinc-950/40 border border-zinc-800/80 rounded-2xl max-w-xl mx-auto space-y-4 shadow-xl text-zinc-200 animate-slide-up">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                  <Code size={14} />
                </span>
                <h4 className="text-xs font-black uppercase tracking-wider text-white">Coding Challenge</h4>
              </div>
              <span className="text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase">
                {parsedChallengeData.difficulty || "medium"}
              </span>
            </div>

            <div className="space-y-1">
              <h5 className="text-xs font-bold text-white">{parsedChallengeData.title}</h5>
              <p className="text-xxs text-zinc-400 leading-normal line-clamp-3">{parsedChallengeData.description}</p>
            </div>

            <button
              onClick={() => {
                localStorage.setItem("sandbox_code", parsedChallengeData.starterCode);
                localStorage.setItem("sandbox_title", parsedChallengeData.title);
                localStorage.setItem("sandbox_language", "javascript");
                window.open("/sandbox", "_blank");
              }}
              className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow-md"
            >
              <span>Solve Challenge in Sandbox</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}

        {isStreaming && (
          <span className="inline-flex gap-1 items-center ml-1 text-indigo-400">
            <span className="h-4 w-1 bg-indigo-500 animate-pulse"></span>
          </span>
        )}
      </div>
    </div>
  );
}