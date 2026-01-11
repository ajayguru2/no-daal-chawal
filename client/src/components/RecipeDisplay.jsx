import { useState } from 'react';

export default function RecipeDisplay({ recipe, onClose }) {
  const [completedSteps, setCompletedSteps] = useState(new Set());

  if (!recipe) return null;

  const toggleStep = (stepIndex) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepIndex)) {
      newCompleted.delete(stepIndex);
    } else {
      newCompleted.add(stepIndex);
    }
    setCompletedSteps(newCompleted);
  };

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          >
            <span className="text-xl">&times;</span>
          </button>

          <div className="space-y-2">
            <span className="inline-block px-2 py-0.5 bg-white/20 rounded text-xs font-medium capitalize">
              {recipe.cuisine?.replace('_', ' ')}
            </span>
            <h2 className="text-2xl font-bold">{recipe.mealName}</h2>
            {recipe.description && (
              <p className="text-emerald-100 text-sm">{recipe.description}</p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex gap-6 mt-4 text-sm">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Prep: {recipe.prepTime} min</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
              <span>Cook: {recipe.cookTime} min</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{recipe.servings} servings</span>
            </div>
            {recipe.calories && (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>{recipe.calories} kcal</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Progress bar */}
            <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{
                  width: `${recipe.instructions?.length ? (completedSteps.size / recipe.instructions.length) * 100 : 0}%`
                }}
              />
            </div>

            {/* Ingredients */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-sm">1</span>
                Ingredients
              </h3>
              <div className="bg-emerald-50 rounded-xl p-4">
                <ul className="space-y-2">
                  {recipe.ingredients?.map((ing, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                      <span>
                        <span className="font-medium">{ing.quantity} {ing.unit}</span>{' '}
                        {ing.item}
                        {ing.notes && (
                          <span className="text-gray-500 text-sm"> ({ing.notes})</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-sm">2</span>
                Instructions
              </h3>
              <div className="space-y-3">
                {recipe.instructions?.map((instruction, i) => (
                  <div
                    key={i}
                    onClick={() => toggleStep(i)}
                    className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      completedSteps.has(i)
                        ? 'bg-emerald-50 border-2 border-emerald-200'
                        : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium transition-colors ${
                      completedSteps.has(i)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {completedSteps.has(i) ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        instruction.step || i + 1
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-gray-700 ${completedSteps.has(i) ? 'line-through text-gray-400' : ''}`}>
                        {instruction.text}
                      </p>
                      {instruction.time && (
                        <span className="text-xs text-gray-400 mt-1 inline-block">
                          ~{instruction.time}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            {recipe.tips && recipe.tips.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-sm">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </span>
                  Pro Tips
                </h3>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <ul className="space-y-2">
                    {recipe.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                        <span className="text-amber-500 font-bold">*</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Total time: <span className="font-medium text-gray-700">{totalTime} minutes</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCompletedSteps(new Set())}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Reset Progress
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors"
              >
                Done Cooking
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
