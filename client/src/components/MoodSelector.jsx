const MOODS = [
  { value: 'tired', emoji: '😴', label: 'Tired', desc: 'Something easy' },
  { value: 'hungry', emoji: '🤤', label: 'Starving', desc: 'Need food NOW' },
  { value: 'light', emoji: '🥗', label: 'Light', desc: 'Something healthy' },
  { value: 'spicy', emoji: '🌶️', label: 'Spicy', desc: 'Bring the heat' },
  { value: 'comfort', emoji: '🍲', label: 'Comfort', desc: 'Soul food' },
  { value: 'fancy', emoji: '✨', label: 'Fancy', desc: 'Something special' },
  { value: 'experimental', emoji: '🧪', label: 'Adventurous', desc: 'Try something new' },
  { value: 'lazy', emoji: '🛋️', label: 'Lazy', desc: 'Minimal effort' },
];

export default function MoodSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {MOODS.map((mood) => (
        <button
          key={mood.value}
          onClick={() => onChange(mood.value)}
          className={`p-3 rounded-xl border-2 text-left transition-all ${
            value === mood.value
              ? 'border-gray-900 bg-gray-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="text-2xl mb-1">{mood.emoji}</div>
          <div className="font-medium text-gray-900 text-sm">{mood.label}</div>
          <div className="text-xs text-gray-500">{mood.desc}</div>
        </button>
      ))}
    </div>
  );
}
