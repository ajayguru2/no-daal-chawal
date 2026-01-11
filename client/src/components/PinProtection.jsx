import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3001';

export default function PinProtection({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinRequired, setPinRequired] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check if PIN is required
      const statusRes = await fetch(`${API_BASE}/api/auth/status`);
      const { pinRequired: required } = await statusRes.json();
      setPinRequired(required);

      if (!required) {
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }

      // Check if we have a stored PIN
      const storedPin = localStorage.getItem('app_pin');
      if (storedPin) {
        const valid = await verifyPin(storedPin);
        if (valid) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('app_pin');
        }
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    }
    setLoading(false);
  };

  const verifyPin = async (pinToVerify) => {
    const res = await fetch(`${API_BASE}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pinToVerify })
    });
    const data = await res.json();
    return data.valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const valid = await verifyPin(pin);
      if (valid) {
        localStorage.setItem('app_pin', pin);
        setIsAuthenticated(true);
      } else {
        setError('Invalid PIN');
        setPin('');
      }
    } catch (err) {
      setError('Failed to verify PIN');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return children;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="text-4xl">🚫🍛</span>
          <h1 className="mt-2 text-xl font-bold">
            <span className="text-gray-900">No</span>
            <span className="text-emerald-600">Daal</span>
            <span className="text-gray-900">Chawal</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Enter PIN to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center text-2xl tracking-widest"
            autoFocus
          />
          {error && (
            <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
          )}
          <button
            type="submit"
            className="w-full mt-4 bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
