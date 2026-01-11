import { useState, useEffect } from 'react';
import { mealPlan } from '../api/client';
import MealChat from '../components/MealChat';

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
  const [showChat, setShowChat] = useState(null); // { date, mealType }

  useEffect(() => {
    loadPlans();
  }, [weekStart]);

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

  async function handleSelectMeal(meal) {
    if (!showChat) return;

    try {
      // Add to plan (don't log to history - that happens when meal is eaten)
      await mealPlan.add({
        date: showChat.date.toISOString(),
        mealType: showChat.mealType,
        notes: JSON.stringify(meal),
      });

      setShowChat(null);
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
                      onClick={() => setShowChat({ date, mealType })}
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

      {/* Chat Modal */}
      {showChat && (
        <MealChat
          mealType={showChat.mealType}
          onSelectMeal={handleSelectMeal}
          onClose={() => setShowChat(null)}
        />
      )}
    </div>
  );
}
