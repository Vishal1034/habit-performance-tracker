import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch, buildApiUrl } from '../utils/apiFetch';
import HabitBreakdownPie from './HabitBreakdownPie';

const minutes = (seconds) => Math.round((seconds || 0) / 60);

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthLabels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const LIVE_REFRESH_MS = 15000;

const getHeatClass = (minutesValue) => {
  if (minutesValue <= 0) return 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700';
  if (minutesValue < 15) return 'bg-emerald-200 dark:bg-emerald-900/70 border-emerald-300 dark:border-emerald-700/50';
  if (minutesValue < 45) return 'bg-emerald-300 dark:bg-emerald-700/80 border-emerald-400 dark:border-emerald-500/50';
  if (minutesValue < 90) return 'bg-emerald-400 dark:bg-emerald-500/90 border-emerald-500 dark:border-emerald-300/60';
  return 'bg-emerald-500 dark:bg-emerald-300 border-emerald-600 dark:border-emerald-200';
};

const toDateKey = (value) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const shiftMonth = (date, offset) => {
  const value = new Date(date);
  value.setDate(1);
  value.setMonth(value.getMonth() + offset);
  return value;
};

const getMonthDiff = (startDate, endDate) => (
  ((endDate.getFullYear() - startDate.getFullYear()) * 12) + (endDate.getMonth() - startDate.getMonth())
);

