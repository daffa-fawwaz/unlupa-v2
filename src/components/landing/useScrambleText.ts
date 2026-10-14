import { useState, useEffect } from 'react';

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_//-\\<>[]=';

export function useScrambleText(targetText: string, trigger: boolean = true, durationMs: number = 1200) {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    if (!trigger) {
      setDisplayText(targetText);
      return;
    }

    let frame = 0;
    const totalFrames = Math.floor(durationMs / 30);
    const interval = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      
      let result = '';
      for (let i = 0; i < targetText.length; i++) {
        if (targetText[i] === ' ') {
          result += ' ';
          continue;
        }
        
        // Character revealed when progress passes its position threshold
        const charThreshold = (i / targetText.length) * 0.75;
        if (progress > charThreshold) {
          result += targetText[i];
        } else {
          result += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
      }

      setDisplayText(result);

      if (frame >= totalFrames) {
        clearInterval(interval);
        setDisplayText(targetText);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [targetText, trigger, durationMs]);

  return displayText;
}
