import { useState, useEffect } from 'react';
import { shopping, inventory } from '../api/client';

const CATEGORIES = [
  { value: 'vegetables', label: 'Vegetables', emoji: '🥬' },
  { value: 'dairy', label: 'Dairy', emoji: '🥛' },
  { value: 'grains', label: 'Grains', emoji: '🌾' },
  { value: 'proteins', label: 'Proteins', emoji: '🥩' },
  { value: 'spices', label: 'Spices', emoji: '🌶️' },
  { value: 'others', label: 'Others', emoji: '📦' },
];

export default function Shopping() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: 'kg',
    category: 'vegetables',
  });

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      const data = await shopping.getAll();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setLoading(true);
    try {
      await shopping.generate();
      loadItems();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function togglePurchased(item) {
    try {
      await shopping.update(item.id, { isPurchased: !item.isPurchased });

      // Auto-add to inventory when marking as purchased
      if (!item.isPurchased && item.quantity) {
        await inventory.add({
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit || 'pieces',
        });
      }

      loadItems();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id) {
    try {
      await shopping.delete(id);
      loadItems();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleClearPurchased() {
    try {
      await shopping.clearPurchased();
      loadItems();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await shopping.add({
        ...formData,
        quantity: formData.quantity ? parseFloat(formData.quantity) : null,
      });
      setFormData({ name: '', quantity: '', unit: 'kg', category: 'vegetables' });
      setShowAdd(false);
      loadItems();
    } catch (err) {
      console.error(err);
    }
  }

  const groupedItems = items.reduce((acc, item) => {
    const key = item.isPurchased ? 'purchased' : item.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const purchasedCount = items.filter((i) => i.isPurchased).length;
  const pendingCount = items.length - purchasedCount;

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shopping List</h1>
          <p className="text-gray-500">
            {pendingCount} items to buy, {purchasedCount} purchased
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            Generate from Plan
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg"
          >
            + Add Item
          </button>
        </div>
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">🛒</div>
          <h2 className="font-semibold text-gray-900 mb-2">No items yet</h2>
          <p className="text-gray-500 mb-4">
            Add items manually or generate from your meal plan
          </p>
          <button
            onClick={handleGenerate}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg"
          >
            Generate from Meal Plan
          </button>
        </div>
      )}

      {/* Items by Category */}
      {CATEGORIES.map((cat) => {
        const categoryItems = groupedItems[cat.value];
        if (!categoryItems || categoryItems.length === 0) return null;

        return (
          <div key={cat.value} className="space-y-2">
            <h2 className="font-semibold text-gray-700">
              {cat.emoji} {cat.label}
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
              {categoryItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50"
                >
                  <button
                    onClick={() => togglePurchased(item)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      item.isPurchased
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {item.isPurchased && '✓'}
                  </button>
                  <div className="flex-1">
                    <span
                      className={
                        item.isPurchased
                          ? 'text-gray-400 line-through'
                          : 'text-gray-900'
                      }
                    >
                      {item.name}
                    </span>
                    {item.quantity && (
                      <span className="text-gray-500 ml-2 text-sm">
                        ({item.quantity} {item.unit})
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-gray-400 hover:text-red-600 p-1"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Purchased Section */}
      {groupedItems.purchased && groupedItems.purchased.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-500">✓ Purchased</h2>
            <button
              onClick={handleClearPurchased}
              className="text-sm text-gray-500 hover:text-red-600"
            >
              Clear all
            </button>
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-100">
            {groupedItems.purchased.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3"
              >
                <button
                  onClick={() => togglePurchased(item)}
                  className="w-6 h-6 rounded-full bg-green-500 border-2 border-green-500 text-white flex items-center justify-center"
                >
                  ✓
                </button>
                <span className="flex-1 text-gray-400 line-through">
                  {item.name}
                  {item.quantity && (
                    <span className="ml-2 text-sm">
                      ({item.quantity} {item.unit})
                    </span>
                  )}
                </span>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-gray-400 hover:text-red-600 p-1"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Add Item</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity (optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    {['kg', 'g', 'L', 'ml', 'pieces', 'packets', 'bunch'].map(
                      (u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
