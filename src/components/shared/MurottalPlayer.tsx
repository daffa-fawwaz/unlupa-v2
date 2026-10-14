import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { getQuranPageAudioUrl } from '../../data/quranData';

interface Props {
  pageNumber: number;
}

export const MurottalPlayer: React.FC<Props> = ({ pageNumber }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioUrl = getQuranPageAudioUrl(pageNumber);

  useEffect(() => {
    // Reset when page changes
    setIsPlaying(false);
    setIsLoading(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [pageNumber]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Audio playback error:", err);
          setIsLoading(false);
          setIsPlaying(false);
        });
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="flex items-center gap-1.5 clay-inset px-2 py-1 rounded-full">
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        onEnded={() => setIsPlaying(false)}
        preload="none"
      />
      
      <button
        onClick={togglePlay}
        disabled={isLoading}
        className={`w-6 h-6 flex items-center justify-center rounded-full text-white transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs disabled:opacity-50 ${
          isPlaying ? 'bg-emerald-500' : 'clay-btn-primary'
        }`}
        title={isPlaying ? "Jeda Murottal" : "Putar Murottal (Mishary Alafasy)"}
      >
        {isLoading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-3 h-3" />
        ) : (
          <Play className="w-3 h-3 ml-0.5" />
        )}
      </button>

      <button
        onClick={toggleMute}
        className="w-6 h-6 flex items-center justify-center rounded-full text-[#707E94] hover:text-[#1B254B] dark:text-[#94A3B8] dark:hover:text-white transition-colors cursor-pointer"
        title={isMuted ? "Bunyikan" : "Bisukan"}
      >
        {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};

