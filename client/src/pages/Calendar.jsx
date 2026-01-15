import { useState, useEffect } from 'react';
import { history, mealPlan } from '../api/client';
import StarRating from '../components/StarRating';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3001';

const CUISINE_COLORS = {
  north_indian: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-400' },
  south_indian: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-400' },
  chinese: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-400' },
  continental: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-400' },
  mediterranean: { bg: 'bg-cyan-100', text: 'text-cyan-700', dot: 'bg-cyan-400' },
  indian_fusion: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-400' },
  other: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' }
};

const MEAL_TYPE_ICONS = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍪'
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mealsByDate, setMealsByDate] = useState({});
  const [plannedByDate, setPlannedByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [stats, setStats] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    loadCalendarData();
  }, [year, month]);

  async function loadCalendarData() {
    setLoading(true);
    try {
      const [calendarData, statsData, planData] = await Promise.all([
        history.getCalendar(year, month),
        history.getStats(30),
        mealPlan.getMonth(year, month)
      ]);

      setMealsByDate(calendarData);
      setStats(statsData);

      // Group planned meals by date (filter out completed ones to avoid duplicates with eaten meals)
      const plannedMap = {};
      for (const plan of planData) {
        // Skip completed meals - they're already shown in the eaten section
        if (plan.completed) continue;

        const dateKey = plan.date.split('T')[0];
        if (!plannedMap[dateKey]) {
          plannedMap[dateKey] = [];
        }
        // Parse meal data from notes
        let mealData = null;
        try {
          mealData = plan.notes ? JSON.parse(plan.notes) : null;
        } catch {}

        plannedMap[dateKey].push({
          ...plan,
          mealData,
          isPlanned: true
        });
      }
      setPlannedByDate(plannedMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function getCalendarDays() {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];

    // Previous month's trailing days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Next month's leading days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  }

  function changeMonth(delta) {
    setCurrentDate(new Date(year, month + delta, 1));
    setSelectedDay(null);
  }

  function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getMealsForDate(date) {
    const dateKey = formatDateKey(date);
    return mealsByDate[dateKey] || [];
  }

  function getPlannedForDate(date) {
    const dateKey = formatDateKey(date);
    return plannedByDate[dateKey] || [];
  }

  function getDayCalories(date) {
    const meals = getMealsForDate(date);
    return meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  }

  function getPlannedCalories(date) {
    const planned = getPlannedForDate(date);
    return planned.reduce((sum, p) => sum + (p.mealData?.estimatedCalories || 0), 0);
  }

  function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  function getCuisineColor(cuisine) {
    return CUISINE_COLORS[cuisine] || CUISINE_COLORS.other;
  }

  async function markAsEaten(plan) {
    const mealData = plan.mealData;
    if (!mealData) return;

    try {
      // Log to history with the planned date
      await history.log({
        mealName: mealData.name,
        cuisine: mealData.cuisine,
        mealType: plan.mealType,
        calories: mealData.estimatedCalories,
      });

      // Optionally delete from meal plan
      await mealPlan.delete(plan.id);

      // Reload data
      loadCalendarData();
    } catch (err) {
      console.error(err);
    }
  }

  const calendarDays = getCalendarDays();
  const selectedMeals = selectedDay ? getMealsForDate(selectedDay) : [];
  const selectedPlanned = selectedDay ? getPlannedForDate(selectedDay) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Food Calendar</h1>
          <p className="text-gray-500">Your meal journey over time</p>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.totalMeals}</div>
            <div className="text-xs text-gray-500">Meals (30 days)</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {Object.keys(stats.cuisineDistribution || {}).length}
            </div>
            <div className="text-xs text-gray-500">Cuisines tried</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round((stats.varietyScore || 0) * 100)}%
            </div>
            <div className="text-xs text-gray-500">Variety score</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stats.repeatedMeals?.length || 0}
            </div>
            <div className="text-xs text-gray-500">Repeat favorites</div>
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* Calendar */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Month Navigation */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              ← Prev
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {MONTHS[month]} {year}
            </h2>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              Next →
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {DAYS.map((day) => (
              <div
                key={day}
                className="p-2 text-center text-xs font-medium text-gray-500 bg-gray-50"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : (
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const meals = getMealsForDate(day.date);
                const planned = getPlannedForDate(day.date);
                const dayCalories = getDayCalories(day.date);
                const plannedCals = getPlannedCalories(day.date);
                const isSelected =
                  selectedDay?.toDateString() === day.date.toDateString();

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDay(day.date)}
                    className={`min-h-[100px] p-2 border-b border-r border-gray-100 cursor-pointer transition-colors ${
                      !day.isCurrentMonth ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
                    } ${isSelected ? 'ring-2 ring-inset ring-blue-400 bg-blue-50' : ''} ${
                      isToday(day.date) && !isSelected ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    {/* Date Number */}
                    <div className="flex items-start justify-between">
                      <div
                        className={`text-sm font-medium ${
                          !day.isCurrentMonth
                            ? 'text-gray-300'
                            : isToday(day.date)
                            ? 'text-blue-600'
                            : 'text-gray-700'
                        }`}
                      >
                        {day.date.getDate()}
                        {isToday(day.date) && (
                          <span className="ml-1 text-xs text-blue-500">today</span>
                        )}
                      </div>
                      {/* Calorie total for the day */}
                      {(dayCalories > 0 || plannedCals > 0) && day.isCurrentMonth && (
                        <span className="text-xs font-medium text-gray-400">
                          {dayCalories > 0 ? dayCalories : `~${plannedCals}`}
                        </span>
                      )}
                    </div>

                    {/* Eaten Meal Indicators */}
                    {meals.length > 0 && day.isCurrentMonth && (
                      <div className="space-y-1">
                        {meals.slice(0, 2).map((meal, i) => {
                          const colors = getCuisineColor(meal.cuisine);
                          return (
                            <div
                              key={`eaten-${i}`}
                              className={`text-xs px-1.5 py-0.5 rounded truncate ${colors.bg} ${colors.text}`}
                              title={meal.mealName}
                            >
                              <span className="mr-1">
                                {MEAL_TYPE_ICONS[meal.mealType] || '🍽️'}
                              </span>
                              <span className="truncate">{meal.mealName}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Planned Meal Indicators */}
                    {planned.length > 0 && day.isCurrentMonth && (
                      <div className="space-y-1 mt-1">
                        {planned.slice(0, meals.length > 0 ? 1 : 2).map((plan, i) => {
                          const mealData = plan.mealData;
                          const colors = mealData ? getCuisineColor(mealData.cuisine) : CUISINE_COLORS.other;
                          return (
                            <div
                              key={`plan-${i}`}
                              className={`text-xs px-1.5 py-0.5 rounded truncate border-2 border-dashed ${colors.bg} ${colors.text} opacity-70`}
                              title={`Planned: ${mealData?.name || plan.mealType}`}
                            >
                              <span className="mr-1">
                                {MEAL_TYPE_ICONS[plan.mealType] || '📋'}
                              </span>
                              <span className="truncate">{mealData?.name || plan.mealType}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* More indicator */}
                    {(meals.length + planned.length) > 3 && day.isCurrentMonth && (
                      <div className="text-xs text-gray-400 text-center">
                        +{meals.length + planned.length - 3} more
                      </div>
                    )}

                    {/* Empty state dot for days with no meals */}
                    {meals.length === 0 && planned.length === 0 && day.isCurrentMonth && (
                      <div className="flex justify-center pt-2">
                        <div className="w-2 h-2 rounded-full bg-gray-200" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Day Detail Panel */}
        <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-200 p-4 max-h-[600px] overflow-y-auto">
          {selectedDay ? (
            <>
              <h3 className="font-semibold text-gray-900 mb-1">
                {selectedDay.toLocaleDateString('en-IN', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  {selectedMeals.length} eaten{selectedPlanned.length > 0 ? `, ${selectedPlanned.length} planned` : ''}
                </p>
                {(getDayCalories(selectedDay) > 0 || getPlannedCalories(selectedDay) > 0) && (
                  <span className="text-sm font-medium text-gray-700">
                    {getDayCalories(selectedDay) > 0
                      ? `${getDayCalories(selectedDay)} kcal`
                      : `~${getPlannedCalories(selectedDay)} kcal`}
                  </span>
                )}
              </div>

              {/* Eaten Meals */}
              {selectedMeals.length > 0 && (
                <div className="space-y-3 mb-4">
                  <h4 className="text-xs font-medium text-gray-500 uppercase">Eaten</h4>
                  {selectedMeals.map((meal) => {
                    const colors = getCuisineColor(meal.cuisine);
                    return (
                      <div
                        key={meal.id}
                        className={`rounded-lg p-3 ${colors.bg}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span>{MEAL_TYPE_ICONS[meal.mealType] || '🍽️'}</span>
                              <span className={`font-medium ${colors.text}`}>
                                {meal.mealName}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 capitalize">
                              {meal.cuisine.replace('_', ' ')} • {meal.mealType}
                              {meal.calories && (
                                <span className="ml-1">• {meal.calories} kcal</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {meal.rating && (
                          <div className="mt-2">
                            <StarRating value={meal.rating} readonly size="sm" />
                          </div>
                        )}
                        {meal.notes && (
                          <div className="mt-2 text-xs text-gray-600 italic">
                            "{meal.notes}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Planned Meals */}
              {selectedPlanned.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-gray-500 uppercase">Planned</h4>
                  {selectedPlanned.map((plan) => {
                    const mealData = plan.mealData;
                    const colors = mealData ? getCuisineColor(mealData.cuisine) : CUISINE_COLORS.other;
                    return (
                      <div
                        key={plan.id}
                        className={`rounded-lg p-3 ${colors.bg} border-2 border-dashed opacity-80`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{MEAL_TYPE_ICONS[plan.mealType] || '📋'}</span>
                          <span className={`font-medium ${colors.text}`}>
                            {mealData?.name || plan.mealType}
                          </span>
                        </div>
                        {mealData && (
                          <div className="text-xs text-gray-500 mt-1 capitalize">
                            {mealData.cuisine?.replace('_', ' ')} • {plan.mealType}
                            {mealData.estimatedCalories && (
                              <span className="ml-1">• ~{mealData.estimatedCalories} kcal</span>
                            )}
                          </div>
                        )}
                        {mealData?.description && (
                          <div className="mt-2 text-xs text-gray-600 italic">
                            "{mealData.description}"
                          </div>
                        )}
                        {mealData && (
                          <button
                            onClick={() => markAsEaten(plan)}
                            className="mt-2 w-full text-xs py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                          >
                            I ate this!
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty state */}
              {selectedMeals.length === 0 && selectedPlanned.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🍽️</div>
                  <p className="text-gray-500 text-sm">No meals</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Plan meals or log from "What to Eat?"
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📅</div>
              <p className="text-gray-500 text-sm">Select a day</p>
              <p className="text-gray-400 text-xs mt-1">
                Click on any day to see meal details
              </p>
            </div>
          )}

          {/* Cuisine Legend */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-xs font-medium text-gray-500 mb-2">Cuisine Legend</h4>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(CUISINE_COLORS).slice(0, 6).map(([cuisine, colors]) => (
                <div key={cuisine} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                  <span className="text-xs text-gray-600 capitalize">
                    {cuisine.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
