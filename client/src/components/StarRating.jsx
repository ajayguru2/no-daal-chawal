export default function StarRating({ value, onChange, size = 'md', readonly = false }) {
  const sizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          className={`${sizes[size]} transition-all ${
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          } ${star <= value ? 'text-amber-400' : 'text-gray-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
