import { useState, useEffect } from 'react';
import { preferences } from '../api/client';

export default function Settings() {
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const pref = await preferences.get('dailyCalorieGoal');
      if (pref.value) {
        setCalorieGoal(parseInt(pref.value));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await preferences.set('dailyCalorieGoal', calorieGoal);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Customize your experience</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Calorie Tracking</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Calorie Goal
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={calorieGoal}
                onChange={(e) => setCalorieGoal(parseInt(e.target.value) || 0)}
                className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1000"
                max="5000"
                step="50"
              />
              <span className="text-gray-500">kcal / day</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Recommended: 1500-2500 kcal depending on activity level
            </p>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-2">
            {[1500, 1800, 2000, 2200, 2500].map((preset) => (
              <button
                key={preset}
                onClick={() => setCalorieGoal(preset)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  calorieGoal === preset
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            } disabled:opacity-50`}
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-2">How calorie tracking works</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• AI estimates calories for each meal suggestion</li>
          <li>• Meals are sorted by calories (lighter options first)</li>
          <li>• You'll see warnings when a meal exceeds your remaining budget</li>
          <li>• Progress bar on Home page shows daily consumption</li>
          <li>• Calendar shows daily totals for each day</li>
        </ul>
      </div>
    </div>
  );
}
