import { useState } from 'react';
import StarRating from './StarRating';

export default function MealRatingModal({ meal, onSave, onClose }) {
  const [rating, setRating] = useState(meal.rating || 0);
  const [notes, setNotes] = useState(meal.notes || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(meal.id, { rating, notes: notes || undefined });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-1">{meal.mealName}</h2>
        <p className="text-sm text-gray-500 mb-4">
          {meal.cuisine} - {meal.mealType}
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How was it?
          </label>
          <StarRating value={rating} onChange={setRating} size="lg" />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Any notes? (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="What did you like or dislike?"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={rating === 0 || saving}
            className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Rating'}
          </button>
        </div>
      </div>
    </div>
  );
}
