import { useState, useEffect, useMemo, useCallback } from 'react';
import { inventory } from '../api/client';

const CATEGORIES = [
  { value: 'grains', label: 'Grains & Staples', emoji: '🌾' },
  { value: 'spices', label: 'Spices', emoji: '🌶️' },
  { value: 'vegetables', label: 'Vegetables', emoji: '🥬' },
  { value: 'dairy', label: 'Dairy', emoji: '🥛' },
  { value: 'proteins', label: 'Proteins', emoji: '🥩' },
  { value: 'others', label: 'Others', emoji: '📦' },
];

const UNITS = ['kg', 'g', 'L', 'ml', 'pieces', 'packets', 'bunch', 'tbsp', 'tsp'];

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'vegetables',
    quantity: '',
    unit: 'kg',
    lowStockAt: '',
  });

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      const data = await inventory.getAll();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingItem) {
        await inventory.update(editingItem.id, {
          ...formData,
          quantity: parseFloat(formData.quantity),
          lowStockAt: formData.lowStockAt ? parseFloat(formData.lowStockAt) : null,
        });
      } else {
        await inventory.add({
          ...formData,
          quantity: parseFloat(formData.quantity),
          lowStockAt: formData.lowStockAt ? parseFloat(formData.lowStockAt) : null,
        });
      }
      resetForm();
      loadItems();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id) {
    // Optimistic delete for instant feedback
    const deletedItem = items.find(i => i.id === id);
    setItems(prev => prev.filter(i => i.id !== id));

    try {
      await inventory.delete(id);
    } catch (err) {
      // Revert on error
      setItems(prev => [...prev, deletedItem].sort((a, b) => a.name.localeCompare(b.name)));
      console.error(err);
    }
  }

  // Optimistic update for instant feedback
  async function updateQuantity(item, delta) {
    const newQty = Math.max(0, item.quantity + delta);
    const oldQty = item.quantity;

    // Optimistically update the UI immediately
    setItems(prev => prev.map(i =>
      i.id === item.id ? { ...i, quantity: newQty } : i
    ));

    try {
      await inventory.update(item.id, { quantity: newQty });
    } catch (err) {
      // Revert on error
      setItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, quantity: oldQty } : i
      ));
      console.error(err);
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      category: 'vegetables',
      quantity: '',
      unit: 'kg',
      lowStockAt: '',
    });
    setShowAdd(false);
    setEditingItem(null);
  }

  function startEdit(item) {
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity.toString(),
      unit: item.unit,
      lowStockAt: item.lowStockAt?.toString() || '',
    });
    setEditingItem(item);
    setShowAdd(true);
  }

  // Memoize filtered items
  const filteredItems = useMemo(() => {
    return filter ? items.filter((i) => i.category === filter) : items;
  }, [items, filter]);

  // Memoize grouped items
  const groupedItems = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});
  }, [filteredItems]);

  // Memoize low stock items
  const lowStockItems = useMemo(() => {
    return items.filter((i) => i.lowStockAt && i.quantity <= i.lowStockAt);
  }, [items]);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kitchen Inventory</h1>
          <p className="text-gray-500">{items.length} items tracked</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 py-2 rounded-lg"
        >
          + Add Item
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="font-medium text-amber-800 mb-2">
            ⚠️ Low Stock ({lowStockItems.length} items)
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((item) => (
              <span
                key={item.id}
                className="text-sm px-2 py-1 bg-amber-100 text-amber-800 rounded"
              >
                {item.name} ({item.quantity} {item.unit})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('')}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
            !filter
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              filter === cat.value
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {Object.entries(groupedItems).map(([category, categoryItems]) => {
        const catInfo = CATEGORIES.find((c) => c.value === category) || {
          label: category,
          emoji: '📦',
        };
        return (
          <div key={category} className="space-y-3">
            <h2 className="font-semibold text-gray-700">
              {catInfo.emoji} {catInfo.label}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {categoryItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg border p-4 ${
                    item.lowStockAt && item.quantity <= item.lowStockAt
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(item)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-gray-400 hover:text-red-600 p-1"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item, -0.25)}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold"
                    >
                      -
                    </button>
                    <span className="text-lg font-semibold text-gray-900 min-w-[80px] text-center">
                      {item.quantity} {item.unit}
                    </span>
                    <button
                      onClick={() => updateQuantity(item, 0.25)}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold"
                    >
                      +
                    </button>
                  </div>
                  {item.lowStockAt && (
                    <div className="text-xs text-gray-500 mt-2">
                      Alert when below: {item.lowStockAt} {item.unit}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingItem ? 'Edit Item' : 'Add Item'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Low stock alert (optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.lowStockAt}
                  onChange={(e) =>
                    setFormData({ ...formData, lowStockAt: e.target.value })
                  }
                  placeholder="Alert when below this quantity"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg"
                >
                  {editingItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
