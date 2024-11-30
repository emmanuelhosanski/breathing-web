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
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onStop();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
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
    const playSound = (phase: Phase) => {
      if (phase === 'inhale' && inhaleAudioRef.current) {
        inhaleAudioRef.current.currentTime = 0;
        inhaleAudioRef.current.play().catch(console.error);
      } else if (phase === 'exhale' && exhaleAudioRef.current) {
        exhaleAudioRef.current.currentTime = 0;
        exhaleAudioRef.current.play().catch(console.error);
      }
    };

    const animatePhase = () => {
      switch (currentPhase) {
        case 'inhale':
          playSound('inhale');
          setScale(1);
          const inhaleSteps = settings.inhaleTime * 30; // 30fps for smoother performance
          let inhaleStep = 0;
          const inhaleInterval = setInterval(() => {
            inhaleStep++;
            const progress = inhaleStep / inhaleSteps;
            const easeProgress = 1 - Math.cos((progress * Math.PI) / 2); // Easing function
            setScale(1 + (0.3 * easeProgress));
            if (inhaleStep >= inhaleSteps) {
              clearInterval(inhaleInterval);
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
          const exhaleSteps = settings.exhaleTime * 30; // 30fps for smoother performance
          let exhaleStep = 0;
          const exhaleInterval = setInterval(() => {
            exhaleStep++;
            const progress = exhaleStep / exhaleSteps;
            const easeProgress = Math.sin((progress * Math.PI) / 2); // Easing function
            setScale(1.3 - (0.3 * easeProgress));
            if (exhaleStep >= exhaleSteps) {
              clearInterval(exhaleInterval);
              setCurrentPhase('inhale');
            }
          }, 1000 / 30);
          break;
      }
    };

    animatePhase();
  }, [currentPhase, settings]);

  return (
    <div className="space-y-16 text-center">
      <audio ref={inhaleAudioRef} src="/inhale.mp3" />
      <audio ref={exhaleAudioRef} src="/exhale.mp3" />
      
      <div className="text-5xl font-light font-mono">
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
          <div className="text-4xl font-mono">
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
