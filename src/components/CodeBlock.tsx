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

  return (
    <div className="my-5 overflow-hidden rounded-xl border border-zinc-700 bg-[#0d1117] shadow-lg">

      {/* Header */}

      <div className="flex items-center justify-between border-b border-zinc-700 bg-zinc-900 px-4 py-2">

        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {language}
        </span>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 rounded-md px-3 py-1 text-xs text-zinc-300 transition hover:bg-zinc-800"
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