import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  Clock,
  AlertCircle,
  X
} from 'lucide-react';
import { AudioStorageService, AudioRecord } from '../../lib/AudioStorageService';
import { HapticFeedback } from '../../lib/haptics';

interface Props {
  itemId: string | number;
  itemType: 'quran' | 'book';
  itemLabel: string;
  language?: 'id' | 'en' | 'ar';
  compact?: boolean;
  variant?: 'default' | 'card' | 'mushaf-dock' | 'review-dock' | 'review-front' | 'review-back';
  onHasRecordingChange?: (hasRecording: boolean) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
  onClose?: () => void;
  onOpenFeedback?: () => void;
}

const SPEED_PRESETS = [0.75, 0.85, 1.0, 1.25, 1.5, 2.0];

export const AudioRecorderPlayer: React.FC<Props> = ({
  itemId,
  itemType,
  itemLabel,
  language = 'id',
  compact = false,
  variant = 'default',
  onHasRecordingChange,
  onRecordingStateChange,
  onClose,
  onOpenFeedback
}) => {
  const [record, setRecord] = useState<AudioRecord | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Recorder states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const [micError, setMicError] = useState<string | null>(null);

  // Player states
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);

  const onHasRecordingChangeRef = useRef(onHasRecordingChange);
  useEffect(() => {
    onHasRecordingChangeRef.current = onHasRecordingChange;
  }, [onHasRecordingChange]);

  // Load existing recording for this item
  const loadRecording = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await AudioStorageService.getAudio(itemId);
      if (data) {
        setRecord(data);
        const newUrl = AudioStorageService.getCachedBlobUrl(itemId, data.audioBlob);
        setAudioUrl(newUrl);
        setDuration(data.duration);
        setCurrentTime(0);
        setIsPlaying(false);
        onHasRecordingChangeRef.current?.(true);
      } else {
        setRecord(null);
        setAudioUrl(null);
        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(false);
        onHasRecordingChangeRef.current?.(false);
      }
    } catch (err) {
      console.error('Failed to load recording:', err);
    } finally {
      setIsLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    // If itemId changes while recording, cancel the ongoing recording to prevent cross-contamination
    if (isRecording) {
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setIsRecording(false);
      audioChunksRef.current = [];
    }
    
    loadRecording();

    // Listen to custom audio update events
    const handleAudioUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ itemId: string | number }>;
      if (String(customEvent.detail?.itemId) === String(itemId)) {
        loadRecording();
      }
    };

    window.addEventListener('audio-updated', handleAudioUpdate);
    return () => {
      window.removeEventListener('audio-updated', handleAudioUpdate);
    };
  }, [itemId, loadRecording]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
      }
    };
  }, []);

  // Keyboard shortcut listener for Mushaf Dock (Spacebar = Play/Pause, Left/Right = Seek -5s/+5s)
  useEffect(() => {
    if (variant !== 'mushaf-dock' || !record) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && ['input', 'textarea', 'select'].includes(target.tagName.toLowerCase())) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        jumpSeconds(-5);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        jumpSeconds(5);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [variant, record, isPlaying, duration]);

  // Handle Recording Start
  const startRecording = async () => {
    setMicError(null);
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: false,
            autoGainControl: true,
          }
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      streamRef.current = stream;

      let options: { mimeType: string } | undefined;
      if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
        const types = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
          'audio/aac',
          'audio/ogg'
        ];
        for (const t of types) {
          if (MediaRecorder.isTypeSupported(t)) {
            options = { mimeType: t };
            break;
          }
        }
      }
      const mediaRecorder = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Clean stream tracks immediately
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }

        const effectiveMime = mediaRecorder.mimeType || (options ? options.mimeType : (audioChunksRef.current[0] ? audioChunksRef.current[0].type : 'audio/webm'));
        const audioBlob = new Blob(audioChunksRef.current, { type: effectiveMime });
        const finalDuration = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));

        if (audioBlob.size > 0) {
          await AudioStorageService.saveAudio(itemId, audioBlob, finalDuration);
          await loadRecording();
        } else {
          console.warn('Recorded audioBlob is empty');
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordSeconds(0);
      startTimeRef.current = Date.now();
      HapticFeedback.recordStart();

      recordTimerRef.current = window.setInterval(() => {
        const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordSeconds(secs);
        if (secs > 0 && secs % 2 === 0) {
          HapticFeedback.pulseBeat();
        }
      }, 1000);

    } catch (err: unknown) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      console.error('Microphone access denied:', err);
      const errorMsg = (err as Error)?.message || '';
      if (errorMsg.includes('Permission denied') || errorMsg.includes('NotAllowedError')) {
        setMicError(
          language === 'en' 
            ? 'Mic permission denied' 
            : 'Izin mic ditolak'
        );
      } else {
        setMicError(
          language === 'en' 
            ? 'Mic unavailable' 
            : 'Mic tidak tersedia'
        );
      }
      setIsRecording(false);
    }
  };

  // Stop Recording
  const stopRecording = () => {
    HapticFeedback.recordStop();
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.requestData();
        }
      } catch (e) {
        console.warn('requestData error:', e);
      }
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Cancel Recording
  const cancelRecording = () => {
    HapticFeedback.light();
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    audioChunksRef.current = [];
  };

  // Notify parent of recording state
  useEffect(() => {
    onRecordingStateChange?.(isRecording);
  }, [isRecording, onRecordingStateChange]);

  // Global event triggers for direct 1-touch recording from header or shortcuts
  useEffect(() => {
    const handleStart = (e: Event) => {
      const detail = (e as CustomEvent<{ itemId?: string | number }>).detail;
      if (!detail?.itemId || String(detail.itemId) === String(itemId)) {
        if (!isRecording) {
          startRecording();
        }
      }
    };
    const handleStop = (e: Event) => {
      const detail = (e as CustomEvent<{ itemId?: string | number }>).detail;
      if (!detail?.itemId || String(detail.itemId) === String(itemId)) {
        if (isRecording) {
          stopRecording();
        }
      }
    };
    const handleToggle = (e: Event) => {
      const detail = (e as CustomEvent<{ itemId?: string | number }>).detail;
      if (!detail?.itemId || String(detail.itemId) === String(itemId)) {
        if (isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
      }
    };

    window.addEventListener('trigger-start-recording', handleStart);
    window.addEventListener('trigger-stop-recording', handleStop);
    window.addEventListener('toggle-audio-recording', handleToggle);

    return () => {
      window.removeEventListener('trigger-start-recording', handleStart);
      window.removeEventListener('trigger-stop-recording', handleStop);
      window.removeEventListener('toggle-audio-recording', handleToggle);
    };
  }, [itemId, isRecording]);

  // Audio Playback Controls
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      HapticFeedback.playToggle(false);
    } else {
      audioRef.current.muted = false;
      audioRef.current.volume = 1.0;
      audioRef.current.playbackRate = playbackSpeed;

      // If at end or near end, restart from beginning
      const maxDur = duration || record?.duration || 0;
      if (audioRef.current.ended || (maxDur > 0 && audioRef.current.currentTime >= maxDur - 0.2)) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      }

      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            HapticFeedback.playToggle(true);
          })
          .catch(err => {
            if (err?.name !== 'AbortError') {
              console.warn('Playback interrupted:', err);
            }
            setIsPlaying(false);
          });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    if (!duration && audioRef.current.duration) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const jumpSeconds = (delta: number) => {
    HapticFeedback.light();
    if (!audioRef.current) return;
    const audioDur = audioRef.current.duration && !isNaN(audioRef.current.duration) && audioRef.current.duration > 0 
      ? audioRef.current.duration 
      : (duration && duration > 0 ? duration : (record?.duration || 9999));
    const newTime = Math.max(0, Math.min(audioRef.current.currentTime + delta, audioDur));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const changeSpeed = (speed: number) => {
    HapticFeedback.light();
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  // Direct delete handler without confirmation step
  const handleDeleteAudio = async () => {
    HapticFeedback.medium();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    await AudioStorageService.deleteAudio(itemId);
    await loadRecording();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-2 text-xs text-slate-400">
        <Clock className="w-3.5 h-3.5 animate-spin mr-1.5 text-indigo-500" />
        <span>{language === 'en' ? 'Loading audio...' : 'Memuat audio...'}</span>
      </div>
    );
  }

  const recordingTitle = language === 'en' ? 'Voice Recording' : 'Rekaman Suara';
  const recordingText = language === 'en' ? `Recording ${itemLabel}...` : `Merekam setoran ${itemLabel}...`;

  // ==========================================
  // VARIANT 1: MUSHAF DOCK (Horizontal Bar Placed Above Rating Buttons)
  // Clean, unified horizontal toolbar matching drawing toolbar
  // ==========================================
  if (variant === 'mushaf-dock') {
    if (isRecording) {
      return (
        <div className="flex items-center justify-between gap-2 h-9 sm:h-10 px-2 sm:px-3 bg-white/95 dark:bg-[#182236]/95 border border-black/10 dark:border-white/10 rounded-2xl shadow-md w-full backdrop-blur-md animate-in fade-in select-none">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
            </span>
            <span className="text-[11px] sm:text-xs font-black text-rose-600 dark:text-rose-400">
              {language === 'en' ? 'Recording...' : 'Merekam...'}
            </span>
            <span className="font-mono text-[11px] sm:text-xs font-black text-[#18234A] dark:text-[#F8FAFC]">
              {AudioStorageService.formatAudioDuration(recordSeconds)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={cancelRecording}
              className="px-2.5 py-1 rounded-xl text-xs font-bold text-[#707E94] hover:text-[#1B254B] dark:text-[#94A3B8] transition-colors cursor-pointer"
            >
              {language === 'en' ? 'Cancel' : 'Batal'}
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Square className="w-3 h-3 fill-white" />
              <span>{language === 'en' ? 'Stop & Save' : 'Selesai & Simpan'}</span>
            </button>
          </div>
        </div>
      );
    }

    if (record && audioUrl) {
      return (
        <div className="flex items-center justify-between gap-1.5 sm:gap-2.5 h-9 sm:h-10 px-2 sm:px-3 bg-white/95 dark:bg-[#182236]/95 border border-black/10 dark:border-white/10 rounded-2xl shadow-md w-full backdrop-blur-md animate-in fade-in select-none">
          <audio
            ref={audioRef}
            src={audioUrl || undefined}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleAudioEnded}
            onError={(e) => {
              const mediaErr = (e.currentTarget as HTMLAudioElement)?.error;
              if (mediaErr && mediaErr.code !== 1) {
                console.warn('Audio playback notice:', mediaErr.code, mediaErr.message);
              }
              setIsPlaying(false);
            }}
            playsInline
            preload="metadata"
          />

          {/* Left: Play/Pause & Time */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={togglePlay}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs ${
                isPlaying 
                  ? 'bg-gradient-to-br from-[#10B981] to-[#059669] text-white shadow-emerald-500/20' 
                  : 'bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-orange-500/20 hover:scale-105'
              }`}
              title={isPlaying ? 'Pause (Spasi)' : 'Putar (Spasi)'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
            </button>

            {/* Time Display */}
            <div className="flex items-center font-mono text-[10px] sm:text-[11px] font-semibold text-[#5E6D88] dark:text-[#94A3B8]">
              <span className="text-[#18234A] dark:text-[#F8FAFC] font-extrabold">{AudioStorageService.formatAudioDuration(currentTime)}</span>
              <span className="mx-0.5">/</span>
              <span>{AudioStorageService.formatAudioDuration(duration || record.duration)}</span>
            </div>
          </div>

          {/* Center: Audio Seekbar Slider */}
          <div className="flex-1 flex items-center max-w-xs mx-1 sm:mx-2 min-w-[50px]">
            <input
              type="range"
              min={0}
              max={duration || record.duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full accent-[#FF6F3D] h-1.5 bg-black/[0.08] dark:bg-white/[0.12] rounded-full cursor-pointer transition-colors"
              title="Geser posisi pemutaran audio"
            />
          </div>

          {/* Right: Speed, Retake, Delete, Close */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                const nextIndex = (SPEED_PRESETS.indexOf(playbackSpeed) + 1) % SPEED_PRESETS.length;
                changeSpeed(SPEED_PRESETS[nextIndex]);
              }}
              className="px-1.5 py-0.5 rounded-lg neumorph-card text-[10px] font-mono font-bold text-[#18234A] dark:text-[#F8FAFC] hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
              title="Kecepatan putar"
            >
              {playbackSpeed}×
            </button>

            <button
              type="button"
              onClick={startRecording}
              className="p-1 sm:p-1.5 rounded-xl neumorph-card text-[#5E6D88] hover:text-[#FF6F3D] dark:text-[#94A3B8] transition-colors cursor-pointer shadow-xs"
              title={language === 'en' ? 'Record again' : 'Rekam Ulang'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleDeleteAudio}
              className="p-1 sm:p-1.5 rounded-xl neumorph-card text-rose-500 hover:text-rose-600 transition-colors cursor-pointer shadow-xs"
              title={language === 'en' ? 'Delete recording' : 'Hapus rekaman'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 sm:p-1.5 rounded-xl text-[#707E94] hover:text-[#18234A] dark:text-[#94A3B8] dark:hover:text-white transition-colors cursor-pointer ml-0.5"
                title="Tutup bilah pemutar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      );
    }

    // Default: Show clean prompt to record voice test
    return (
      <div className="flex items-center justify-between gap-2 h-9 sm:h-10 px-2.5 sm:px-3 bg-white/95 dark:bg-[#182236]/95 border border-black/10 dark:border-white/10 rounded-2xl shadow-md w-full backdrop-blur-md animate-in fade-in select-none">
        <div className="flex items-center gap-2 min-w-0">
          <Mic className="w-3.5 h-3.5 text-[#FF6F3D] shrink-0" />
          <span className="text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] truncate">
            {language === 'en' ? 'Voice Test (Hafalan)' : 'Tes Rekaman Hafalan'}
          </span>
          {micError && (
            <span className="text-[10px] text-rose-500 font-medium truncate">({micError})</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={startRecording}
            className="px-2.5 sm:px-3 py-1 rounded-xl bg-gradient-to-r from-[#FF7E4A] to-[#E65320] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            <Mic className="w-3 h-3" />
            <span>{language === 'en' ? 'Record Voice' : 'Mulai Rekam'}</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-[#707E94] hover:text-[#18234A] dark:text-[#94A3B8] dark:hover:text-white transition-colors cursor-pointer"
              title="Tutup bilah rekam"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VARIANT: REVIEW FRONT (Record on Front Card / Question)
  // Dedicated to recording spoken answers during active recall
  // ==========================================
  if (variant === 'review-front' || variant === 'review-dock') {
    if (isRecording) {
      return (
        <div className="flex items-center gap-1.5 bg-rose-500/15 dark:bg-rose-950/50 border border-rose-500/30 px-2.5 sm:px-3 h-11 sm:h-12 rounded-full animate-in zoom-in-95 duration-150 shadow-xs">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
          </span>
          <span className="font-mono text-xs font-black text-rose-600 dark:text-rose-400 shrink-0">
            {AudioStorageService.formatAudioDuration(recordSeconds)}
          </span>
          <button
            type="button"
            onClick={stopRecording}
            className="w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center cursor-pointer shadow-xs active:scale-95 transition-transform"
            title={language === 'en' ? 'Stop & Save' : 'Selesai & Simpan'}
          >
            <Square className="w-3 h-3 fill-white" />
          </button>
          <button
            type="button"
            onClick={cancelRecording}
            className="w-6 h-6 rounded-full flex items-center justify-center text-[#5E6D88] hover:text-rose-600 dark:text-[#94A3B8] transition-colors cursor-pointer"
            title={language === 'en' ? 'Cancel' : 'Batal'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    if (record && audioUrl) {
      return (
        <div className="flex items-center gap-1 sm:gap-1.5 h-11 sm:h-12 px-0.5">
          <audio
            ref={audioRef}
            src={audioUrl || undefined}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleAudioEnded}
            preload="metadata"
          />
          {/* Circular Play / Pause Button with familiar audio icon */}
          <button
            type="button"
            onClick={togglePlay}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95 shrink-0 ${
              isPlaying
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/30 ring-2 ring-emerald-400 animate-pulse'
                : 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-emerald-600/25 hover:scale-105'
            }`}
            title={isPlaying ? (language === 'en' ? 'Pause' : 'Jeda') : (language === 'en' ? 'Play Recording' : 'Putar Rekaman')}
          >
            {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
          </button>
          
          {/* Quick Retake Voice Note */}
          <button
            type="button"
            onClick={startRecording}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full neumorph-card flex items-center justify-center text-[#5E6D88] hover:text-[#FF6F3D] dark:text-[#94A3B8] transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
            title={language === 'en' ? 'Record Again' : 'Rekam Ulang'}
          >
            <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>

          {/* Quick Delete Voice Note */}
          <button
            type="button"
            onClick={handleDeleteAudio}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full neumorph-card flex items-center justify-center text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
            title={language === 'en' ? 'Delete Recording' : 'Hapus Rekaman'}
          >
            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      );
    }

    // Idle in Review Front: Circular Familiar Microphone Button
    return (
      <div className="relative flex items-center justify-center h-11 sm:h-12">
        {micError && (
          <span className="text-[10px] text-rose-500 font-medium max-w-[80px] truncate mr-1.5">{micError}</span>
        )}
        <button
          type="button"
          onClick={startRecording}
          className={`w-11 sm:w-12 h-11 sm:h-12 rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer shrink-0 border border-white/20 active:scale-95 ${
            record && audioUrl
              ? 'bg-gradient-to-br from-[#10B981] to-[#059669] text-white shadow-emerald-500/25 ring-2 ring-emerald-400/40 hover:scale-105'
              : 'bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-orange-500/30 hover:scale-105'
          }`}
          title={
            record && audioUrl
              ? (language === 'en' ? 'Voice recorded. Tap to re-record.' : 'Rekaman tersimpan. Klik untuk rekam ulang.')
              : (language === 'en' ? 'Record voice answer' : 'Rekam jawaban suara')
          }
        >
          <Mic className="w-5 h-5 text-white" strokeWidth={2.3} />
        </button>
        {record && audioUrl && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#141C2B] animate-pulse" />
        )}
      </div>
    );
  }

  // ==========================================
  // VARIANT: REVIEW BACK (Minimalist Slim Player on Back Card / Answer)
  // Dedicated to listening to the recorded voice answer above the feedback buttons
  // Zero footprint when no recording exists!
  // ==========================================
  if (variant === 'review-back') {
    // If no recording exists on this card, render nothing!
    if (!record || !audioUrl) {
      return null;
    }

    return (
      <div className="w-full h-9 sm:h-10 px-3 rounded-2xl neumorph-card bg-white/90 dark:bg-[#182236]/90 border border-emerald-500/25 dark:border-emerald-500/15 shadow-2xs flex items-center justify-between gap-2.5 animate-in fade-in slide-in-from-bottom-1 duration-150 shrink-0">
        <audio
          ref={audioRef}
          src={audioUrl || undefined}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleAudioEnded}
          preload="metadata"
        />

        {/* Left: Play/Pause button + time duration */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={togglePlay}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0 ${
              isPlaying
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white ring-2 ring-emerald-400 animate-pulse'
                : 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white hover:scale-105'
            }`}
            title={isPlaying ? (language === 'en' ? 'Pause' : 'Jeda') : (language === 'en' ? 'Play Recording' : 'Putar Rekaman')}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
          </button>

          <span className="font-mono text-[10px] sm:text-[11px] font-bold text-[#18234A] dark:text-[#F8FAFC]">
            <span>{AudioStorageService.formatAudioDuration(currentTime)}</span>
            <span className="opacity-40 mx-1">/</span>
            <span className="text-[#5E6D88] dark:text-[#94A3B8]">{AudioStorageService.formatAudioDuration(duration || record.duration)}</span>
          </span>
        </div>

        {/* Center: Slim Slider Track */}
        <div className="flex-1 min-w-[50px] flex items-center">
          <input
            type="range"
            min={0}
            max={duration || record.duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full accent-emerald-600 h-1.5 bg-black/[0.06] dark:bg-white/[0.08] rounded-full cursor-pointer transition-colors"
            title="Geser posisi pemutaran audio"
          />
        </div>

        {/* Right: Speed cycle, Delete */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              const nextIndex = (SPEED_PRESETS.indexOf(playbackSpeed) + 1) % SPEED_PRESETS.length;
              changeSpeed(SPEED_PRESETS[nextIndex]);
            }}
            className="px-1.5 py-0.5 rounded-lg neumorph-card text-[10px] font-mono font-bold text-[#18234A] dark:text-[#F8FAFC] transition-colors cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
            title="Kecepatan putar"
          >
            {playbackSpeed}×
          </button>
          <button
            type="button"
            onClick={handleDeleteAudio}
            className="p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shadow-2xs active:scale-95"
            title={language === 'en' ? 'Delete recording' : 'Hapus rekaman'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VARIANT 2: CARD / DRAWER / FEEDBACK MODAL
  // Super-Compact, Highly Ordered, Disciplined Layout
  // ==========================================

  // 1. STATE: RECORDING IN PROGRESS (CARD)
  if (isRecording) {
    return (
      <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between gap-2 animate-in fade-in duration-150 neumorph-inset">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
          </span>
          <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 shrink-0">
            {AudioStorageService.formatAudioDuration(recordSeconds)}
          </span>
          <span className="text-xs text-rose-900 dark:text-rose-200 font-medium truncate">
            {language === 'en' ? 'Recording...' : 'Sedang merekam...'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={cancelRecording}
            className="px-2.5 py-1 rounded-xl text-xs font-bold text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A] transition-colors cursor-pointer"
          >
            {language === 'en' ? 'Cancel' : 'Batal'}
          </button>
          <button
            type="button"
            onClick={stopRecording}
            className="px-3 py-1 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <Square className="w-3 h-3 fill-white" />
            <span>{language === 'en' ? 'Save' : 'Simpan'}</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. STATE: RECORDED / PLAYBACK (CARD / SINGLE ROW)
  if (record && audioUrl) {
    return (
      <div className="p-2 sm:p-2.5 rounded-2xl neumorph-card flex items-center justify-between gap-1.5 sm:gap-2 w-full">
        <audio
          ref={audioRef}
          src={audioUrl || undefined}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleAudioEnded}
          preload="metadata"
        />

        {/* Left: Play/Pause, Jump -5s/+5s */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={togglePlay}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95 shrink-0 ${
              isPlaying 
                ? 'bg-gradient-to-br from-[#10B981] to-[#059669] text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)]' 
                : 'bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white shadow-[0_2px_8px_rgba(255,111,61,0.35)] hover:scale-105'
            }`}
            title={isPlaying ? 'Pause' : 'Putar'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
          </button>

          <div className="flex items-center neumorph-inset rounded-xl p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => jumpSeconds(-5)}
              className="px-1.5 py-0.5 rounded-lg text-[10px] font-bold text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A] transition-colors cursor-pointer"
              title="Mundur 5 detik"
            >
              -5s
            </button>
            <button
              type="button"
              onClick={() => jumpSeconds(5)}
              className="px-1.5 py-0.5 rounded-lg text-[10px] font-bold text-[#5E6D88] dark:text-[#94A3B8] hover:text-[#18234A] transition-colors cursor-pointer"
              title="Maju 5 detik"
            >
              +5s
            </button>
          </div>
        </div>

        {/* Center: Audio Seekbar Slider & Current Time */}
        <div className="flex-1 min-w-[50px] flex items-center gap-1.5">
          <input
            type="range"
            min={0}
            max={duration || record.duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full accent-[#FF6F3D] h-2 bg-black/[0.06] dark:bg-white/[0.08] rounded-full cursor-pointer transition-colors"
            title="Geser posisi pemutaran audio"
          />
          <span className="font-mono text-[10px] text-[#5E6D88] dark:text-[#94A3B8] font-bold shrink-0 flex items-center gap-1">
            <span>{AudioStorageService.formatAudioDuration(currentTime)}</span>
            {isPlaying && (
              <span className="flex items-end gap-0.5 h-2.5 px-0.5" title="Sedang memutar (getaran)">
                <span className="w-0.5 bg-[#FF6F3D] rounded-full animate-bounce h-2" style={{ animationDuration: '0.6s' }} />
                <span className="w-0.5 bg-[#FF6F3D] rounded-full animate-bounce h-2.5" style={{ animationDuration: '0.4s' }} />
                <span className="w-0.5 bg-[#FF6F3D] rounded-full animate-bounce h-1.5" style={{ animationDuration: '0.5s' }} />
              </span>
            )}
          </span>
        </div>

        {/* Right: Speed cycle, Retake, Delete */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Speed Cycle Button */}
          <button
            type="button"
            onClick={() => {
              const nextIndex = (SPEED_PRESETS.indexOf(playbackSpeed) + 1) % SPEED_PRESETS.length;
              changeSpeed(SPEED_PRESETS[nextIndex]);
            }}
            className="px-2 py-0.5 rounded-xl neumorph-card text-[10px] font-mono font-bold text-[#18234A] dark:text-[#F8FAFC] transition-colors cursor-pointer shadow-xs active:scale-95"
            title="Kecepatan putar"
          >
            {playbackSpeed}×
          </button>

          {/* Retake Button */}
          <button
            type="button"
            onClick={startRecording}
            className="p-1.5 rounded-xl neumorph-card text-[#5E6D88] hover:text-[#FF6F3D] dark:text-[#94A3B8] transition-colors cursor-pointer shadow-xs active:scale-95"
            title={language === 'en' ? 'Record again' : 'Rekam Ulang'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Direct Delete Button without confirmation step */}
          <button
            type="button"
            onClick={handleDeleteAudio}
            className="p-1.5 rounded-xl text-[#8493AB] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer active:scale-95"
            title={language === 'en' ? 'Delete recording' : 'Hapus rekaman'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // 3. STATE: IDLE (NO RECORDING YET - CARD)
  return (
    <div className="px-3.5 py-2.5 rounded-2xl neumorph-card flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white flex items-center justify-center shrink-0 shadow-2xs">
          <Mic className="w-4 h-4 text-white" />
        </div>
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <span className="text-xs font-bold text-[#18234A] dark:text-[#F8FAFC] whitespace-nowrap">
            {recordingTitle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {micError && (
          <span className="text-[10px] text-rose-500 font-medium truncate max-w-[120px]">{micError}</span>
        )}
        <button
          type="button"
          onClick={startRecording}
          className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-br from-[#FF7E4A] to-[#E65320] text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-[0_2px_8px_rgba(255,111,61,0.35)] cursor-pointer active:scale-95 hover:scale-105"
        >
          <Mic className="w-4 h-4 text-white" strokeWidth={2.2} />
          <span>{language === 'en' ? 'Record' : 'Mulai Rekam'}</span>
        </button>
      </div>
    </div>
  );
};
