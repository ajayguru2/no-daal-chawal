import { useState, useEffect } from 'react';
import { mealPlan, suggestions, history, preferences } from '../api/client';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MealPlan() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff)).toISOString().split('T')[0];
  });
  const [showSuggest, setShowSuggest] = useState(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [mealSuggestions, setMealSuggestions] = useState([]);
  const [rejectedMeals, setRejectedMeals] = useState([]);
  const [showRejectOptions, setShowRejectOptions] = useState(null);
  const [customReasons, setCustomReasons] = useState([]);
  const [showCustomInput, setShowCustomInput] = useState(null);
  const [customReasonText, setCustomReasonText] = useState('');

  const DEFAULT_REJECTION_REASONS = [
    { id: 'too_heavy', label: 'Too heavy' },
    { id: 'too_light', label: 'Too light' },
    { id: 'missing_ingredients', label: 'Missing ingredients' },
    { id: 'had_recently', label: 'Had recently' },
    { id: 'not_in_mood', label: 'Not in the mood' },
    { id: 'too_long', label: 'Takes too long' },
  ];

  useEffect(() => {
    loadPlans();
  }, [weekStart]);

  useEffect(() => {
    loadCustomReasons();
  }, []);

  async function loadCustomReasons() {
    try {
      const result = await preferences.get('rejectionReasons');
      if (result?.value) {
        setCustomReasons(JSON.parse(result.value));
      }
    } catch (err) {
      // No custom reasons saved yet
    }
  }

  async function saveCustomReason(reason) {
    const newReasons = [...customReasons, { id: `custom_${Date.now()}`, label: reason }];
    setCustomReasons(newReasons);
    try {
      await preferences.set('rejectionReasons', JSON.stringify(newReasons));
    } catch (err) {
      console.error('Failed to save custom reason:', err);
    }
  }

  async function loadPlans() {
    setLoading(true);
    try {
      const data = await mealPlan.getWeek(weekStart);
      setPlans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function getWeekDates() {
    const dates = [];
    const start = new Date(weekStart);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
  }

  function getPlanForSlot(date, mealType) {
    const dateStr = date.toISOString().split('T')[0];
    return plans.find(
      (p) =>
        p.date.startsWith(dateStr) &&
        p.mealType === mealType
    );
  }

  async function handleSuggest(date, mealType) {
    setShowSuggest({ date, mealType });
    setRejectedMeals([]);
    setShowRejectOptions(null);
    setSuggestLoading(true);
    try {
      const results = await suggestions.get({ mealType });
      setMealSuggestions(results.suggestions || results);
    } catch (err) {
      console.error(err);
    } finally {
      setSuggestLoading(false);
    }
  }

  async function refreshSuggestions() {
    if (!showSuggest) return;
    setSuggestLoading(true);
    setShowRejectOptions(null);
    try {
      const results = await suggestions.get({
        mealType: showSuggest.mealType,
        rejectedMeals: rejectedMeals.map(r => ({ name: r.name, reason: r.reason }))
      });
      setMealSuggestions(results.suggestions || results);
    } catch (err) {
      console.error(err);
    } finally {
      setSuggestLoading(false);
    }
  }

  function rejectMeal(meal, reasonId) {
    const allReasons = [...DEFAULT_REJECTION_REASONS, ...customReasons];
    const reason = allReasons.find(r => r.id === reasonId);
    setRejectedMeals(prev => [...prev, { ...meal, reason: reason?.label || reasonId }]);
    setMealSuggestions(prev => prev.filter(m => m.name !== meal.name));
    setShowRejectOptions(null);
    setShowCustomInput(null);
  }

  async function assignMeal(date, mealType, meal) {
    try {
      // First, log to history
      await history.log({
        mealName: meal.name,
        cuisine: meal.cuisine,
        mealType: meal.mealType || mealType,
      });

      // Add to plan (with notes containing meal info since we don't save meals to DB)
      await mealPlan.add({
        date: date.toISOString(),
        mealType,
        notes: JSON.stringify(meal),
      });
      setShowSuggest(null);
      setMealSuggestions([]);
      loadPlans();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  async function removePlan(planId) {
    try {
      await mealPlan.delete(planId);
      loadPlans();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  function changeWeek(delta) {
    const current = new Date(weekStart);
    current.setDate(current.getDate() + delta * 7);
    setWeekStart(current.toISOString().split('T')[0]);
  }

  const weekDates = getWeekDates();

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meal Plan</h1>
          <p className="text-gray-500">Plan your week ahead</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeWeek(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ← Prev
          </button>
          <span className="text-sm font-medium px-4">
            {weekDates[0].toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} -{' '}
            {weekDates[6].toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
          </span>
          <button
            onClick={() => changeWeek(1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-8 border-b border-gray-200">
          <div className="p-3 bg-gray-50"></div>
          {weekDates.map((date, i) => (
            <div
              key={i}
              className={`p-3 text-center border-l border-gray-200 ${
                date.toDateString() === new Date().toDateString()
                  ? 'bg-blue-50'
                  : 'bg-gray-50'
              }`}
            >
              <div className="text-xs text-gray-500">{DAYS[i]}</div>
              <div className="font-semibold text-gray-900">{date.getDate()}</div>
            </div>
          ))}
        </div>

        {/* Meal Rows */}
        {MEAL_TYPES.map((mealType) => (
          <div key={mealType} className="grid grid-cols-8 border-b border-gray-200 last:border-b-0">
            <div className="p-3 bg-gray-50 border-r border-gray-200 flex items-center">
              <span className="text-sm font-medium text-gray-700 capitalize">
                {mealType}
              </span>
            </div>
            {weekDates.map((date, i) => {
              const plan = getPlanForSlot(date, mealType);
              const mealData = plan?.notes ? JSON.parse(plan.notes) : null;

              return (
                <div
                  key={i}
                  className={`p-2 border-l border-gray-200 min-h-[80px] ${
                    date.toDateString() === new Date().toDateString()
                      ? 'bg-blue-50/50'
                      : ''
                  }`}
                >
                  {mealData ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs group relative">
                      <div className="font-medium text-gray-800 truncate">
                        {mealData.name}
                      </div>
                      <div className="text-gray-500 truncate">
                        {mealData.prepTime}min
                      </div>
                      <button
                        onClick={() => removePlan(plan.id)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSuggest(date, mealType)}
                      className="w-full h-full min-h-[60px] border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors flex items-center justify-center text-xs"
                    >
                      + Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Suggestion Modal */}
      {showSuggest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Add {showSuggest.mealType} for{' '}
                {showSuggest.date.toLocaleDateString('en-IN', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </h2>
              <button
                onClick={() => {
                  setShowSuggest(null);
                  setMealSuggestions([]);
                  setRejectedMeals([]);
                  setShowRejectOptions(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {suggestLoading ? (
              <div className="text-center py-8 text-gray-500">
                Getting suggestions...
              </div>
            ) : (
              <div className="space-y-4">
                {/* Current suggestions */}
                {mealSuggestions.length > 0 ? (
                  <div className="space-y-3">
                    {mealSuggestions.map((meal, i) => (
                      <div
                        key={i}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {meal.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {meal.cuisine} • {meal.prepTime} min
                            </div>
                            {meal.description && (
                              <div className="text-sm text-gray-600 mt-1 italic">
                                "{meal.description}"
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <div className="relative">
                              <button
                                onClick={() => setShowRejectOptions(showRejectOptions === i ? null : i)}
                                className="text-gray-400 hover:text-red-500 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                title="Not this one"
                              >
                                ✕
                              </button>
                              {showRejectOptions === i && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-[180px]">
                                  <div className="px-3 py-1.5 text-xs text-gray-500 font-medium border-b border-gray-100">
                                    Why not?
                                  </div>
                                  {[...DEFAULT_REJECTION_REASONS, ...customReasons].map(reason => (
                                    <button
                                      key={reason.id}
                                      onClick={() => rejectMeal(meal, reason.id)}
                                      className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      {reason.label}
                                    </button>
                                  ))}
                                  <div className="border-t border-gray-100 mt-1 pt-1">
                                    {showCustomInput === i ? (
                                      <div className="px-2 py-1">
                                        <input
                                          type="text"
                                          value={customReasonText}
                                          onChange={(e) => setCustomReasonText(e.target.value)}
                                          placeholder="Enter reason..."
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          autoFocus
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' && customReasonText.trim()) {
                                              saveCustomReason(customReasonText.trim());
                                              rejectMeal(meal, customReasonText.trim());
                                              setCustomReasonText('');
                                              setShowCustomInput(null);
                                            }
                                            if (e.key === 'Escape') {
                                              setShowCustomInput(null);
                                              setCustomReasonText('');
                                            }
                                          }}
                                        />
                                        <div className="flex gap-1 mt-1">
                                          <button
                                            onClick={() => {
                                              if (customReasonText.trim()) {
                                                saveCustomReason(customReasonText.trim());
                                                rejectMeal(meal, customReasonText.trim());
                                                setCustomReasonText('');
                                                setShowCustomInput(null);
                                              }
                                            }}
                                            className="flex-1 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                                          >
                                            Add
                                          </button>
                                          <button
                                            onClick={() => {
                                              setShowCustomInput(null);
                                              setCustomReasonText('');
                                            }}
                                            className="text-xs text-gray-500 px-2 py-1 hover:bg-gray-100 rounded"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => setShowCustomInput(i)}
                                        className="block w-full text-left px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50"
                                      >
                                        + Other...
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => assignMeal(showSuggest.date, showSuggest.mealType, meal)}
                              className="text-blue-500 hover:text-blue-600 font-medium text-sm"
                            >
                              Select
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No more suggestions available
                  </div>
                )}

                {/* Rejected meals */}
                {rejectedMeals.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="text-xs text-gray-500 mb-2">
                      Rejected ({rejectedMeals.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {rejectedMeals.map((meal, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full"
                        >
                          {meal.name}
                          <span className="text-gray-400">• {meal.reason}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Refresh button */}
                {(rejectedMeals.length > 0 || mealSuggestions.length === 0) && (
                  <button
                    onClick={refreshSuggestions}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>↻</span>
                    Get new suggestions
                    {rejectedMeals.length > 0 && (
                      <span className="text-xs text-gray-400">(based on feedback)</span>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
