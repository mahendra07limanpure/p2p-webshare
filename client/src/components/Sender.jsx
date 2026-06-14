import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  UploadCloud,
  FileIcon,
  Copy,
  Check,
  Loader2,
  Wifi,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { GlassPanel, PrimaryButton, GhostButton, ProgressBar, Pill, formatBytes } from './ui.jsx';
import useWebRTC from '../hooks/useWebRTC.js';

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export default function Sender({ onBack }) {
  const { phase, progress, speed, roomId, errorMsg, createRoom, reset } = useWebRTC();
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  const inviteLink = roomId ? `${window.location.origin}${window.location.pathname}?room=${roomId}` : '';

  const validateAndSetFile = (f) => {
    if (!f) return;
    if (f.size > MAX_SIZE) {
      setFileError(`"${f.name}" is ${formatBytes(f.size)} — max allowed is 50MB.`);
      return;
    }
    setFileError('');
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    validateAndSetFile(e.dataTransfer.files?.[0]);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      /* clipboard may be unavailable */
    }
  };

  const handleStart = () => {
    if (file) createRoom(file);
  };

  const handleReset = () => {
    reset();
    setFile(null);
    setFileError('');
  };

  useEffect(() => () => reset(), []); // eslint-disable-line react-hooks/exhaustive-deps

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
        <h1 className="font-display text-xl font-semibold">Send a file</h1>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <GlassPanel className="w-full max-w-lg p-6 sm:p-8">
          {/* Step 1: choose file */}
          {phase === 'idle' && (
            <div className="flex flex-col gap-5">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={
                  'rounded-2xl border-2 border-dashed cursor-pointer transition-colors px-6 py-12 flex flex-col items-center text-center gap-3 ' +
                  (dragOver
                    ? 'border-cyan-400 bg-cyan-400/5'
                    : 'border-white/20 dark:border-white/15 hover:border-white/40')
                }
              >
                <div className="w-14 h-14 rounded-2xl grid place-items-center bg-gradient-to-br from-cyan-400/20 to-violet-400/10 text-cyan-400">
                  <UploadCloud size={26} />
                </div>
                <div>
                  <p className="font-display font-medium">Drop a file here, or click to browse</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Max file size: 50MB</p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => validateAndSetFile(e.target.files?.[0])}
                />
              </div>

              {fileError && (
                <div className="flex items-start gap-2 text-sm text-rose-400">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}

              {file && (
                <div className="flex items-center gap-3 rounded-xl glass p-4">
                  <div className="w-10 h-10 rounded-lg grid place-items-center bg-white/10 text-cyan-300 shrink-0">
                    <FileIcon size={18} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{formatBytes(file.size)}</p>
                  </div>
                </div>
              )}

              <PrimaryButton disabled={!file} onClick={handleStart}>
                Create room &amp; get link
              </PrimaryButton>
            </div>
          )}

          {/* Step 2: room created, waiting for peer */}
          {(phase === 'creating' || phase === 'waiting-peer' || phase === 'connecting') && (
            <div className="flex flex-col gap-6 items-center text-center">
              <div className="flex items-center gap-3 rounded-xl glass p-4 w-full">
                <div className="w-10 h-10 rounded-lg grid place-items-center bg-white/10 text-cyan-300 shrink-0">
                  <FileIcon size={18} />
                </div>
                <div className="overflow-hidden text-left">
                  <p className="font-medium truncate">{file?.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{formatBytes(file?.size || 0)}</p>
                </div>
              </div>

              {phase === 'creating' && (
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 py-6">
                  <Loader2 size={18} className="animate-spin" />
                  Creating room…
                </div>
              )}

              {phase === 'waiting-peer' && (
                <>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Room code</p>
                    <p className="font-mono text-3xl sm:text-4xl font-semibold tracking-widest text-gradient">
                      {roomId}
                    </p>
                  </div>

                  <div className="w-full flex flex-col sm:flex-row gap-2">
                    <input
                      readOnly
                      value={inviteLink}
                      className="flex-1 rounded-xl px-4 py-3 text-sm font-mono bg-white/40 dark:bg-white/5 border border-white/15 truncate"
                    />
                    <GhostButton onClick={handleCopy} className="shrink-0">
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? 'Copied' : 'Copy link'}
                    </GhostButton>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60 animate-ping" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
                    </span>
                    Waiting for someone to join…
                  </div>
                </>
              )}

              {phase === 'connecting' && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 py-6">
                  <Wifi size={18} className="animate-pulse text-cyan-400" />
                  Peer connected — establishing secure link…
                </div>
              )}
            </div>
          )}

          {/* Step 3: transferring */}
          {phase === 'transferring' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3 rounded-xl glass p-4">
                <div className="w-10 h-10 rounded-lg grid place-items-center bg-white/10 text-cyan-300 shrink-0">
                  <FileIcon size={18} />
                </div>
                <div className="overflow-hidden text-left">
                  <p className="font-medium truncate">{file?.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{formatBytes(file?.size || 0)}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="font-display font-medium">Sending…</span>
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
                <h2 className="font-display text-lg font-semibold">Transfer complete</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  "{file?.name}" was delivered and verified by the receiver.
                </p>
              </div>
              <PrimaryButton onClick={handleReset}>
                <RotateCcw size={16} />
                Send another file
              </PrimaryButton>
            </div>
          )}

          {/* Peer left / errors */}
          {(phase === 'peer-left' || phase === 'not-found') && (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full grid place-items-center bg-rose-400/15 text-rose-400">
                <AlertTriangle size={28} />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold">Connection lost</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {errorMsg || 'The receiver disconnected before the transfer finished.'}
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
