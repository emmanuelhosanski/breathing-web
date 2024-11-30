import { useState } from 'react';

interface SetupFormProps {
  initialValues: {
    inhaleTime: number;
    holdTime: number;
    exhaleTime: number;
    duration: number;
  };
  onStart: (values: SetupFormProps['initialValues']) => void;
}

const PRESET_MODES = [
  { name: 'Mode 1', values: { inhaleTime: 4, holdTime: 6, exhaleTime: 7, duration: 6 } },
  { name: 'Mode 2', values: { inhaleTime: 5, holdTime: 0, exhaleTime: 6, duration: 7 } },
];

const FAVORITE_MODE_KEY = 'breathing-favorite-mode';

export default function SetupForm({ initialValues, onStart }: SetupFormProps) {
  const [values, setValues] = useState(initialValues);
  const [favoriteMode, setFavoriteMode] = useState<typeof initialValues | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(FAVORITE_MODE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(values);
  };

  const applyPreset = (preset: typeof PRESET_MODES[0]) => {
    setValues(preset.values);
  };

  const saveFavorite = () => {
    localStorage.setItem(FAVORITE_MODE_KEY, JSON.stringify(values));
    setFavoriteMode(values);
  };

  const applyFavorite = () => {
    if (favoriteMode) {
      setValues(favoriteMode);
    }
  };

  const clearFavorite = () => {
    localStorage.removeItem(FAVORITE_MODE_KEY);
    setFavoriteMode(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white/10 p-8 rounded-2xl backdrop-blur-sm w-full max-w-md">
      <div className="grid grid-cols-3 gap-4">
        {PRESET_MODES.map((preset, index) => (
          <button
            key={index}
            type="button"
            onClick={() => applyPreset(preset)}
            className="bg-white/5 hover:bg-white/10 p-3 rounded-xl transition-colors text-center group"
          >
            <div className="font-medium group-hover:text-teal-300 transition-colors">{preset.name}</div>
            <div className="text-sm opacity-75 mt-1">
              {preset.values.inhaleTime}-{preset.values.holdTime}-{preset.values.exhaleTime}
            </div>
            <div className="text-xs opacity-75 mt-1">{preset.values.duration}min</div>
          </button>
        ))}
        <button
          type="button"
          onClick={favoriteMode ? applyFavorite : saveFavorite}
          className="bg-white/5 hover:bg-white/10 p-3 rounded-xl transition-colors text-center group relative"
          title={favoriteMode ? "Click to apply favorite" : "Click to save current settings"}
        >
          <div className="font-medium group-hover:text-teal-300 transition-colors">
            {favoriteMode ? '❤️' : '🤍'}
          </div>
          {favoriteMode && (
            <>
              <div className="text-sm opacity-75 mt-1">
                {favoriteMode.inhaleTime}-{favoriteMode.holdTime}-{favoriteMode.exhaleTime}
              </div>
              <div className="text-xs opacity-75 mt-1">{favoriteMode.duration}min</div>
            </>
          )}
          {!favoriteMode && (
            <div className="text-xs opacity-75 mt-2">Mettre en favori</div>
          )}
        </button>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <label className="flex items-center justify-between text-lg group">
            <span className="group-hover:text-teal-300 transition-colors">Inspiration</span>
            <span className="font-mono bg-white/10 px-3 py-1 rounded-lg ml-4">{values.inhaleTime}s</span>
          </label>
          <input
            type="range"
            name="inhaleTime"
            min="0"
            max="10"
            value={values.inhaleTime}
            onChange={handleChange}
            className="w-full accent-teal-500"
          />
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between text-lg group">
            <span className="group-hover:text-teal-300 transition-colors">Suspension</span>
            <span className="font-mono bg-white/10 px-3 py-1 rounded-lg ml-4">{values.holdTime}s</span>
          </label>
          <input
            type="range"
            name="holdTime"
            min="0"
            max="10"
            value={values.holdTime}
            onChange={handleChange}
            className="w-full accent-teal-500"
          />
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between text-lg group">
            <span className="group-hover:text-teal-300 transition-colors">Expiration</span>
            <span className="font-mono bg-white/10 px-3 py-1 rounded-lg ml-4">{values.exhaleTime}s</span>
          </label>
          <input
            type="range"
            name="exhaleTime"
            min="0"
            max="10"
            value={values.exhaleTime}
            onChange={handleChange}
            className="w-full accent-teal-500"
          />
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between text-lg group">
            <span className="group-hover:text-teal-300 transition-colors">Exercise</span>
            <span className="font-mono bg-white/10 px-3 py-1 rounded-lg ml-4">{values.duration}min</span>
          </label>
          <input
            type="range"
            name="duration"
            min="1"
            max="20"
            value={values.duration}
            onChange={handleChange}
            className="w-full accent-teal-500"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-teal-500 hover:bg-teal-400 text-white py-3 px-6 rounded-xl text-lg font-medium transition-colors"
      >
        Démarrer
      </button>

      {favoriteMode && (
        <button
          type="button"
          onClick={clearFavorite}
          className="w-full mt-4 py-2 px-4 text-sm text-white/50 hover:text-white/75 transition-colors"
        >
          Effacer favori
        </button>
      )}
    </form>
  );
}
