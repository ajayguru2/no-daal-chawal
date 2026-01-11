import { useState, useEffect } from 'react';
import { suggestions, history, preferences } from '../api/client';
import MealCard from '../components/MealCard';
import MoodSelector from '../components/MoodSelector';

const CUISINES = [
  { value: '', label: 'Any cuisine' },
  { value: 'north_indian', label: 'North Indian' },
  { value: 'south_indian', label: 'South Indian' },
  { value: 'continental', label: 'Continental' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'mediterranean', label: 'Mediterranean' },
];

const MEAL_TYPES = [
  { value: '', label: 'Any meal' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

const TIME_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour+' },
];

export default function Home() {
  const [mood, setMood] = useState('');
  const [timeAvailable, setTimeAvailable] = useState(30);
  const [cuisine, setCuisine] = useState('');
  const [mealType, setMealType] = useState('');
  const [mealSuggestions, setMealSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [calorieInfo, setCalorieInfo] = useState(null);
  const [dailyGoal, setDailyGoal] = useState(2000);

  useEffect(() => {
    loadCalorieInfo();
  }, []);

  async function loadCalorieInfo() {
    try {
      const [todayData, goalPref] = await Promise.all([
        history.getTodayCalories(),
        preferences.get('dailyCalorieGoal')
      ]);
      setCalorieInfo(todayData);
      if (goalPref.value) {
        setDailyGoal(parseInt(goalPref.value));
      }
    } catch (err) {
      console.error('Failed to load calorie info:', err);
    }
  }

  async function getSuggestions() {
    setLoading(true);
    setError('');
    try {
      const result = await suggestions.get({
        mood,
        timeAvailable,
        cuisine,
        mealType,
      });
      setMealSuggestions(result.suggestions || result);
      if (result.calorieInfo) {
        setCalorieInfo(prev => ({
          ...prev,
          ...result.calorieInfo
        }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAteThis(meal) {
    try {
      await history.log({
        mealName: meal.name,
        cuisine: meal.cuisine,
        mealType: meal.mealType,
        calories: meal.estimatedCalories,
      });
      await loadCalorieInfo();
      alert(`"${meal.name}" logged!${meal.estimatedCalories ? ` (${meal.estimatedCalories} kcal)` : ''}`);
    } catch (err) {
      alert('Failed to log meal: ' + err.message);
    }
  }

  const consumed = calorieInfo?.totalCalories || 0;
  const remaining = dailyGoal - consumed;
  const progressPercent = Math.min((consumed / dailyGoal) * 100, 100);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">What should we eat?</h1>
        <p className="text-gray-500 mt-2">Escape the boring meal rut. Find something exciting.</p>
      </div>

      {/* Calorie Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Today's Calories</span>
          <span className="text-sm text-gray-500">
            {consumed} / {dailyGoal} kcal
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              consumed > dailyGoal
                ? 'bg-red-500'
                : consumed > dailyGoal * 0.8
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className={`text-xs ${remaining > 0 ? 'text-gray-500' : 'text-red-500'}`}>
            {remaining > 0
              ? `${remaining} kcal remaining`
              : `${Math.abs(remaining)} kcal over budget`}
          </span>
          {calorieInfo?.mealCount > 0 && (
            <span className="text-xs text-gray-400">
              {calorieInfo.mealCount} meal{calorieInfo.mealCount !== 1 ? 's' : ''} logged
            </span>
          )}
        </div>
      </div>

      {/* Mood Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">How are you feeling?</h2>
        <MoodSelector value={mood} onChange={setMood} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time available
            </label>
            <div className="flex flex-wrap gap-2">
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTimeAvailable(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    timeAvailable === opt.value
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cuisine */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cuisine preference
            </label>
            <select
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {CUISINES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Meal Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meal type
            </label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {MEAL_TYPES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Suggest Button */}
        <div className="mt-6 text-center">
          <button
            onClick={getSuggestions}
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-3 rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Thinking...' : 'Suggest Something Delicious'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Suggestions */}
      {mealSuggestions.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">Here's what I suggest:</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mealSuggestions.map((meal, index) => (
              <MealCard
                key={index}
                meal={meal}
                onAteThis={() => handleAteThis(meal)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
