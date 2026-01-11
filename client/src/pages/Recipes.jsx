import { useState, useEffect } from 'react';
import { recipes } from '../api/client';
import RecipeDisplay from '../components/RecipeDisplay';

const CUISINE_LABELS = {
  north_indian: 'North Indian',
  south_indian: 'South Indian',
  continental: 'Continental',
  chinese: 'Chinese',
  mediterranean: 'Mediterranean',
  indian_fusion: 'Indian Fusion',
  other: 'Other',
};

export default function Recipes() {
  const [recipeList, setRecipeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCuisine, setFilterCuisine] = useState('');

  useEffect(() => {
    loadRecipes();
  }, []);

  async function loadRecipes() {
    setLoading(true);
    try {
      const data = await recipes.getAll();
      setRecipeList(data);
    } catch (err) {
      console.error('Failed to load recipes:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    try {
      await recipes.delete(id);
      setRecipeList(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  // Filter recipes
  const filteredRecipes = recipeList.filter(recipe => {
    const matchesSearch = !searchQuery ||
      recipe.mealName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCuisine = !filterCuisine || recipe.cuisine === filterCuisine;
    return matchesSearch && matchesCuisine;
  });

  // Get unique cuisines for filter
  const availableCuisines = [...new Set(recipeList.map(r => r.cuisine))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Recipes</h1>
          <p className="text-gray-500">
            {recipeList.length} saved recipe{recipeList.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      {recipeList.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <select
            value={filterCuisine}
            onChange={(e) => setFilterCuisine(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">All Cuisines</option>
            {availableCuisines.map(cuisine => (
              <option key={cuisine} value={cuisine}>
                {CUISINE_LABELS[cuisine] || cuisine}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Empty State */}
      {recipeList.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            When you get meal suggestions, click "Recipe" to generate and save recipes here.
          </p>
        </div>
      )}

      {/* No Results */}
      {recipeList.length > 0 && filteredRecipes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No recipes match your search.
        </div>
      )}

      {/* Recipe Grid */}
      {filteredRecipes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map(recipe => (
            <div
              key={recipe.id}
              onClick={() => setSelectedRecipe(recipe)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group"
            >
              {/* Recipe Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 p-4 text-white relative">
                <button
                  onClick={(e) => handleDelete(recipe.id, e)}
                  className="absolute top-2 right-2 w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <span className="text-xs px-2 py-0.5 bg-white/20 rounded capitalize">
                  {CUISINE_LABELS[recipe.cuisine] || recipe.cuisine}
                </span>
                <h3 className="font-semibold text-lg mt-1 pr-8">{recipe.mealName}</h3>
              </div>

              {/* Recipe Details */}
              <div className="p-4">
                {recipe.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {recipe.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{recipe.prepTime + recipe.cookTime} min</span>
                  </div>
                  {recipe.calories && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                      </svg>
                      <span>{recipe.calories} kcal</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{recipe.servings}</span>
                  </div>
                </div>

                {/* Ingredients Preview */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex flex-wrap gap-1">
                    {recipe.ingredients?.slice(0, 4).map((ing, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                      >
                        {ing.item}
                      </span>
                    ))}
                    {recipe.ingredients?.length > 4 && (
                      <span className="text-xs text-gray-400">
                        +{recipe.ingredients.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recipe Display Modal */}
      {selectedRecipe && (
        <RecipeDisplay
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  );
}
