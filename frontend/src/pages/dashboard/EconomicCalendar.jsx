import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analysis } from '../../api/endpoints';

const EconomicCalendar = () => {
  const [filter, setFilter] = useState('All');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['economicCalendar'],
    queryFn: () => analysis.getEconomicCalendar().then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) return <div className="text-gray-400">Loading...</div>;
  if (error) return <div className="text-red-400">Error loading calendar data</div>;
  if (!data || data.length === 0) return <div className="text-gray-400">No events available</div>;

  // Get unique currencies for filter
  const currencies = ['All', ...new Set(data.map(item => item.currency))];
  let filtered = data;
  if (filter !== 'All') {
    filtered = data.filter(item => item.currency === filter);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">📅 Economic Calendar</h2>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-dark-300 text-white border border-dark-400 rounded px-3 py-1 text-sm"
          >
            {currencies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            onClick={() => refetch()}
            className="bg-dark-300 text-white border border-dark-400 rounded px-3 py-1 text-sm hover:bg-dark-400 transition"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-dark-200 rounded-lg border border-dark-300">
        <table className="w-full text-left text-sm">
          <thead className="bg-dark-300 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Date/Time</th>
              <th className="px-4 py-3">Currency</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Actual</th>
              <th className="px-4 py-3">Forecast</th>
              <th className="px-4 py-3">Previous</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, idx) => (
              <tr key={idx} className="border-b border-dark-300 hover:bg-dark-300/50 transition">
                <td className="px-4 py-2 text-white">{item.date_time}</td>
                <td className="px-4 py-2">
                  <span className="bg-dark-300 px-2 py-1 rounded text-xs font-bold text-white">
                    {item.currency}
                  </span>
                </td>
                <td className="px-4 py-2 text-white">{item.event}</td>
                <td className="px-4 py-2 text-white">{item.actual || '—'}</td>
                <td className="px-4 py-2 text-white">{item.forecast || '—'}</td>
                <td className="px-4 py-2 text-white">{item.previous || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-gray-400 text-center py-4">No events match the selected filter</div>
        )}
      </div>
    </div>
  );
};

export default EconomicCalendar;