import { Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import Inventory from './pages/Inventory';
import MealPlan from './pages/MealPlan';
import Shopping from './pages/Shopping';
import Reviews from './pages/Reviews';
import Calendar from './pages/Calendar';
import Recipes from './pages/Recipes';
import Settings from './pages/Settings';
import { ErrorBoundary } from './components/ErrorBoundary';

// Navigation items configuration
const NAV_ITEMS = [
  { to: '/', label: 'What to Eat?' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/meal-plan', label: 'Meal Plan' },
  { to: '/shopping', label: 'Shopping' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/recipes', label: 'Recipes' },
  { to: '/settings', label: 'Settings' }
];

// Reusable nav link component to eliminate duplication
function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'text-gray-900 border-b-2 border-gray-900'
            : 'text-gray-500 hover:text-gray-700'
        }`
      }
    >
      {label}
    </NavLink>
  );
}

function App() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚫🍛</span>
              <span className="font-bold text-xl">
                <span className="text-gray-900">No</span>
                <span className="text-emerald-600">Daal</span>
                <span className="text-gray-900">Chawal</span>
              </span>
            </div>
            <div className="flex gap-1">
              {NAV_ITEMS.map((item) => (
                <NavItem key={item.to} to={item.to} label={item.label} />
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/meal-plan" element={<MealPlan />} />
            <Route path="/shopping" element={<Shopping />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default App;
