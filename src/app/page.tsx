'use client';

import { useState } from 'react';
import BreathingExercise from '@/components/BreathingExercise';
import SetupForm from '@/components/SetupForm';

export default function Home() {
  const [settings, setSettings] = useState({
    inhaleTime: 4,
    holdTime: 0,
    exhaleTime: 4,
    duration: 5,
  });
  const [isExerciseActive, setIsExerciseActive] = useState(false);

  const startExercise = (values: typeof settings) => {
    setSettings(values);
    setIsExerciseActive(true);
  };

  const stopExercise = () => {
    setIsExerciseActive(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-700 to-blue-900 text-white">
      <div className="max-w-md mx-auto min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
        <div 
          className="text-6xl mb-12 transition-transform duration-[4s] ease-in-out animate-pulse"
          style={{ 
            animation: 'breathe 8s infinite ease-in-out',
          }}
        >
          🫀
        </div>
        <style jsx>{`
          @keyframes breathe {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        `}</style>
        
        {isExerciseActive ? (
          <BreathingExercise
            settings={settings}
            onStop={stopExercise}
          />
        ) : (
          <SetupForm
            initialValues={settings}
            onStart={startExercise}
          />
        )}
      </div>
    </main>
  );
}
