export function GlassPanel({ className = '', children }) {
  return (
    <div
      className={
        'glass rounded-3xl shadow-2xl shadow-black/20 dark:shadow-black/40 ' + className
      }
    >
      {children}
    </div>
  );
}

export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={
        'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-display font-semibold text-sm tracking-wide ' +
        'bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 ' +
        'transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] ' +
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 ' +
        className
      }
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, className = '', ...props }) {
  return (
    <button
      className={
        'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-display font-medium text-sm ' +
        'border border-white/15 dark:border-white/15 text-slate-700 dark:text-slate-200 ' +
        'bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 ' +
        'transition-colors duration-150 ' +
        className
      }
      {...props}
    >
      {children}
    </button>
  );
}

export function ProgressBar({ value = 0 }) {
  return (
    <div className="w-full h-2.5 rounded-full bg-slate-900/10 dark:bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-[width] duration-200 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function Pill({ children, className = '' }) {
  return (
    <span
      className={
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ' +
        'bg-white/40 dark:bg-white/10 border border-white/20 dark:border-white/10 ' +
        'text-slate-700 dark:text-slate-200 ' +
        className
      }
    >
      {children}
    </span>
  );
}

export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
