import { useState, useEffect, useRef } from 'react';
import { suggestions, history, preferences, recipes } from '../api/client';
import MealCard from '../components/MealCard';
import MoodSelector from '../components/MoodSelector';
import RecipeDisplay from '../components/RecipeDisplay';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3001';

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

  // Refinement state
  const [refinementInput, setRefinementInput] = useState('');
  const [conversation, setConversation] = useState([]);
  const inputRef = useRef(null);

  // Recipe state
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [generatingRecipe, setGeneratingRecipe] = useState(false);

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
    setConversation([]);
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

  async function refineWithFeedback(e) {
    e?.preventDefault();
    if (!refinementInput.trim() || loading) return;

    const userMessage = refinementInput.trim();
    setRefinementInput('');
    setLoading(true);

    const newConversation = [...conversation, { role: 'user', content: userMessage }];
    setConversation(newConversation);

    try {
      const response = await fetch(`${API_BASE}/api/suggest/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealType: mealType || 'any',
          conversation: [
            { role: 'assistant', content: 'Here are some meal suggestions.' },
            ...newConversation
          ]
        })
      });

      const data = await response.json();
      setMealSuggestions(data.suggestions || []);

      if (data.message) {
        setConversation(prev => [...prev, { role: 'assistant', content: data.message }]);
      }
    } catch (err) {
      setError('Failed to refine suggestions');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
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

  async function handleGetRecipe(meal) {
    setGeneratingRecipe(true);
    try {
      const recipe = await recipes.generate(meal);
      setCurrentRecipe(recipe);
    } catch (err) {
      alert('Failed to generate recipe: ' + err.message);
    } finally {
      setGeneratingRecipe(false);
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
                onGetRecipe={() => handleGetRecipe(meal)}
              />
            ))}
          </div>

          {/* Conversation history */}
          {conversation.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {conversation.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Refinement Input */}
          <form onSubmit={refineWithFeedback} className="bg-gray-50 rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-2">
              Not quite right? Tell me what you'd prefer:
            </div>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={refinementInput}
                onChange={(e) => setRefinementInput(e.target.value)}
                placeholder="I want something spicier... or Indian chicken curry..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !refinementInput.trim()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Refine
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recipe generating indicator */}
      {generatingRecipe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 flex items-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full" />
            <span className="text-gray-700">Generating recipe...</span>
          </div>
        </div>
      )}

      {/* Recipe display modal */}
      {currentRecipe && (
        <RecipeDisplay
          recipe={currentRecipe}
          onClose={() => setCurrentRecipe(null)}
        />
      )}
    </div>
  );
}
