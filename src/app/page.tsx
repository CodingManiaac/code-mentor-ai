'use client';

import { useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

import ModeToggle from '@/components/ModeToggle';

export default function Home() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'teacher' | 'coding'>(
    'teacher'
  );

  const modeRef = useRef(mode);
  modeRef.current = mode;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        body: () => ({ mode: modeRef.current }),
      }),
    []
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col p-6 text-white">
      <h1 className="mb-6 text-center text-4xl font-bold">
        CodeMentor AI 🚀
      </h1>

      <ModeToggle
  mode={mode}
  onModeChange={(newMode) => {
    setMode(newMode);
    setMessages([]);
  }}
/>

      <div className="mb-4 flex flex-1 flex-col gap-4 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[80%] rounded-xl p-4 ${
              message.role === 'user'
                ? 'ml-auto bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-100'
            }`}
          >
            {message.parts
              ?.filter((part) => part.type === 'text')
              .map((part, index) => (
                <p key={index}>{part.text}</p>
              ))}
          </div>
        ))}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();

          if (!input.trim()) return;

          sendMessage({ text: input });

          setInput('');
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask a ${
            mode === 'teacher'
              ? 'learning'
              : 'coding'
          } question...`}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-white placeholder:text-zinc-500 caret-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          disabled={status === 'streaming'}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {status === 'streaming' ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </main>
  );
}