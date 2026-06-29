"use client";

interface Props {
  onAction: (prompt: string) => void;
}

const actions = [
  {
    label: "📖 Explain",
    prompt: "Explain the uploaded file in detail.",
  },
  {
    label: "🐞 Find Bugs",
    prompt: "Find bugs in the uploaded file.",
  },
  {
    label: "⚡ Optimize",
    prompt: "Optimize the uploaded file.",
  },
  {
    label: "📊 Complexity",
    prompt: "Analyze the time and space complexity.",
  },
  {
    label: "✨ Refactor",
    prompt: "Refactor the uploaded file using best practices.",
  },
];

export default function FileActions({
  onAction,
}: Props) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => onAction(action.prompt)}
          className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm transition hover:bg-zinc-800"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}