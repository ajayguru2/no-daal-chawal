import { useState, useEffect } from 'react';
import { history, reviews } from '../api/client';
import StarRating from '../components/StarRating';
import DayReviewCard from '../components/DayReviewCard';

export default function Reviews() {
  const [activeTab, setActiveTab] = useState('meals');
  const [mealHistory, setMealHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff)).toISOString().split('T')[0];
  });
  const [weekReview, setWeekReview] = useState({
    varietyBalance: 0,
    effortVsSatisfaction: 0,
    highlights: '',
    improvements: '',
    notes: ''
  });
  const [savingWeek, setSavingWeek] = useState(false);

  useEffect(() => {
    loadMealHistory();
  }, []);

  useEffect(() => {
    if (activeTab === 'week') {
      loadWeekReview();
    }
  }, [activeTab, weekStart]);

  async function loadMealHistory() {
    setLoading(true);
    try {
      const data = await history.getRecent(14);
      setMealHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadWeekReview() {
    try {
      const existing = await reviews.getWeek(weekStart);
      if (existing) {
        setWeekReview({
          varietyBalance: existing.varietyBalance || 0,
          effortVsSatisfaction: existing.effortVsSatisfaction || 0,
          highlights: existing.highlights || '',
          improvements: existing.improvements || '',
          notes: existing.notes || ''
        });
      } else {
        setWeekReview({
          varietyBalance: 0,
          effortVsSatisfaction: 0,
          highlights: '',
          improvements: '',
          notes: ''
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function updateMealRating(id, rating) {
    try {
      await history.update(id, { rating });
      loadMealHistory();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  async function saveWeekReview() {
    setSavingWeek(true);
    try {
      await reviews.saveWeek(weekStart, weekReview);
      alert('Week review saved!');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSavingWeek(false);
    }
  }

  function changeWeek(delta) {
    const current = new Date(weekStart);
    current.setDate(current.getDate() + delta * 7);
    setWeekStart(current.toISOString().split('T')[0]);
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="text-gray-500">Track your meal satisfaction over time</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { id: 'meals', label: 'Meal Ratings' },
          { id: 'day', label: 'Day Review' },
          { id: 'week', label: 'Week Review' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Meals Tab */}
      {activeTab === 'meals' && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : mealHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No meals logged yet. Start by eating something!
            </div>
          ) : (
            mealHistory.map((meal) => (
              <div
                key={meal.id}
                className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-gray-900">{meal.mealName}</div>
                  <div className="text-sm text-gray-500">
                    {meal.cuisine} •{' '}
                    {new Date(meal.eatenAt).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  {meal.notes && (
                    <div className="text-sm text-gray-400 mt-1 italic">
                      "{meal.notes}"
                    </div>
                  )}
                </div>
                <StarRating
                  value={meal.rating || 0}
                  onChange={(r) => updateMealRating(meal.id, r)}
                  size="sm"
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* Day Tab */}
      {activeTab === 'day' && (
        <DayReviewCard
          date={today}
          onComplete={() => alert('Day review saved!')}
        />
      )}

      {/* Week Tab */}
      {activeTab === 'week' && (
        <div className="space-y-4">
          {/* Week selector */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => changeWeek(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              ← Prev
            </button>
            <span className="text-sm font-medium">
              Week of{' '}
              {new Date(weekStart).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric'
              })}
            </span>
            <button
              onClick={() => changeWeek(1)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              Next →
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variety Balance
              </label>
              <p className="text-xs text-gray-500 mb-2">
                How varied were your meals this week?
              </p>
              <StarRating
                value={weekReview.varietyBalance}
                onChange={(v) =>
                  setWeekReview((r) => ({ ...r, varietyBalance: v }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Effort vs Satisfaction
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Was the cooking effort worth the enjoyment?
              </p>
              <StarRating
                value={weekReview.effortVsSatisfaction}
                onChange={(v) =>
                  setWeekReview((r) => ({ ...r, effortVsSatisfaction: v }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Highlights
              </label>
              <textarea
                value={weekReview.highlights}
                onChange={(e) =>
                  setWeekReview((r) => ({ ...r, highlights: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="Best meals this week..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What to improve
              </label>
              <textarea
                value={weekReview.improvements}
                onChange={(e) =>
                  setWeekReview((r) => ({ ...r, improvements: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="What to do differently next week..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={weekReview.notes}
                onChange={(e) =>
                  setWeekReview((r) => ({ ...r, notes: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="Any other thoughts..."
              />
            </div>

            <button
              onClick={saveWeekReview}
              disabled={savingWeek}
              className="w-full py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
            >
              {savingWeek ? 'Saving...' : 'Save Week Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
