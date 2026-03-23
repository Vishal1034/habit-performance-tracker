import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch, buildApiUrl } from '../utils/apiFetch';

const HabitManager = ({ onLogout }) => {
  const { userEmail } = useAuth();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: 'focus',
    urls: '',
    dailyGoal: '60',
  });

  const fetchHabits = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch(buildApiUrl('/api/habits'), {}, onLogout);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch habits');
      }

      setHabits(result.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch habits');
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits, userEmail]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim() || !formData.urls.trim() || !formData.dailyGoal) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const urlArray = formData.urls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url);

      if (urlArray.length === 0) {
        setError('Please provide at least one URL');
        return;
      }

      const payload = {
        name: formData.name,
        type: formData.type,
        urls: urlArray,
        dailyGoal: parseInt(formData.dailyGoal, 10) * 60,
      };

      let result;
      let response;
      if (editingId) {
        response = await apiFetch(
          buildApiUrl(`/api/habits/${editingId}`),
          { method: 'PUT', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } },
          onLogout
        );
      } else {
        response = await apiFetch(
          buildApiUrl('/api/habits'),
          { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } },
          onLogout
        );
      }

      result = await response.json();

      if (response.ok && result.success) {
        setSuccess(editingId ? 'Habit updated successfully' : 'Habit created successfully');
        setFormData({ name: '', type: 'focus', urls: '', dailyGoal: '60' });
        setEditingId(null);
        setFormVisible(false);
        fetchHabits();
      } else {
        setError(result.message || 'Failed to save habit');
      }
    } catch (err) {
      setError(err.message || 'Error saving habit');
    }
  };

  const handleEdit = (habit) => {
    setFormData({
      name: habit.name,
      type: habit.type,
      urls: habit.urls.join('\n'),
      dailyGoal: String(habit.dailyGoal / 60),
    });
    setEditingId(habit._id);
    setFormVisible(true);
  };

  const handleDelete = async (habitId) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      try {
        const response = await apiFetch(
          buildApiUrl(`/api/habits/${habitId}`),
          { method: 'DELETE' },
          onLogout
        );
        const result = await response.json();

        if (response.ok && result.success) {
          setSuccess('Habit deleted successfully');
          fetchHabits();
        } else {
          setError(result.message || 'Failed to delete habit');
        }
      } catch (err) {
        setError(err.message || 'Error deleting habit');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', type: 'focus', urls: '', dailyGoal: '60' });
    setEditingId(null);
    setFormVisible(false);
    setError('');
    setSuccess('');
  };

  return (
     <div className="flex-1 bg-white dark:bg-slate-950 p-8 overflow-y-auto max-h-screen">
       <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-8">Habit Management</h1>

      {success && (
         <div className="mb-4 p-4 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-lg">
          {success}
        </div>
      )}

      {error && (
         <div className="mb-4 p-4 bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 rounded-lg">
          {error}
        </div>
      )}

      <div className="mb-8">
        {!formVisible && (
          <button
            onClick={() => setFormVisible(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
          >
            + Create New Habit
          </button>
        )}

        {formVisible && (
          <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{editingId ? 'Edit Habit' : 'Create New Habit'}</h2>

            <div className="mb-4">
              <label className="text-slate-800 dark:text-white font-semibold block mb-2">Habit Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., GitHub Coding"
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2 rounded border border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="text-slate-800 dark:text-white font-semibold block mb-2">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2 rounded border border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:outline-none"
              >
                <option value="focus">Focus (productive)</option>
                <option value="distraction">Distraction (unproductive)</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="text-slate-800 dark:text-white font-semibold block mb-2">URLs (one per line, e.g., github.com)</label>
              <textarea
                name="urls"
                value={formData.urls}
                onChange={handleInputChange}
                placeholder="github.com&#10;stackoverflow.com"
                rows="4"
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2 rounded border border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="mb-6">
              <label className="text-slate-800 dark:text-white font-semibold block mb-2">Daily Goal (minutes)</label>
              <input
                type="number"
                name="dailyGoal"
                value={formData.dailyGoal}
                onChange={handleInputChange}
                min="1"
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2 rounded border border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
              >
                {editingId ? 'Update Habit' : 'Create Habit'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Your Habits</h2>
        {loading ? (
          <div className="text-slate-600 dark:text-slate-400">Loading habits...</div>
        ) : habits.length === 0 ? (
          <div className="text-slate-600 dark:text-slate-400">No habits yet. Create one to get started!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {habits.map(habit => (
              <div key={habit._id} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{habit.name}</h3>
                <div className="mb-3">
                  <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                    habit.type === 'focus'
                      ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200'
                  }`}>
                    {habit.type === 'focus' ? 'Focus' : 'Distraction'}
                  </span>
                </div>
                <div className="mb-3">
                  <p className="text-slate-700 dark:text-slate-300 text-sm"><strong>URLs:</strong></p>
                  <ul className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                    {habit.urls.map((url, idx) => (
                      <li key={idx} className="ml-2">- {url}</li>
                    ))}
                  </ul>
                </div>
                <div className="mb-4">
                  <p className="text-slate-700 dark:text-slate-300 text-sm"><strong>Daily Goal:</strong> {Math.round(habit.dailyGoal / 60)} minutes</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(habit)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-3 rounded text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(habit._id)}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-1 px-3 rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitManager;
