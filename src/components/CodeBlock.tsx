"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeBlockProps {
  language?: string;
  code: string;
}

export default function CodeBlock({
  language = "text",
  code,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [copiedPatch, setCopiedPatch] = useState(false);
  const [copiedFinal, setCopiedFinal] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  // Parse raw diff into final corrected source code by stripping deleted lines and prefixes
  function getFinalCode(rawDiff: string): string {
    const lines = rawDiff.split("\n");
    const finalLines: string[] = [];
    
    for (const line of lines) {
      if (
        line.startsWith("diff --git") ||
        line.startsWith("index ") ||
        line.startsWith("--- ") ||
        line.startsWith("+++ ") ||
        line.startsWith("@@ ")
      ) {
        continue;
      }
      
      if (line.startsWith("+")) {
        finalLines.push(line.slice(1));
      } else if (line.startsWith("-")) {
        continue;
      } else {
        if (line.startsWith(" ")) {
          finalLines.push(line.slice(1));
        } else {
          finalLines.push(line);
        }
      }
    }
    
    return finalLines.join("\n");
  }

  if (language === "diff" || language === "diff-patch") {
    const lines = code.split("\n");
    const finalCode = getFinalCode(code);

    return (
      <div className="my-5 overflow-hidden rounded-xl border border-zinc-800 bg-[#0d1117] shadow-lg animate-slide-up">
        {/* Diff Header Panel */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold uppercase tracking-wider text-zinc-400">
              Interactive Code Diff
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Action 1: Copy Diff Patch */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(code);
                setCopiedPatch(true);
                setTimeout(() => setCopiedPatch(false), 2000);
              }}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-md transition flex items-center gap-1.5 cursor-pointer font-medium"
              title="Copy the raw diff file patch"
            >
              {copiedPatch ? <Check size={12} /> : <Copy size={12} />}
              {copiedPatch ? "Patch Copied" : "Copy Patch"}
            </button>

            {/* Action 2: Copy Final Corrected Code */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(finalCode);
                setCopiedFinal(true);
                setTimeout(() => setCopiedFinal(false), 2000);
              }}
              className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-md transition flex items-center gap-1.5 cursor-pointer font-medium"
              title="Extract and copy the final corrected code block"
            >
              {copiedFinal ? <Check size={12} /> : <Copy size={12} />}
              {copiedFinal ? "Code Copied" : "Copy Corrected"}
            </button>

            {/* Action 3: Open Corrected Code in Sandbox */}
            <button
              onClick={() => {
                localStorage.setItem("sandbox_code", finalCode);
                localStorage.setItem("sandbox_title", "Git Diff Corrected Code");
                localStorage.setItem("sandbox_language", "javascript");
                window.open("/sandbox", "_blank");
              }}
              className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-md transition cursor-pointer font-medium"
              title="Open the corrected code directly in a dedicated full-screen editor tab"
            >
              Open in Sandbox
            </button>

            {/* Action 4: Download Corrected File */}
            <button
              onClick={() => {
                const blob = new Blob([finalCode], { type: "text/plain;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "corrected_code.txt";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="px-2.5 py-1 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-md transition cursor-pointer font-medium"
              title="Download corrected code as text file"
            >
              Download
            </button>
          </div>
        </div>

        {/* Diff Content Layout */}
        <div className="py-3 overflow-x-auto max-h-[450px]">
          {lines.map((line, idx) => {
            let lineClass = "text-zinc-300 px-4 py-0.5 font-mono text-[13.5px] leading-relaxed block whitespace-pre";

            if (line.startsWith("+") && !line.startsWith("+++")) {
              lineClass = "bg-emerald-950/20 text-emerald-400 border-l-2 border-emerald-550/70 px-4 py-0.5 font-mono text-[13.5px] leading-relaxed block whitespace-pre";
            } else if (line.startsWith("-") && !line.startsWith("---")) {
              lineClass = "bg-red-955/20 text-red-400 border-l-2 border-red-500/60 px-4 py-0.5 font-mono text-[13.5px] leading-relaxed block whitespace-pre";
            } else if (line.startsWith("@@")) {
              lineClass = "bg-purple-950/15 text-purple-400/90 border-y border-zinc-900/50 px-4 py-1.5 font-mono text-[12.5px] leading-relaxed block italic whitespace-pre my-1";
            } else if (line.startsWith("diff --git") || line.startsWith("index ") || line.startsWith("--- ") || line.startsWith("+++ ")) {
              lineClass = "text-zinc-500 font-bold px-4 py-0.5 font-mono text-[12.5px] leading-relaxed block whitespace-pre bg-zinc-900/20";
            }

            return (
              <div key={idx} className={lineClass}>
                {line}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="my-5 overflow-hidden rounded-xl border border-zinc-700 bg-[#0d1117] shadow-lg">

      {/* Header */}

      <div className="flex items-center justify-between border-b border-zinc-700 bg-zinc-900 px-4 py-2">

        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {language}
        </span>

        <div className="flex items-center gap-2">
          {["javascript", "typescript", "html", "css", "java", "cpp", "python"].includes(language.toLowerCase()) && (
            <button
              onClick={() => {
                localStorage.setItem("sandbox_code", code);
                localStorage.setItem("sandbox_title", "DSA Coding Practice");
                localStorage.setItem("sandbox_language", language);
                window.open("/sandbox", "_blank");
              }}
              className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-md transition cursor-pointer font-medium text-xs"
              title="Open this code block directly in a dedicated full-screen editor tab"
            >
              Open in Sandbox
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-md px-3 py-1 text-xs text-zinc-300 transition hover:bg-zinc-800 cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={15} />
                Copied
              </>
            ) : (
              <>
                <Copy size={15} />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code */}

      <SyntaxHighlighter
        language={language}
        style={oneDark}
        wrapLongLines
        showLineNumbers
        customStyle={{
          margin: 0,
          background: "#0d1117",
          padding: "18px",
          fontSize: "15px",
          borderRadius: 0,
        }}
        lineNumberStyle={{
          color: "#666",
          minWidth: "2.5em",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}