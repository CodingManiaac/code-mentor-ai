"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import CodeBlock from "./CodeBlock";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({
  content,
}: MarkdownRendererProps) {
  return (
    <div className="prose prose-invert max-w-none
      prose-headings:text-white
      prose-p:text-zinc-200
      prose-strong:text-white
      prose-code:text-pink-400
      prose-pre:bg-transparent
      prose-pre:p-0
      prose-table:border
      prose-table:border-zinc-700
      prose-th:border
      prose-th:border-zinc-700
      prose-td:border
      prose-td:border-zinc-700">

      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code(props) {
            const { children, className } = props;

            const match = /language-(\w+)/.exec(
              className || ""
            );

            const code = String(children).replace(/\n$/, "");

            // Inline code
            if (!match) {
              return (
                <code className="rounded bg-zinc-800 px-1 py-0.5 text-pink-400">
                  {children}
                </code>
              );
            }

            // Code block
            return (
              <CodeBlock
                language={match[1]}
                code={code}
              />
            );
          },

          a(props) {
            return (
              <a
                {...props}
                className="text-blue-400 hover:text-blue-300 underline"
                target="_blank"
                rel="noopener noreferrer"
              />
            );
          },

          table(props) {
            return (
              <div className="overflow-x-auto">
                <table
                  {...props}
                  className="w-full border-collapse"
                />
              </div>
            );
          },

          blockquote(props) {
            return (
              <blockquote
                {...props}
                className="border-l-4 border-blue-500 pl-4 italic text-zinc-300"
              />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}