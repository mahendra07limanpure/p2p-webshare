import { Send, Download, Sun, Moon, Radio, ShieldCheck, Zap } from 'lucide-react';
import { GlassPanel, Pill } from './ui.jsx';

export default function Home({ onNavigate, isDark, onToggleTheme }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 sm:px-10 py-6">
        <div className="flex items-center gap-2.5">
          <div className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 text-slate-950">
            <Radio size={18} strokeWidth={2.5} />
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">Beam</span>
        </div>

        <button
          onClick={onToggleTheme}
          aria-label="Toggle color theme"
          className="grid place-items-center w-10 h-10 rounded-xl glass text-slate-700 dark:text-slate-200 hover:opacity-80 transition-opacity"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 sm:py-16">
        <div className="text-center max-w-2xl mb-12 sm:mb-16">
          <Pill className="mb-5">
            <Zap size={12} className="text-cyan-400" />
            Direct browser-to-browser transfer
          </Pill>
          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
            Send files,
            <br />
            <span className="text-gradient">peer to peer.</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            No uploads, no cloud storage, no size limits from a server. Your file travels straight
            from your browser to theirs over an encrypted WebRTC connection.
          </p>
        </div>

        <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6 md:gap-0">
          <GlassPanel className="p-7 sm:p-8 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl grid place-items-center bg-gradient-to-br from-cyan-400/20 to-cyan-400/5 text-cyan-400">
              <Send size={22} />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold">Send a file</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Pick a file, get a room code, share the link.
              </p>
            </div>
            <button
              onClick={() => onNavigate('send')}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-display font-semibold text-sm
                         bg-gradient-to-r from-cyan-400 to-cyan-300 text-slate-950 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Start sending
            </button>
          </GlassPanel>

          {/* Beam connector */}
          <div className="hidden md:flex items-center justify-center px-6 h-full">
            <div className="relative h-px w-24 bg-gradient-to-r from-cyan-400/0 via-white/40 to-violet-400/0">
              <span className="beam-dot-h absolute top-1/2 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_2px_rgba(103,232,249,0.6)]" style={{ animationDelay: '0s' }} />
              <span className="beam-dot-h absolute top-1/2 h-2 w-2 rounded-full bg-violet-300 shadow-[0_0_8px_2px_rgba(192,132,252,0.6)]" style={{ animationDelay: '1.1s' }} />
              <span className="beam-dot-h absolute top-1/2 h-1.5 w-1.5 rounded-full bg-cyan-200" style={{ animationDelay: '2.2s' }} />
            </div>
          </div>

          {/* Mobile connector */}
          <div className="md:hidden flex items-center justify-center py-1">
            <div className="relative h-10 w-px bg-gradient-to-b from-cyan-400/0 via-white/40 to-violet-400/0">
              <span className="beam-dot-v absolute left-1/2 h-2 w-2 rounded-full bg-cyan-300" style={{ animationDelay: '0s' }} />
              <span className="beam-dot-v absolute left-1/2 h-2 w-2 rounded-full bg-violet-300" style={{ animationDelay: '1.1s' }} />
            </div>
          </div>

          <GlassPanel className="p-7 sm:p-8 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl grid place-items-center bg-gradient-to-br from-violet-400/20 to-violet-400/5 text-violet-400">
              <Download size={22} />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold">Receive a file</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Enter a room code or open an invite link.
              </p>
            </div>
            <button
              onClick={() => onNavigate('receive')}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-display font-semibold text-sm
                         bg-gradient-to-r from-violet-400 to-violet-300 text-slate-950 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Join a room
            </button>
          </GlassPanel>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <Pill>
            <ShieldCheck size={12} className="text-cyan-400" /> SHA-256 verified
          </Pill>
          <Pill>50MB max per file</Pill>
          <Pill>Files never touch a server</Pill>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-500 dark:text-slate-500 pb-6">
        Built with WebRTC + Socket.io
      </footer>
    </div>
  );
}
