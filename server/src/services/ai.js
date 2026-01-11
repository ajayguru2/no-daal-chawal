import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function suggestMeals({
  mood,
  timeAvailable,
  cuisine,
  mealType,
  inventory,
  recentMeals,
  avoidCuisines,
  rejectedMeals = [],
  reviewContext = null,
  calorieContext = null
}) {
  const inventoryList = inventory
    .map(i => `${i.name} (${i.quantity} ${i.unit})`)
    .join(', ');

  const recentMealsList = recentMeals.length > 0
    ? recentMeals.join(', ')
    : 'none';

  const avoidCuisinesList = avoidCuisines.length > 0
    ? avoidCuisines.join(', ')
    : 'none';

  const rejectedList = rejectedMeals.length > 0
    ? rejectedMeals.map(r => `${r.name} (reason: ${r.reason})`).join(', ')
    : 'none';

  // Build review insights for AI context
  let reviewInsights = '';
  if (reviewContext) {
    const { highRatedMeals, lowRatedMeals, cuisinePreferences, recentDayReviews } = reviewContext;

    if (highRatedMeals?.length > 0) {
      reviewInsights += `\nHIGHLY RATED MEALS (prioritize similar): ${highRatedMeals.map(m => `${m.mealName} (${m.rating}/5)`).join(', ')}`;
    }

    if (lowRatedMeals?.length > 0) {
      reviewInsights += `\nLOW RATED MEALS (avoid similar): ${lowRatedMeals.map(m => `${m.mealName} (${m.rating}/5)`).join(', ')}`;
    }

    if (cuisinePreferences?.length > 0) {
      const topCuisines = cuisinePreferences.filter(c => c.avgRating >= 4);
      if (topCuisines.length > 0) {
        reviewInsights += `\nFAVORITE CUISINES: ${topCuisines.map(c => c.cuisine).join(', ')}`;
      }
    }

    // Check recent day reviews for patterns
    if (recentDayReviews?.length > 0) {
      const recentSatisfaction = recentDayReviews.slice(0, 3);
      if (recentSatisfaction.some(d => d.effortScore >= 4 && d.satisfactionScore <= 2)) {
        reviewInsights += `\nINSIGHT: Recent high-effort meals weren't satisfying - suggest simpler options`;
      }
      if (recentSatisfaction.some(d => d.varietyScore <= 2)) {
        reviewInsights += `\nINSIGHT: User wants more variety - suggest something different from usual`;
      }
    }
  }

  // Build calorie instructions for AI
  let calorieInstructions = '';
  if (calorieContext) {
    calorieInstructions = `
CALORIE CONTEXT:
- Daily goal: ${calorieContext.dailyGoal} kcal
- Already consumed today: ${calorieContext.consumed} kcal
- Remaining budget: ${calorieContext.remaining} kcal

CALORIE INSTRUCTIONS:
- Estimate approximate calories for each meal suggestion (typical Indian home-cooked portions)
- If remaining budget is low (<500 kcal), prioritize lighter options
- Still suggest variety - include some options even if they exceed budget
- Be realistic with calorie estimates
`;
  }

  const prompt = `You are the No Daal Chawal assistant - a culinary advisor for a food-loving couple in Bangalore who appreciate quality meals and HATE repetition (especially boring daal chawal!).
${calorieInstructions}
CRITICAL RULES:
1. NEVER suggest any of these recently eaten meals: ${recentMealsList}
2. AVOID these cuisines (eaten yesterday): ${avoidCuisinesList}
3. NEVER suggest these rejected meals (user said no): ${rejectedList}
4. Learn from rejections - if user rejected something for being "too heavy", suggest lighter options
5. Suggest INTERESTING, well-crafted meals - not boring defaults
6. Consider the available ingredients but don't limit to only those
7. Pay attention to user's past ratings and preferences below
8. ${cuisine ? `IMPORTANT: User selected "${cuisine}" cuisine - ALL suggestions MUST be authentic ${cuisine} dishes. Do NOT suggest dishes from other cuisines.` : 'Suggest diverse cuisines'}
9. ${mealType ? `User wants ${mealType} options - ALL suggestions must be appropriate for ${mealType}.` : ''}
${reviewInsights ? `\nUSER PREFERENCES FROM PAST REVIEWS:${reviewInsights}` : ''}

USER CONTEXT:
- Mood: ${mood || 'not specified'}
- Time available: ${timeAvailable || 'not specified'} minutes
- Preferred cuisine: ${cuisine || 'any'}
- Meal type: ${mealType || 'any'}

AVAILABLE INGREDIENTS:
${inventoryList || 'Not specified - suggest based on common Indian pantry'}

Suggest 3 diverse meal options. For each meal provide:
1. Name (be specific - "Butter Chicken" not just "curry")
2. Cuisine type
3. Prep time in minutes
4. Estimated calories (approximate, for typical portion)
5. Key ingredients needed
6. Why this meal fits their mood/time
7. A one-line description that makes it sound delicious

Respond in this exact JSON format:
{
  "suggestions": [
    {
      "name": "Meal name",
      "cuisine": "north_indian|south_indian|continental|chinese|mediterranean|other",
      "mealType": "breakfast|lunch|dinner|snack",
      "prepTime": 30,
      "estimatedCalories": 450,
      "ingredients": [
        {"name": "Ingredient", "quantity": 1, "unit": "kg"}
      ],
      "reason": "Why this fits your mood",
      "description": "A tempting one-liner"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a culinary expert who suggests creative, high-quality Indian and international meals. Always respond with valid JSON only.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(content);

    return result.suggestions || [];
  } catch (error) {
    console.error('OpenAI error:', error);

    // Fallback suggestions if API fails
    return getFallbackSuggestions(mood, timeAvailable, mealType);
  }
}

// Fallback suggestions when API is unavailable
function getFallbackSuggestions(mood, timeAvailable, mealType) {
  const quickMeals = [
    {
      name: 'Masala Maggi with Vegetables',
      cuisine: 'indian_fusion',
      mealType: 'snack',
      prepTime: 15,
      estimatedCalories: 350,
      ingredients: [
        { name: 'Maggi noodles', quantity: 2, unit: 'packets' },
        { name: 'Mixed vegetables', quantity: 100, unit: 'g' },
        { name: 'Butter', quantity: 1, unit: 'tbsp' }
      ],
      reason: 'Quick comfort food when you need something fast',
      description: 'Loaded veggie Maggi with a buttery kick'
    },
    {
      name: 'Egg Bhurji with Paratha',
      cuisine: 'north_indian',
      mealType: 'breakfast',
      prepTime: 20,
      estimatedCalories: 450,
      ingredients: [
        { name: 'Eggs', quantity: 4, unit: 'pieces' },
        { name: 'Onion', quantity: 1, unit: 'medium' },
        { name: 'Tomato', quantity: 1, unit: 'medium' },
        { name: 'Atta', quantity: 100, unit: 'g' }
      ],
      reason: 'Protein-packed and satisfying',
      description: 'Spiced scrambled eggs with flaky homemade parathas'
    },
    {
      name: 'Curd Rice with Pickle',
      cuisine: 'south_indian',
      mealType: 'lunch',
      prepTime: 10,
      estimatedCalories: 280,
      ingredients: [
        { name: 'Rice', quantity: 200, unit: 'g' },
        { name: 'Curd', quantity: 200, unit: 'g' },
        { name: 'Mustard seeds', quantity: 1, unit: 'tsp' }
      ],
      reason: 'Light, cooling, and comforting',
      description: 'Silky curd rice tempered with mustard and curry leaves'
    }
  ];

  const elaborateMeals = [
    {
      name: 'Paneer Tikka Masala',
      cuisine: 'north_indian',
      mealType: 'dinner',
      prepTime: 45,
      estimatedCalories: 550,
      ingredients: [
        { name: 'Paneer', quantity: 250, unit: 'g' },
        { name: 'Capsicum', quantity: 1, unit: 'medium' },
        { name: 'Onion', quantity: 2, unit: 'medium' },
        { name: 'Tomato', quantity: 3, unit: 'medium' },
        { name: 'Cream', quantity: 50, unit: 'ml' }
      ],
      reason: 'Restaurant-quality dinner at home',
      description: 'Charred paneer in smoky, creamy tomato gravy'
    },
    {
      name: 'Hyderabadi Vegetable Biryani',
      cuisine: 'south_indian',
      mealType: 'lunch',
      prepTime: 60,
      estimatedCalories: 650,
      ingredients: [
        { name: 'Basmati rice', quantity: 300, unit: 'g' },
        { name: 'Mixed vegetables', quantity: 200, unit: 'g' },
        { name: 'Curd', quantity: 100, unit: 'g' },
        { name: 'Ghee', quantity: 3, unit: 'tbsp' },
        { name: 'Biryani masala', quantity: 2, unit: 'tbsp' }
      ],
      reason: 'When you want something special and aromatic',
      description: 'Layered, fragrant biryani with perfectly spiced vegetables'
    },
    {
      name: 'Palak Paneer with Butter Naan',
      cuisine: 'north_indian',
      mealType: 'dinner',
      prepTime: 50,
      estimatedCalories: 580,
      ingredients: [
        { name: 'Spinach', quantity: 300, unit: 'g' },
        { name: 'Paneer', quantity: 200, unit: 'g' },
        { name: 'Cream', quantity: 50, unit: 'ml' },
        { name: 'Atta', quantity: 200, unit: 'g' }
      ],
      reason: 'Nutritious and deeply satisfying',
      description: 'Velvety spinach gravy with soft paneer cubes'
    }
  ];

  const time = parseInt(timeAvailable) || 30;
  return time <= 25 ? quickMeals : elaborateMeals;
}
