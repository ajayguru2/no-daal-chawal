import { useState, useEffect } from 'react';
import { history, reviews } from '../api/client';
import MealRatingModal from './MealRatingModal';
import DayReviewCard from './DayReviewCard';

export default function EndOfDayReminder() {
  const [unratedMeals, setUnratedMeals] = useState([]);
  const [showReminder, setShowReminder] = useState(false);
  const [currentMealIndex, setCurrentMealIndex] = useState(0);
  const [showDayReview, setShowDayReview] = useState(false);

  useEffect(() => {
    checkReminder();
    // Check every 30 minutes
    const interval = setInterval(checkReminder, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function checkReminder() {
    const hour = new Date().getHours();
    const todayKey = new Date().toISOString().split('T')[0];
    const dismissedToday = localStorage.getItem(`reminder-dismissed-${todayKey}`);

    // Show reminder between 7 PM and 11 PM
    if (hour >= 19 && hour < 23 && !dismissedToday) {
      try {
        const unrated = await reviews.getUnratedToday();
        if (unrated.length > 0) {
          setUnratedMeals(unrated);
          setShowReminder(true);
        }
      } catch (err) {
        console.error('Failed to check unrated meals:', err);
      }
    }
  }

  async function handleRateMeal(id, data) {
    try {
      await history.update(id, data);
      const remaining = unratedMeals.filter((m) => m.id !== id);
      setUnratedMeals(remaining);

      if (remaining.length === 0) {
        setShowDayReview(true);
      } else {
        setCurrentMealIndex(0);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleDismiss() {
    const todayKey = new Date().toISOString().split('T')[0];
    localStorage.setItem(`reminder-dismissed-${todayKey}`, 'true');
    setShowReminder(false);
  }

  function handleDayReviewComplete() {
    setShowDayReview(false);
    setShowReminder(false);
    handleDismiss();
  }

  if (!showReminder) return null;

  const currentMeal = unratedMeals[currentMealIndex];

  return (
    <>
      {/* Reminder Banner */}
      {!currentMeal && !showDayReview && unratedMeals.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-w-sm z-40">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🌙</span>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Rate today's meals</h3>
              <p className="text-sm text-gray-500 mt-1">
                You have {unratedMeals.length} unrated meal
                {unratedMeals.length > 1 ? 's' : ''} from today.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setCurrentMealIndex(0)}
                  className="text-sm px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Rate Now
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-sm px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Meal Rating Modal */}
      {currentMeal && (
        <MealRatingModal
          meal={currentMeal}
          onSave={handleRateMeal}
          onClose={() => {
            if (unratedMeals.length === 1) {
              setShowDayReview(true);
            }
            setUnratedMeals((meals) =>
              meals.filter((m) => m.id !== currentMeal.id)
            );
          }}
        />
      )}

      {/* Day Review after all meals rated */}
      {showDayReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full">
            <div className="mb-4 text-center">
              <span className="text-3xl">🎉</span>
              <p className="text-white mt-2">All meals rated! Now review your day.</p>
            </div>
            <DayReviewCard
              date={new Date().toISOString().split('T')[0]}
              onComplete={handleDayReviewComplete}
            />
            <button
              onClick={handleDayReviewComplete}
              className="w-full mt-3 py-2 text-white/80 hover:text-white text-sm"
            >
              Skip day review
            </button>
          </div>
        </div>
      )}
    </>
  );
}
