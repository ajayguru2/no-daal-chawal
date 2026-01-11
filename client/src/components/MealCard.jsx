const CUISINE_LABELS = {
  north_indian: 'North Indian',
  south_indian: 'South Indian',
  continental: 'Continental',
  chinese: 'Chinese',
  mediterranean: 'Mediterranean',
  indian_fusion: 'Indian Fusion',
  other: 'Other',
};

export default function MealCard({ meal, onAteThis, showActions = true }) {
  const ingredients = typeof meal.ingredients === 'string'
    ? JSON.parse(meal.ingredients)
    : meal.ingredients;

  const hasCalorieWarning = meal.calorieWarning;

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-5 flex flex-col h-full ${
      hasCalorieWarning ? 'border-red-300' : 'border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900">{meal.name}</h3>
          <div className="flex items-center gap-1.5">
            {meal.estimatedCalories && (
              <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap font-medium ${
                hasCalorieWarning
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {meal.estimatedCalories} kcal
              </span>
            )}
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full whitespace-nowrap">
              {meal.prepTime} min
            </span>
          </div>
        </div>

        {/* Calorie Warning */}
        {hasCalorieWarning && (
          <div className="mb-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
            {meal.calorieWarning}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
            {CUISINE_LABELS[meal.cuisine] || meal.cuisine}
          </span>
          <span className="capitalize">{meal.mealType}</span>
        </div>

        {meal.description && (
          <p className="text-sm text-gray-600 mb-3 italic">"{meal.description}"</p>
        )}

        {meal.reason && (
          <p className="text-sm text-gray-500 mb-3">{meal.reason}</p>
        )}

        {/* Ingredients */}
        {ingredients && ingredients.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-700 mb-1">Key ingredients:</div>
            <div className="flex flex-wrap gap-1">
              {ingredients.slice(0, 5).map((ing, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                >
                  {ing.name}
                </span>
              ))}
              {ingredients.length > 5 && (
                <span className="text-xs text-gray-400">+{ingredients.length - 5} more</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="pt-3 border-t border-gray-100 mt-3">
          <button
            onClick={onAteThis}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 rounded-lg text-sm transition-colors"
          >
            I ate this!
          </button>
        </div>
      )}
    </div>
  );
}
