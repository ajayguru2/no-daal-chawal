import { useState, useEffect } from 'react';
import StarRating from './StarRating';
import { reviews } from '../api/client';

export default function DayReviewCard({ date, onComplete }) {
  const [review, setReview] = useState({
    varietyScore: 0,
    effortScore: 0,
    satisfactionScore: 0,
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadExistingReview();
  }, [date]);

  async function loadExistingReview() {
    try {
      const existing = await reviews.getDay(date);
      if (existing) {
        setReview({
          varietyScore: existing.varietyScore || 0,
          effortScore: existing.effortScore || 0,
          satisfactionScore: existing.satisfactionScore || 0,
          notes: existing.notes || ''
        });
      }
    } catch (err) {
      console.error('Failed to load day review:', err);
    } finally {
      setLoaded(true);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await reviews.saveDay(date, review);
      onComplete?.();
    } catch (err) {
      alert('Error saving review: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  const dateLabel = new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  if (!loaded) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-gray-500 text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">How was {dateLabel}?</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Variety</span>
          <StarRating
            value={review.varietyScore}
            onChange={(v) => setReview((r) => ({ ...r, varietyScore: v }))}
            size="sm"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Effort</span>
          <StarRating
            value={review.effortScore}
            onChange={(v) => setReview((r) => ({ ...r, effortScore: v }))}
            size="sm"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Satisfaction</span>
          <StarRating
            value={review.satisfactionScore}
            onChange={(v) => setReview((r) => ({ ...r, satisfactionScore: v }))}
            size="sm"
          />
        </div>

        <textarea
          value={review.notes}
          onChange={(e) => setReview((r) => ({ ...r, notes: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          placeholder="Any thoughts about today's meals?"
        />

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Day Review'}
        </button>
      </div>
    </div>
  );
}
