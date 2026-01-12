import Portal from './Portal';

const MEAL_TYPE_ICONS = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍪'
};

const COMPLETION_MESSAGES = [
  'Great choice! Nourishing your body!',
  'Another healthy meal down!',
  "You're on fire! Keep it up!",
  'Meal goals achieved!',
  'Fueling your success!',
  'Healthy eating champion!',
];

export default function MealPlanDetail({
  plan,
  onClose,
  onAteThis,
  onUndoComplete,
  onReplace,
  onDelete,
  onViewRecipe,
  generatingRecipe
}) {
  if (!plan || !plan.mealData) return null;

  const { mealData, mealType, date, completed, completedAt } = plan;
  const completionMessage = COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)];
  const ingredients = Array.isArray(mealData.ingredients) ? mealData.ingredients : [];

  const dateLabel = new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`text-white p-5 relative ${
          completed
            ? 'bg-gradient-to-r from-green-500 to-emerald-400'
            : 'bg-gradient-to-r from-emerald-600 to-emerald-500'
        }`}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {completed && (
            <div className="flex items-center gap-2 mb-3 bg-white/20 rounded-lg p-2">
              <span className="text-2xl">✅</span>
              <div>
                <div className="font-semibold text-sm">Completed!</div>
                <div className="text-xs text-white/80">{completionMessage}</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-emerald-100 text-sm mb-1">
            <span>{MEAL_TYPE_ICONS[mealType] || '🍽️'}</span>
            <span className="capitalize">{mealType}</span>
            <span>•</span>
            <span>{dateLabel}</span>
          </div>

          <h2 className="text-xl font-bold pr-8">{mealData.name}</h2>

          {mealData.cuisine && (
            <span className="inline-block mt-2 px-2 py-0.5 bg-white/20 rounded text-xs capitalize">
              {mealData.cuisine.replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Stats Row */}
          <div className="flex items-center gap-4 text-sm">
            {mealData.prepTime && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{mealData.prepTime} min</span>
              </div>
            )}
            {mealData.estimatedCalories && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
                <span>{mealData.estimatedCalories} kcal</span>
              </div>
            )}
          </div>

          {/* Description */}
          {mealData.description && (
            <p className="text-gray-600 text-sm italic">
              "{mealData.description}"
            </p>
          )}

          {/* Ingredients */}
          {ingredients.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Key Ingredients</h3>
              <div className="flex flex-wrap gap-1.5">
                {ingredients.slice(0, 5).map((ing, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full"
                  >
                    {ing.item || ing.name || ing}
                  </span>
                ))}
                {ingredients.length > 5 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                    +{ingredients.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {completed ? (
            <>
              {/* Completed state actions */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">🎉</div>
                <div className="text-green-700 font-medium">Great job!</div>
                <div className="text-green-600 text-sm">You followed your meal plan</div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={onViewRecipe}
                  disabled={generatingRecipe}
                  className="flex flex-col items-center gap-1 p-3 border border-emerald-500 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors disabled:opacity-50"
                >
                  {generatingRecipe ? (
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  <span className="text-xs font-medium">Recipe</span>
                </button>

                <button
                  onClick={onUndoComplete}
                  className="flex flex-col items-center gap-1 p-3 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <span className="text-xs font-medium">Undo</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Uncompleted state actions */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  onClick={onViewRecipe}
                  disabled={generatingRecipe}
                  className="flex flex-col items-center gap-1 p-3 border border-emerald-500 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors disabled:opacity-50"
                >
                  {generatingRecipe ? (
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  <span className="text-xs font-medium">Recipe</span>
                </button>

                <button
                  onClick={onAteThis}
                  className="flex flex-col items-center gap-1 p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs font-medium">I Ate This</span>
                </button>

                <button
                  onClick={onReplace}
                  className="flex flex-col items-center gap-1 p-3 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-xs font-medium">Replace</span>
                </button>
              </div>
            </>
          )}

          {/* Delete Button */}
          <button
            onClick={onDelete}
            className="w-full py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Remove from Plan
          </button>
        </div>
      </div>
    </div>
    </Portal>
  );
}
