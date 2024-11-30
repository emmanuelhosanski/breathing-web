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

interface AudioWithGain {
  audio: HTMLAudioElement;
  gainNode: GainNode;
  context: AudioContext;
  source: MediaElementAudioSourceNode;
}

export default function BreathingExercise({ settings, onStop }: BreathingExerciseProps) {
  const [remainingTime, setRemainingTime] = useState(settings.duration * 60);
  const [currentPhase, setCurrentPhase] = useState<Phase>('inhale');
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(settings.inhaleTime);
  const [scale, setScale] = useState(1);
  const inhaleAudioRef = useRef<HTMLAudioElement | null>(null);
  const exhaleAudioRef = useRef<HTMLAudioElement | null>(null);
  const endAudioRef = useRef<HTMLAudioElement | null>(null);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioWithGain | null>(null);

  const setupAudio = (audioElement: HTMLAudioElement) => {
    const context = new AudioContext();
    const source = context.createMediaElementSource(audioElement);
    const gainNode = context.createGain();
    source.connect(gainNode);
    gainNode.connect(context.destination);
    return { audio: audioElement, gainNode, context, source };
  };

  const fadeOutAndStop = (audioWithGain: AudioWithGain, duration: number = 0.5) => {
    const { gainNode, context } = audioWithGain;
    const currentTime = context.currentTime;
    gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
    gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);
    setTimeout(() => {
      audioWithGain.audio.pause();
      audioWithGain.audio.currentTime = 0;
      gainNode.gain.setValueAtTime(1, context.currentTime);
    }, duration * 1000);
  };

  const playSound = async (phase: Phase) => {
    if (audioContextRef.current) {
      fadeOutAndStop(audioContextRef.current);
    }

    const audioElement = phase === 'inhale' ? inhaleAudioRef.current : exhaleAudioRef.current;
    if (!audioElement) return;

    try {
      audioContextRef.current = setupAudio(audioElement);
      audioElement.currentTime = 0;
      await audioElement.play();
    } catch (error) {
      console.error('Error playing sound:', error);
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
      if (audioContextRef.current) {
        fadeOutAndStop(audioContextRef.current);
      }
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
      switch (currentPhase) {
        case 'inhale':
          playSound('inhale');
          setScale(1);
          const inhaleSteps = settings.inhaleTime * 30;
          let inhaleStep = 0;
          const inhaleInterval = setInterval(() => {
            inhaleStep++;
            const progress = inhaleStep / inhaleSteps;
            const easeProgress = 1 - Math.cos((progress * Math.PI) / 2);
            setScale(1 + (0.3 * easeProgress));
            if (inhaleStep >= inhaleSteps) {
              clearInterval(inhaleInterval);
              if (settings.holdTime > 0) {
                if (audioContextRef.current) {
                  fadeOutAndStop(audioContextRef.current);
                }
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
          const exhaleInterval = setInterval(() => {
            exhaleStep++;
            const progress = exhaleStep / exhaleSteps;
            const easeProgress = Math.sin((progress * Math.PI) / 2);
            setScale(1.3 - (0.3 * easeProgress));
            if (exhaleStep >= exhaleSteps) {
              clearInterval(exhaleInterval);
              if (audioContextRef.current) {
                fadeOutAndStop(audioContextRef.current);
              }
              setCurrentPhase('inhale');
            }
          }, 1000 / 30);
          break;
      }
    };

    animatePhase();

    return () => {
      if (audioContextRef.current) {
        fadeOutAndStop(audioContextRef.current);
      }
    };
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
