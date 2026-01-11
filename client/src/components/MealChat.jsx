import { useState, useRef, useEffect } from 'react';
import { recipes } from '../api/client';
import RecipeDisplay from './RecipeDisplay';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3001';

export default function MealChat({ mealType, onSelectMeal, onClose }) {
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [generatingRecipe, setGeneratingRecipe] = useState(null); // meal name being generated
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [conversation, setConversation] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchInitialSuggestions();
  }, [mealType]);

  async function fetchInitialSuggestions() {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealType })
      });
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGetRecipe(meal) {
    setGeneratingRecipe(meal.name);
    try {
      const recipe = await recipes.generate(meal);
      setCurrentRecipe(recipe);
    } catch (err) {
      console.error('Failed to generate recipe:', err);
    } finally {
      setGeneratingRecipe(null);
    }
  }

  async function refineWithFeedback(e) {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add to conversation history
    const newConversation = [...conversation, { role: 'user', content: userMessage }];
    setConversation(newConversation);

    try {
      const response = await fetch(`${API_BASE}/api/suggest/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealType,
          conversation: [
            { role: 'assistant', content: `Here are some ${mealType} options.` },
            ...newConversation
          ]
        })
      });

      const data = await response.json();
      setSuggestions(data.suggestions || []);

      if (data.message) {
        setConversation(prev => [...prev, { role: 'assistant', content: data.message }]);
      }
    } catch (err) {
      console.error('Failed to refine suggestions:', err);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold capitalize">
            Pick {mealType}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Loading */}
          {loading && suggestions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Finding suggestions...
            </div>
          )}

          {/* Meal Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-3">
              {suggestions.map((meal, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-lg p-3 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{meal.name}</div>
                      <div className="text-sm text-gray-500">
                        {meal.cuisine} • {meal.prepTime} min
                        {meal.estimatedCalories && ` • ${meal.estimatedCalories} kcal`}
                      </div>
                      {meal.description && (
                        <div className="text-sm text-gray-600 mt-1 italic">
                          "{meal.description}"
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex gap-2">
                      <button
                        onClick={() => handleGetRecipe(meal)}
                        disabled={generatingRecipe === meal.name}
                        className="px-3 py-1.5 border border-emerald-500 text-emerald-600 text-sm font-medium rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50"
                      >
                        {generatingRecipe === meal.name ? '...' : 'Recipe'}
                      </button>
                      <button
                        onClick={() => onSelectMeal(meal)}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No suggestions */}
          {!loading && suggestions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No suggestions found. Try describing what you want below.
            </div>
          )}

          {/* Conversation history */}
          {conversation.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
              {conversation.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loading indicator for refinement */}
          {loading && suggestions.length > 0 && (
            <div className="mt-4 text-center text-gray-500 text-sm">
              Refining suggestions...
            </div>
          )}
        </div>

        {/* Refinement Input - only show after initial load */}
        {!loading || suggestions.length > 0 ? (
          <form onSubmit={refineWithFeedback} className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500 mb-2">
              Not what you're looking for? Tell me what you want:
            </div>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="I want Indian chicken curry..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Refine
              </button>
            </div>
          </form>
        ) : null}
      </div>

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
