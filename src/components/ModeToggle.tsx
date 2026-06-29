type Props = {
  mode: 'teacher' | 'coding';
  onModeChange: (mode: 'teacher' | 'coding') => void;
};

export default function ModeToggle({
  mode,
  onModeChange,
}: Props) {
  return (
    <div className="mb-8 flex justify-center">
      <div className="flex p-1.5 rounded-2xl glass-panel relative border border-zinc-800 max-w-sm w-full shadow-inner">
        <button
          type="button"
          onClick={() => onModeChange('teacher')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold transition-all duration-300 ${
            mode === 'teacher'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <span>👨‍🏫</span>
          Teacher Mode
        </button>

        <button
          type="button"
          onClick={() => onModeChange('coding')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold transition-all duration-300 ${
            mode === 'coding'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <span>👨‍💻</span>
          Coding Mode
        </button>
      </div>
    </div>
  );
}