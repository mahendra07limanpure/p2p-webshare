import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Download,
  FileIcon,
  Loader2,
  Wifi,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { GlassPanel, PrimaryButton, GhostButton, ProgressBar, Pill, formatBytes } from './ui.jsx';
import useWebRTC from '../hooks/useWebRTC.js';

export default function Receiver({ onBack, initialRoomId = '' }) {
  const { phase, progress, speed, errorMsg, incomingMeta, download, joinRoom, reset } = useWebRTC();
  const [roomInput, setRoomInput] = useState(initialRoomId);

  useEffect(() => () => reset(), []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-join if a room code arrived via the invite link
  useEffect(() => {
    if (initialRoomId && phase === 'idle') {
      joinRoom(initialRoomId.trim().toUpperCase());
    }
  }, [initialRoomId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleJoin = (e) => {
    e.preventDefault();
    const id = roomInput.trim().toUpperCase();
    if (id) joinRoom(id);
  };

  const handleReset = () => {
    reset();
    setRoomInput('');
  };

  return (
    <div className="min-h-screen flex flex-col px-6 sm:px-10 py-6">
      <header className="flex items-center gap-3 mb-8 sm:mb-12">
        <button
          onClick={onBack}
          className="grid place-items-center w-10 h-10 rounded-xl glass text-slate-700 dark:text-slate-200 hover:opacity-80 transition-opacity"
          aria-label="Back to home"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-display text-xl font-semibold">Receive a file</h1>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <GlassPanel className="w-full max-w-lg p-6 sm:p-8">
          {/* Step 1: enter room code */}
          {(phase === 'idle' || phase === 'joining' || phase === 'not-found') && (
            <form onSubmit={handleJoin} className="flex flex-col gap-5">
              <div>
                <h2 className="font-display text-lg font-semibold mb-1">Enter a room code</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Ask the sender for their room code, or open their invite link.
                </p>
              </div>

              <input
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                placeholder="e.g. AB12CD"
                autoFocus
                className="w-full rounded-xl px-4 py-3 text-center font-mono text-2xl tracking-widest uppercase
                           bg-white/40 dark:bg-white/5 border border-white/15 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
              />

              {phase === 'not-found' && (
                <div className="flex items-start gap-2 text-sm text-rose-400">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <PrimaryButton type="submit" disabled={!roomInput.trim() || phase === 'joining'}>
                {phase === 'joining' ? <Loader2 size={16} className="animate-spin" /> : null}
                {phase === 'joining' ? 'Joining…' : 'Join room'}
              </PrimaryButton>
            </form>
          )}

          {/* Step 2: connecting */}
          {phase === 'connecting' && (
            <div className="flex flex-col items-center text-center gap-4 py-6">
              <Wifi size={28} className="animate-pulse text-violet-400" />
              <p className="text-slate-600 dark:text-slate-300">Connecting to the sender…</p>
            </div>
          )}

          {/* Step 3: transferring */}
          {phase === 'transferring' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3 rounded-xl glass p-4">
                <div className="w-10 h-10 rounded-lg grid place-items-center bg-white/10 text-violet-300 shrink-0">
                  <FileIcon size={18} />
                </div>
                <div className="overflow-hidden text-left">
                  <p className="font-medium truncate">{incomingMeta?.name || 'Incoming file'}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{formatBytes(incomingMeta?.size || 0)}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="font-display font-medium">Receiving…</span>
                  <span className="text-slate-500 dark:text-slate-400">{progress}%</span>
                </div>
                <ProgressBar value={progress} />
              </div>

              <Pill className="self-start">{speed.toFixed(2)} MB/s</Pill>
            </div>
          )}

          {/* Step 4: completed */}
          {phase === 'completed' && (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full grid place-items-center bg-emerald-400/15 text-emerald-400">
                <CheckCircle2 size={30} />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold">File received</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Integrity verified with SHA-256. The download started automatically.
                </p>
              </div>
              {download?.url && (
                <a
                  href={download.url}
                  download={download.name}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-display font-semibold text-sm
                             bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download size={16} />
                  Download again
                </a>
              )}
              <GhostButton onClick={handleReset}>
                <RotateCcw size={16} />
                Receive another file
              </GhostButton>
            </div>
          )}

          {/* Hash mismatch */}
          {phase === 'hash-mismatch' && (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full grid place-items-center bg-amber-400/15 text-amber-400">
                <ShieldAlert size={28} />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold">Integrity check failed</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  The file arrived but its SHA-256 hash didn't match. It may be corrupted — try the
                  transfer again.
                </p>
              </div>
              {download?.url && (
                <a
                  href={download.url}
                  download={download.name}
                  className="text-sm underline text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Download anyway
                </a>
              )}
              <GhostButton onClick={handleReset}>
                <RotateCcw size={16} />
                Try again
              </GhostButton>
            </div>
          )}

          {/* Peer left */}
          {phase === 'peer-left' && (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full grid place-items-center bg-rose-400/15 text-rose-400">
                <AlertTriangle size={28} />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold">Sender disconnected</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  The sender closed their tab before the transfer finished.
                </p>
              </div>
              <div className="flex gap-3">
                <GhostButton onClick={handleReset}>
                  <RotateCcw size={16} />
                  Try again
                </GhostButton>
                <PrimaryButton onClick={onBack}>Back to home</PrimaryButton>
              </div>
            </div>
          )}
        </GlassPanel>
      </main>
    </div>
  );
}
