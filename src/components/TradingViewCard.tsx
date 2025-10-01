import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type Timeframe = '1M' | '5M' | '15M' | '30M' | '1H' | '4H' | '1D';

interface TradingViewCardProps {
  isExpanded?: boolean;
  isLayoutMode?: boolean;
}

const TradingViewCard = ({ isExpanded = false, isLayoutMode = false }: TradingViewCardProps) => {
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('5M');

  // Generate sample chart data
  const chartData = useMemo(() => {
    const data = [];
    const now = Date.now();
    let basePrice = 0.0035;
    
    for (let i = 0; i < 60; i++) {
      basePrice += (Math.random() - 0.5) * 0.0001;
      const time = new Date(now - (60 - i) * 60000);
      data.push({
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        price: parseFloat(basePrice.toFixed(6)),
      });
    }
    return data;
  }, [activeTimeframe]);

  const handleTimeframeChange = (timeframe: Timeframe) => {
    setActiveTimeframe(timeframe);
  };

  const timeframes: Timeframe[] = isExpanded 
    ? ['1M', '5M', '15M', '30M', '1H', '4H', '1D']
    : ['1M', '5M', '15M', '30M'];

  return (
    <div 
      className="border border-[hsl(var(--dashboard-border))] rounded-2xl p-6 flex flex-col h-full transition-all duration-300 hover:scale-[1.01]"
      style={{
        background: 'linear-gradient(180deg, #0D0D0D 0%, #121212 100%)'
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-foreground font-semibold text-lg">MBA$ • MC 35.7k</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {isExpanded ? 'Expanded Live Price Chart • Advanced Indicators' : 'Live Price Chart'}
          </p>
        </div>
        
        {/* Timeframe Toggle - Desktop */}
        {!isLayoutMode && (
          <div className="hidden md:flex gap-1 bg-[#0A0A0A] rounded-lg p-1">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTimeframe === tf
                    ? 'bg-[#2A2A2A] text-white'
                    : 'text-[#CCCCCC] hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        )}

        {/* Timeframe Dropdown - Mobile */}
        {!isLayoutMode && (
          <select
            value={activeTimeframe}
            onChange={(e) => handleTimeframeChange(e.target.value as Timeframe)}
            className="md:hidden bg-[#0A0A0A] text-white text-xs px-3 py-1.5 rounded-lg border border-[hsl(var(--dashboard-border))] focus:outline-none focus:ring-2 focus:ring-[#2A2A2A]"
          >
            {timeframes.map((tf) => (
              <option key={tf} value={tf}>
                {tf}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Chart Container */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              stroke="#AAAAAA"
              tick={{ fill: '#AAAAAA', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#1E1E1E' }}
            />
            <YAxis 
              stroke="#AAAAAA"
              tick={{ fill: '#AAAAAA', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#1E1E1E' }}
              domain={['dataMin - 0.0001', 'dataMax + 0.0001']}
              tickFormatter={(value) => value.toFixed(4)}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#0A0A0A',
                border: '1px solid #1E1E1E',
                borderRadius: '8px',
                color: '#FFFFFF',
              }}
              labelStyle={{ color: '#AAAAAA' }}
              formatter={(value: number) => [`$${value.toFixed(6)}`, 'Price']}
            />
            <Area 
              type="monotone"
              dataKey="price"
              stroke="#FFFFFF"
              strokeWidth={2}
              fill="url(#priceGradient)"
              animationDuration={300}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TradingViewCard;
