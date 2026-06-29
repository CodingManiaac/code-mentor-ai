"use client";

import { Copy, Check, User, Bot } from "lucide-react";
import { useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

interface Props {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export default function MessageBubble({
  role,
  content,
  isStreaming = false,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function copyMessage() {
    await navigator.clipboard.writeText(content);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
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
        </div>

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

      <div className="relative leading-relaxed">
        <MarkdownRenderer content={content} />

        {isStreaming && (
          <span className="inline-flex gap-1 items-center ml-1 text-indigo-400">
            <span className="h-4 w-1 bg-indigo-500 animate-pulse"></span>
          </span>
        )}
      </div>
    </div>
  );
}