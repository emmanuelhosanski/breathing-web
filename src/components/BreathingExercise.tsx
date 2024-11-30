import { useEffect, useState, useRef } from 'react';
import { formatTime } from '@/utils/formatTime';

interface BreathingExerciseProps {
  settings: {
    inhaleTime: number;
    holdTime: number;
    exhaleTime: number;
    duration: number;
  };
  onStop: () => void;
}

type Phase = 'inhale' | 'hold' | 'exhale';

export default function BreathingExercise({ settings, onStop }: BreathingExerciseProps) {
  const [remainingTime, setRemainingTime] = useState(settings.duration * 60);
  const [currentPhase, setCurrentPhase] = useState<Phase>('inhale');
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(settings.inhaleTime);
  const [scale, setScale] = useState(1);
  const inhaleAudioRef = useRef<HTMLAudioElement | null>(null);
  const exhaleAudioRef = useRef<HTMLAudioElement | null>(null);
  const endAudioRef = useRef<HTMLAudioElement | null>(null);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fadeOut = (audio: HTMLAudioElement, duration: number = 200) => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    const steps = 20;
    const stepTime = duration / steps;
    const volumeStep = audio.volume / steps;
    let currentStep = 0;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      const newVolume = Math.max(0, 1 - (currentStep / steps));
      audio.volume = newVolume;

      if (currentStep >= steps) {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
        }
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 1;
      }
    }, stepTime);
  };

  const fadeIn = (audio: HTMLAudioElement, duration: number = 200) => {
    audio.volume = 0;
    audio.currentTime = 0;
    audio.play().catch(console.error);

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    const steps = 20;
    const stepTime = duration / steps;
    let currentStep = 0;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      const newVolume = Math.min(1, currentStep / steps);
      audio.volume = newVolume;

      if (currentStep >= steps) {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
        }
      }
    }, stepTime);
  };

  const playSound = (phase: Phase) => {
    const currentAudio = phase === 'inhale' ? inhaleAudioRef.current : exhaleAudioRef.current;

    // Start new sound immediately
    if (currentAudio) {
      fadeIn(currentAudio);
    }

    // Fade out previous sound with a slight delay to create overlap
    const otherAudio = phase === 'inhale' ? exhaleAudioRef.current : inhaleAudioRef.current;
    if (otherAudio && otherAudio.volume > 0) {
      setTimeout(() => {
        fadeOut(otherAudio);
      }, 200); // 200ms delay before starting fade out
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (endAudioRef.current) {
            endAudioRef.current.currentTime = 0;
            endAudioRef.current.play().catch(console.error);
          }
          setTimeout(() => {
            onStop();
          }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
      [inhaleAudioRef.current, exhaleAudioRef.current].forEach(audio => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    };
  }, [onStop]);

  useEffect(() => {
    const startPhaseTimer = () => {
      if (phaseTimerRef.current) {
        clearInterval(phaseTimerRef.current);
      }

      const currentPhaseDuration = 
        currentPhase === 'inhale' ? settings.inhaleTime :
        currentPhase === 'hold' ? settings.holdTime :
        settings.exhaleTime;

      setPhaseTimeLeft(currentPhaseDuration);

      phaseTimerRef.current = setInterval(() => {
        setPhaseTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(phaseTimerRef.current!);
            return currentPhaseDuration;
          }
          return prev - 1;
        });
      }, 1000);
    };

    startPhaseTimer();

    return () => {
      if (phaseTimerRef.current) {
        clearInterval(phaseTimerRef.current);
      }
    };
  }, [currentPhase, settings]);

  useEffect(() => {
    const animatePhase = () => {
      let phaseInterval: NodeJS.Timeout | null = null;

      switch (currentPhase) {
        case 'inhale':
          playSound('inhale');
          setScale(1);
          const inhaleSteps = settings.inhaleTime * 30;
          let inhaleStep = 0;
          phaseInterval = setInterval(() => {
            inhaleStep++;
            const progress = inhaleStep / inhaleSteps;
            const easeProgress = 1 - Math.cos((progress * Math.PI) / 2);
            setScale(1 + (0.3 * easeProgress));

            // Start fade out slightly later to create overlap with next phase
            if (inhaleStep === inhaleSteps - 3) { // 3 frames = ~100ms at 30fps
              const audio = inhaleAudioRef.current;
              if (audio) {
                fadeOut(audio);
              }
            }

            if (inhaleStep >= inhaleSteps) {
              if (phaseInterval) clearInterval(phaseInterval);
              if (settings.holdTime > 0) {
                setCurrentPhase('hold');
              } else {
                setCurrentPhase('exhale');
              }
            }
          }, 1000 / 30);
          break;

        case 'hold':
          setTimeout(() => {
            setCurrentPhase('exhale');
          }, settings.holdTime * 1000);
          break;

        case 'exhale':
          playSound('exhale');
          const exhaleSteps = settings.exhaleTime * 30;
          let exhaleStep = 0;
          phaseInterval = setInterval(() => {
            exhaleStep++;
            const progress = exhaleStep / exhaleSteps;
            const easeProgress = Math.sin((progress * Math.PI) / 2);
            setScale(1.3 - (0.3 * easeProgress));

            // Start fade out slightly later to create overlap with next phase
            if (exhaleStep === exhaleSteps - 3) { // 3 frames = ~100ms at 30fps
              const audio = exhaleAudioRef.current;
              if (audio) {
                fadeOut(audio);
              }
            }

            if (exhaleStep >= exhaleSteps) {
              if (phaseInterval) clearInterval(phaseInterval);
              setCurrentPhase('inhale');
            }
          }, 1000 / 30);
          break;
      }

      return () => {
        if (phaseInterval) {
          clearInterval(phaseInterval);
        }
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
        }
      };
    };

    const cleanup = animatePhase();
    return cleanup;
  }, [currentPhase, settings]);

  return (
    <div className="space-y-16 text-center">
      <audio ref={inhaleAudioRef} src="/inhale.mp3" />
      <audio ref={exhaleAudioRef} src="/exhale.mp3" />
      <audio ref={endAudioRef} src="/end.mp3" />
      
      <div className="text-5xl font-light">
        {formatTime(remainingTime)}
      </div>

      <div className="relative w-64 h-64 mx-auto">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        />
        <div
          className="absolute inset-0 rounded-full transform-gpu"
          style={{
            transform: `scale(${scale})`,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-light mb-2">
            {currentPhase === 'inhale' ? 'Inspire' : 
             currentPhase === 'hold' ? 'Retiens' : 'Expire'}
          </div>
          <div className="text-4xl">
            {phaseTimeLeft}
          </div>
        </div>
      </div>

      <button
        onClick={onStop}
        className="px-12 py-4 bg-white/20 hover:bg-white/30 rounded-xl transition-colors text-lg"
      >
        Stop
      </button>
    </div>
  );
}
