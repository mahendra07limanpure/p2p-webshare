import { useState, useRef, useEffect, useCallback } from 'react';
import socket from '../socket';

const CHUNK_SIZE = 16 * 1024;
const BUFFER_THRESHOLD = 1 * 1024 * 1024;

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const toHex = (buf) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

async function sha256OfFile(file) {
  const buffer = await file.arrayBuffer();
  return toHex(await crypto.subtle.digest('SHA-256', buffer));
}

async function sha256OfChunks(chunks) {
  const buffer = await new Blob(chunks).arrayBuffer();
  return toHex(await crypto.subtle.digest('SHA-256', buffer));
}

export default function useWebRTC() {
  const [phase, setPhase] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [roomId, setRoomId] = useState(null);
  const [incomingMeta, setIncomingMeta] = useState(null);
  const [download, setDownload] = useState(null);

  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const roomIdRef = useRef(null);
  const fileRef = useRef(null);
  const metaRef = useRef(null);
  const chunksRef = useRef([]);
  const receivedRef = useRef(0);
  const tickRef = useRef({ t: 0, b: 0 });
  const pendingCandidatesRef = useRef([]);

  const resetSpeedTick = (bytes = 0) => {
    tickRef.current = { t: Date.now(), b: bytes };
  };

  const updateSpeed = (totalBytes) => {
    const now = Date.now();
    const dt = now - tickRef.current.t;
    if (dt >= 400) {
      const mbps = (totalBytes - tickRef.current.b) / 1024 / 1024 / (dt / 1000);
      setSpeed(Math.max(0, mbps));
      tickRef.current = { t: now, b: totalBytes };
    }
  };

  const cleanupConnection = () => {
    if (dcRef.current) {
      try { dcRef.current.close(); } catch (_) {}
      dcRef.current = null;
    }
    if (pcRef.current) {
      try { pcRef.current.close(); } catch (_) {}
      pcRef.current = null;
    }
    pendingCandidatesRef.current = [];
  };

  const createPC = () => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pc.onicecandidate = (e) => {
      if (e.candidate && roomIdRef.current) {
        // ✅ matches server: socket.on('signal', ...)
        socket.emit('signal', { roomId: roomIdRef.current, data: { candidate: e.candidate } });
      }
    };
    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        setPhase((p) => (p === 'completed' || p === 'hash-mismatch' ? p : 'peer-left'));
      }
    };
    pcRef.current = pc;
    return pc;
  };

  const beginSend = () => {
    const dc = dcRef.current;
    const file = fileRef.current;
    if (!dc || !file) return;

    (async () => {
      setPhase('transferring');
      setProgress(0);

      const hash = await sha256OfFile(file);
      dc.send(JSON.stringify({ type: 'meta', name: file.name, size: file.size, fileType: file.type, hash }));

      let offset = 0;
      resetSpeedTick(0);
      dc.bufferedAmountLowThreshold = BUFFER_THRESHOLD / 2;

      const pump = () => {
        if (dc.readyState !== 'open') return;
        if (offset >= file.size) {
          dc.send(JSON.stringify({ type: 'done' }));
          setProgress(100);
          setPhase('completed');
          return;
        }
        if (dc.bufferedAmount > BUFFER_THRESHOLD) {
          dc.onbufferedamountlow = () => { dc.onbufferedamountlow = null; pump(); };
          return;
        }
        const slice = file.slice(offset, offset + CHUNK_SIZE);
        const reader = new FileReader();
        reader.onload = (e) => {
          if (dc.readyState !== 'open') return;
          dc.send(e.target.result);
          offset += e.target.result.byteLength;
          setProgress(Math.min(100, Math.floor((offset / file.size) * 100)));
          updateSpeed(offset);
          pump();
        };
        reader.readAsArrayBuffer(slice);
      };

      pump();
    })();
  };

  const createRoom = (file) => {
    fileRef.current = file;
    setErrorMsg('');
    setPhase('creating');
    socket.emit('create-room');
  };

  const setupReceiveChannel = (dc) => {
    dc.binaryType = 'arraybuffer';
    chunksRef.current = [];
    receivedRef.current = 0;

    dc.onmessage = async (event) => {
      if (typeof event.data === 'string') {
        let msg;
        try { msg = JSON.parse(event.data); } catch (_) { return; }

        if (msg.type === 'meta') {
          metaRef.current = msg;
          setIncomingMeta(msg);
          setPhase('transferring');
          setProgress(0);
          resetSpeedTick(0);
        } else if (msg.type === 'done') {
          const meta = metaRef.current;
          const computedHash = await sha256OfChunks(chunksRef.current);
          const blob = new Blob(chunksRef.current, { type: meta?.fileType || 'application/octet-stream' });
          const url = URL.createObjectURL(blob);
          const verified = !!meta && computedHash === meta.hash;
          setDownload({ url, name: meta?.name || 'download', verified });
          setProgress(100);
          setPhase(verified ? 'completed' : 'hash-mismatch');
          if (verified) {
            const a = document.createElement('a');
            a.href = url;
            a.download = meta?.name || 'download';
            document.body.appendChild(a);
            a.click();
            a.remove();
          }
        }
        return;
      }
      chunksRef.current.push(event.data);
      receivedRef.current += event.data.byteLength;
      updateSpeed(receivedRef.current);
      const total = metaRef.current?.size || 1;
      setProgress(Math.min(100, Math.floor((receivedRef.current / total) * 100)));
    };
  };

  const joinRoom = (id) => {
    if (!id) return;
    setErrorMsg('');
    setPhase('joining');
    roomIdRef.current = id;
    socket.emit('join-room', { roomId: id });
  };

  useEffect(() => {
    // ✅ matches server: socket.emit('room-created', { roomId })
    const onRoomCreated = ({ roomId: id }) => {
      roomIdRef.current = id;
      setRoomId(id);
      setPhase('waiting-peer');
    };

    // ✅ matches server: socket.emit('room-joined', { roomId })
    const onRoomJoined = ({ roomId: id }) => {
      roomIdRef.current = id;
      setRoomId(id);
      setPhase('connecting');
    };

    const onRoomNotFound = () => {
      setPhase('not-found');
      setErrorMsg('Room not found. Check the code and try again.');
    };

    // ✅ matches server: io.to(room.senderId).emit('peer-joined')
    const onPeerJoined = async () => {
      const pc = createPC();
      const dc = pc.createDataChannel('file');
      dcRef.current = dc;
      dc.onopen = () => beginSend();
      setPhase('connecting');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      // ✅ matches server: socket.on('signal', ...)
      socket.emit('signal', { roomId: roomIdRef.current, data: { sdp: offer } });
    };

    // ✅ matches server: socket.to(roomId).emit('signal', { data })
    const onSignal = async ({ data }) => {
      let pc = pcRef.current;

      if (data.sdp) {
        if (data.sdp.type === 'offer') {
          pc = createPC();
          pc.ondatachannel = (e) => {
            dcRef.current = e.channel;
            setupReceiveChannel(e.channel);
          };
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          for (const c of pendingCandidatesRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          }
          pendingCandidatesRef.current = [];
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('signal', { roomId: roomIdRef.current, data: { sdp: answer } });
        } else if (data.sdp.type === 'answer' && pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          for (const c of pendingCandidatesRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          }
          pendingCandidatesRef.current = [];
        }
      } else if (data.candidate) {
        if (pc && pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } else {
          pendingCandidatesRef.current.push(data.candidate);
        }
      }
    };

    const onPeerDisconnected = () => {
      setPhase((p) => (p === 'completed' || p === 'hash-mismatch' ? p : 'peer-left'));
    };

    socket.on('room-created', onRoomCreated);
    socket.on('room-joined', onRoomJoined);
    socket.on('room-not-found', onRoomNotFound);
    socket.on('peer-joined', onPeerJoined);
    socket.on('signal', onSignal);
    socket.on('peer-disconnected', onPeerDisconnected);

    return () => {
      socket.off('room-created', onRoomCreated);
      socket.off('room-joined', onRoomJoined);
      socket.off('room-not-found', onRoomNotFound);
      socket.off('peer-joined', onPeerJoined);
      socket.off('signal', onSignal);
      socket.off('peer-disconnected', onPeerDisconnected);
      cleanupConnection();
    };
  }, []);

  const reset = useCallback(() => {
    cleanupConnection();
    chunksRef.current = [];
    receivedRef.current = 0;
    metaRef.current = null;
    fileRef.current = null;
    roomIdRef.current = null;
    setPhase('idle');
    setProgress(0);
    setSpeed(0);
    setErrorMsg('');
    setRoomId(null);
    setIncomingMeta(null);
    setDownload((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
  }, []);

  return { phase, progress, speed, errorMsg, roomId, incomingMeta, download, createRoom, joinRoom, reset };
}