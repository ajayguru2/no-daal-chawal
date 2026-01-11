import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mealPlan, shopping, history, recipes } from '../api/client';
import MealChat from '../components/MealChat';
import MealPlanDetail from '../components/MealPlanDetail';
import RecipeDisplay from '../components/RecipeDisplay';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MealPlan() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingList, setGeneratingList] = useState(false);
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    // Get next week's Monday
    const diff = today.getDate() - day + (day === 0 ? 1 : 8);
    const nextMonday = new Date(today.setDate(diff));
    return `${nextMonday.getFullYear()}-${String(nextMonday.getMonth() + 1).padStart(2, '0')}-${String(nextMonday.getDate()).padStart(2, '0')}`;
  });
  const [showChat, setShowChat] = useState(null); // { date, mealType }
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [generatingRecipe, setGeneratingRecipe] = useState(false);

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
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
      console.error(err);
    }
  }

  async function removePlan(planId) {
    try {
      await mealPlan.delete(planId);
      loadPlans();
    } catch (err) {
      console.error(err);
    }
  }

  function handleMealClick(plan, mealData) {
    setSelectedPlan({ ...plan, mealData });
  }

  async function handleAteThis() {
    if (!selectedPlan?.mealData) return;
    try {
      await history.log({
        mealName: selectedPlan.mealData.name,
        cuisine: selectedPlan.mealData.cuisine,
        mealType: selectedPlan.mealType,
        calories: selectedPlan.mealData.estimatedCalories,
      });
      await mealPlan.delete(selectedPlan.id);
      setSelectedPlan(null);
      loadPlans();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleViewRecipe() {
    if (!selectedPlan?.mealData) return;
    setGeneratingRecipe(true);
    try {
      const recipe = await recipes.generate(selectedPlan.mealData);
      setCurrentRecipe(recipe);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingRecipe(false);
    }
  }

  async function handleReplaceMeal() {
    if (!selectedPlan) return;
    const planDate = new Date(selectedPlan.date);
    const mealType = selectedPlan.mealType;
    const planId = selectedPlan.id;

    setSelectedPlan(null);
    await mealPlan.delete(planId);
    loadPlans();
    setShowChat({ date: planDate, mealType });
  }

  async function handleDeletePlan() {
    if (!selectedPlan) return;
    try {
      await mealPlan.delete(selectedPlan.id);
      setSelectedPlan(null);
      loadPlans();
    } catch (err) {
      console.error(err);
    }
  }

  function changeWeek(delta) {
    const current = new Date(weekStart);
    current.setDate(current.getDate() + delta * 7);
    setWeekStart(current.toISOString().split('T')[0]);
  }

  async function generateWeek() {
    // Delete existing plans for this week if any
    if (plans.length > 0) {
      for (const plan of plans) {
        await mealPlan.delete(plan.id);
      }
    }

    setGenerating(true);
    try {
      await mealPlan.generateWeek(weekStart);
      await loadPlans();
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  }

  async function generateShoppingList() {
    if (plans.length === 0) return;
    setGeneratingList(true);
    try {
      await shopping.generate(weekStart);
      navigate('/shopping');
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingList(false);
    }
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
        <div className="flex items-center gap-4">
          <button
            onClick={generateWeek}
            disabled={generating}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Generate Week
              </>
            )}
          </button>
          <button
            onClick={generateShoppingList}
            disabled={generatingList || plans.length === 0}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
          >
            {generatingList ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Shopping List
              </>
            )}
          </button>
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
                    <button
                      onClick={() => handleMealClick(plan, mealData)}
                      className="w-full bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs text-left hover:ring-2 hover:ring-emerald-300 hover:border-emerald-300 transition-all cursor-pointer"
                    >
                      <div className="font-medium text-gray-800 truncate">
                        {mealData.name}
                      </div>
                      <div className="text-gray-500 truncate">
                        {mealData.prepTime}min
                      </div>
                    </button>
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

      {/* Meal Detail Modal */}
      {selectedPlan && (
        <MealPlanDetail
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onAteThis={handleAteThis}
          onReplace={handleReplaceMeal}
          onDelete={handleDeletePlan}
          onViewRecipe={handleViewRecipe}
          generatingRecipe={generatingRecipe}
        />
      )}

      {/* Recipe Display Modal */}
      {currentRecipe && (
        <RecipeDisplay
          recipe={currentRecipe}
          onClose={() => setCurrentRecipe(null)}
        />
      )}
    </div>
  );
}
