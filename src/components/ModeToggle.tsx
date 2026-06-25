type Props = {
  mode: 'teacher' | 'coding';
  onModeChange: (mode: 'teacher' | 'coding') => void;
};

export default function ModeToggle({
  mode,
  onModeChange,
}: Props) {
  return (
    <div className="mb-4 flex justify-center gap-3">
      <button
        type="button"
        onClick={() => onModeChange('teacher')}
        className={`rounded-lg px-4 py-2 font-medium transition-all ${
          mode === 'teacher'
            ? 'bg-blue-600 text-white shadow-lg'
            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
        }`}
      >
        👨‍🏫 Teacher
      </button>

      <button
        type="button"
        onClick={() => onModeChange('coding')}
        className={`rounded-lg px-4 py-2 font-medium transition-all ${
          mode === 'coding'
            ? 'bg-green-600 text-white shadow-lg'
            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
        }`}
      >
        👨‍💻 Coding
      </button>
    </div>
  );
}