const buildMonthCalendarCells = (history, refDate = new Date()) => {
  const historyMap = new Map(history.map((entry) => [entry.date, entry]));

  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlankCount = firstOfMonth.getDay();

  const cells = [];

  for (let i = 0; i < leadingBlankCount; i += 1) {
    cells.push({
      key: `blank-${i}`,
      isBlank: true,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cellDate = new Date(year, month, day);
    const dateKey = toDateKey(cellDate);
    const entry = historyMap.get(dateKey);

    const trackedSeconds = entry?.totalTrackedTime || 0;
    cells.push({
      key: dateKey,
      isBlank: false,
      date: dateKey,
      day,
      trackedMinutes: minutes(trackedSeconds),
    });
  }

  return {
    monthLabel: `${monthLabels[month]} ${year}`,
    cells,
  };
};

const DailyAnalyticsPanel = () => {
  const { logout } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedHabits, setSelectedHabits] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchHistory = async ({ silent = false } = {}) => {
      try {
        if (!silent && isMounted) {
          setLoading(true);
        }
        if (isMounted) {
          setError('');
        }

        const response = await apiFetch(buildApiUrl('/api/analytics/history?days=90'), {
          headers: {
            'Content-Type': 'application/json',
          },
        }, logout);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Failed to fetch history');
        }

        if (isMounted) {
          setHistory(result.data?.history || []);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message || 'Failed to load history');
        }
      } finally {
        if (!silent && isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHistory();

    const intervalId = window.setInterval(() => {
      fetchHistory({ silent: true });
    }, LIVE_REFRESH_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [logout]);

  const handleBarClick = async (dateString) => {
    try {
      setSelectedDate(dateString);
      
      const dateEntry = history.find((item) => item.date === dateString);
      
      if (!dateEntry) {
        setSelectedHabits([]);
        return;
      }

      try {
        const response = await apiFetch(
          buildApiUrl(`/api/analytics/date?date=${dateString}`),
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
          logout
        );
        const result = await response.json();

        if (result.success && result.data?.habits && result.data.habits.length > 0) {
          setSelectedHabits(result.data.habits);
        } else {
          const fallbackHabits = [];
          
          if (dateEntry.totalFocusTime > 0) {
            fallbackHabits.push({
              id: 'focus-summary',
              name: 'Focus Activities',
              type: 'focus',
              timeSpent: dateEntry.totalFocusTime,
              completionRate: 100,
            });
          }
          
          if (dateEntry.totalDistractionTime > 0) {
            fallbackHabits.push({
              id: 'distraction-summary',
              name: 'Distraction Activities',
              type: 'distraction',
              timeSpent: dateEntry.totalDistractionTime,
              completionRate: 100,
            });
          }
          
          setSelectedHabits(fallbackHabits);
        }
      } catch (apiError) {
        console.log('Detailed endpoint error, using summary fallback:', apiError.message);
        
        const fallbackHabits = [];
        
        if (dateEntry.totalFocusTime > 0) {
          fallbackHabits.push({
            id: 'focus-summary',
            name: 'Focus Activities',
            type: 'focus',
            timeSpent: dateEntry.totalFocusTime,
            completionRate: 100,
          });
        }
        
        if (dateEntry.totalDistractionTime > 0) {
          fallbackHabits.push({
            id: 'distraction-summary',
            name: 'Distraction Activities',
            type: 'distraction',
            timeSpent: dateEntry.totalDistractionTime,
            completionRate: 100,
          });
        }
        
        setSelectedHabits(fallbackHabits);
      }
    } catch (err) {
      console.error('Error selecting date:', err);
      setSelectedHabits([]);
    }
  };

  const chartData = useMemo(() => history.slice(-14), [history]);
  const maxDailyMinutes = useMemo(
    () => Math.max(...chartData.map((item) => minutes(item.totalTrackedTime)), 1),
    [chartData]
  );
  const displayedMonth = useMemo(() => shiftMonth(new Date(), monthOffset), [monthOffset]);
  const monthCalendar = useMemo(() => buildMonthCalendarCells(history, displayedMonth), [history, displayedMonth]);
  const oldestHistoryMonth = useMemo(() => {
    if (!history.length) return new Date();
    return new Date(`${history[0].date}T00:00:00`);
  }, [history]);
  const minMonthOffset = useMemo(() => {
    const now = new Date();
    const diff = getMonthDiff(oldestHistoryMonth, now);
    return -Math.max(0, diff);
  }, [oldestHistoryMonth]);
  const canGoNextMonth = monthOffset < 0;
  const canGoPrevMonth = monthOffset > minMonthOffset;

  if (loading) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mt-8 text-slate-600 dark:text-slate-400">
        Loading daily analytics...
      </div>
    );
  }

  return (
     <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
         <h3 className="text-xl font-bold text-slate-900 dark:text-white">Daily Tracking Analytics</h3>
         <span className="text-xs px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">Last 90 days</span>
      </div>

      {error ? (
         <div className="text-rose-500 dark:text-rose-400 text-sm">{error}</div>
      ) : (
        <>
          <div className="mb-7">
               <h4 className="text-slate-700 dark:text-slate-200 font-semibold mb-3">14-Day Activity Graph</h4>
            {chartData.length === 0 ? (
                 <div className="text-slate-600 dark:text-slate-400 text-sm">No tracking history yet.</div>
            ) : (
              <div className="grid grid-cols-7 md:grid-cols-14 gap-2 items-end h-36">
                {chartData.map((item) => {
                  const day = new Date(`${item.date}T00:00:00`);
                  const totalMinutes = minutes(item.totalTrackedTime);
                  const focusMinutes = minutes(item.totalFocusTime);
                  const distractionMinutes = minutes(item.totalDistractionTime);
                  const heightPct = Math.max(8, Math.round((totalMinutes / maxDailyMinutes) * 100));
                  const isSelected = selectedDate === item.date;

                  return (
                    <div key={item.date} className="flex flex-col items-center justify-end gap-2">
                      <div
                        onClick={() => handleBarClick(item.date)}
                        title={`${item.date}: ${totalMinutes}m total (${focusMinutes}m focus, ${distractionMinutes}m distraction)\nClick to view habit breakdown`}
                        className={`w-full rounded-md bg-gradient-to-t from-indigo-700 to-cyan-400 cursor-pointer transition-all ${
                          isSelected ? 'ring-2 ring-yellow-400 shadow-lg' : 'hover:opacity-80'
                        }`}
                        style={{ height: `${heightPct}%`, minHeight: '10px' }}
                      />
                      <span className={`text-[10px] ${isSelected ? 'text-amber-600 dark:text-yellow-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                        {day.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedDate && (
            <div className="mb-7">
              <HabitBreakdownPie selectedDate={selectedDate} habits={selectedHabits} />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-slate-800 dark:text-slate-200 font-semibold">Tracking Calendar</h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMonthOffset((prev) => prev - 1)}
                  disabled={!canGoPrevMonth}
                  className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <span className="text-xs text-slate-600 dark:text-slate-400 min-w-[100px] text-center">{monthCalendar.monthLabel}</span>
                <button
                  type="button"
                  onClick={() => setMonthOffset((prev) => Math.min(prev + 1, 0))}
                  disabled={!canGoNextMonth}
                  className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
            {monthCalendar.cells.length === 0 ? (
              <div className="text-slate-600 dark:text-slate-400 text-sm">No calendar data yet.</div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {weekdayLabels.map((label) => (
                    <div key={label} className="text-[11px] text-slate-500 text-center">{label}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {monthCalendar.cells.map((cell) => (
                    cell.isBlank ? (
                      <div key={cell.key} className="h-12 rounded-md border border-transparent" aria-hidden="true" />
                    ) : (
                      <div
                        key={cell.key}
                        className={`h-12 rounded-md border ${getHeatClass(cell.trackedMinutes)} flex flex-col items-center justify-center`}
                        title={`${cell.date} - ${cell.trackedMinutes}m tracked`}
                      >
                        <span className="text-[11px] text-slate-900 dark:text-slate-100 leading-none">{cell.day}</span>
                        <span className="text-[10px] text-slate-700 dark:text-slate-300 leading-none mt-1">{cell.trackedMinutes}m</span>
                      </div>
                    )
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DailyAnalyticsPanel;
