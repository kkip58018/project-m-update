import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

const TrendSettings = () => {
  const [periods, setPeriods] = useState('20,50,100,200');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['trendSettings'],
    queryFn: () => api.get('/admin/trend-settings/').then(res => res.data),
  });

  useEffect(() => {
    if (data?.ma_periods) {
      setPeriods(data.ma_periods.join(','));
    }
  }, [data]);

  const updateSettings = useMutation({
    mutationFn: (periodsArray) => api.put('/admin/trend-settings/', { ma_periods: periodsArray }),
    onSuccess: () => {
      alert('Trend settings updated successfully');
      queryClient.invalidateQueries(['trendSettings']);
    },
    onError: (error) => alert(`Error: ${error.response?.data?.error || error.message}`),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const periodsArray = periods.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p) && p > 0);
    if (periodsArray.length === 0) {
      alert('Please enter at least one valid period');
      return;
    }
    updateSettings.mutate(periodsArray);
  };

  if (isLoading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-4">⚙️ Trend Settings</h2>
      <div className="bg-dark-200 p-6 rounded-lg border border-dark-300 max-w-lg">
        <p className="text-gray-400 mb-4">
          Configure the moving average periods used for trend detection.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-1">SMA Periods (comma-separated)</label>
            <input
              type="text"
              value={periods}
              onChange={(e) => setPeriods(e.target.value)}
              className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
              placeholder="e.g., 20,50,100,200"
            />
            <p className="text-gray-500 text-xs mt-1">Current: {data?.ma_periods?.join(', ') || '20,50,100,200'}</p>
          </div>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition"
            disabled={updateSettings.isPending}
          >
            {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TrendSettings;