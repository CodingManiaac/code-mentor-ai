'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';

export default function Home() {
  const [input, setInput] = useState('');

  const { messages, sendMessage, status } = useChat();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col p-6">
      <h1 className="mb-6 text-center text-4xl font-bold">
        CodeMentor AI 🚀
      </h1>

      <div className="mb-4 flex-1 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id}>
            <strong>
              {message.role === 'user' ? 'You' : 'AI'}:
            </strong>{' '}
            {message.parts
              ?.filter((part) => part.type === 'text')
              .map((part, index) => (
                <span key={index}>{part.text}</span>
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
  placeholder="Ask a coding question..."
  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-white placeholder:text-zinc-500 caret-white focus:outline-none focus:ring-2 focus:ring-blue-500"
/>

<button
  type="submit"
  disabled={status === 'streaming'}
  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
>
  Send
</button>
      </form>
    </main>
  );
}