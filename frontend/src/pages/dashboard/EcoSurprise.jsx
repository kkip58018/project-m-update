import { useQuery } from '@tanstack/react-query';
import { analysis } from '../../api/endpoints';
import EcoSurpriseGauge from '../../components/charts/EcoSurpriseGauge';
import { TrendingUp } from 'lucide-react'

const EcoSurprise = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ecoSurprise'],
    queryFn: () => analysis.getEcoSurprise().then(res => res.data),
  });

  if (isLoading) return <div className="text-gray-400">Loading...</div>;
  if (error) return <div className="text-red-400">Error loading data</div>;
  if (!data || data.length === 0) return <div className="text-gray-400">No data available</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 text-white flex items-center gap-2"><TrendingUp className="w-6 h-6" />  Eco Surprise Index</h2>
      <p className="text-gray-400 mb-6">
        Bullish percentage – proportion of economic indicators that beat forecasts.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data.map((item) => (
          <div key={item.currency} className="bg-dark-200 p-3 rounded-lg border border-dark-300">
            <EcoSurpriseGauge value={item.bullish_percentage} />
            <div className="text-center text-gray-400 text-sm mt-1">
              {item.currency}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EcoSurprise;