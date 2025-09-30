import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

const BuysVsSellsCard = () => {
  // Sample data for mirror chart
  const chartData = useMemo(() => {
    const data = [];
    const timeLabels = ['12h', '18h', '24h', '6h', '12h', 'Now'];
    
    for (let i = 0; i < 6; i++) {
      const buys = Math.floor(Math.random() * 30 + 40);
      const sells = -(Math.floor(Math.random() * 20 + 25)); // Negative for mirror effect
      data.push({ 
        time: timeLabels[i],
        buys,
        sells
      });
    }
    return data;
  }, []);

  const buysVolume = '5.3k';
  const buysCount = 12;
  const sellsVolume = '2.3k';
  const sellsCount = 6;
  const netVolume = '+3k';
  const isNetPositive = true;

  return (
    <div 
      className="border border-[hsl(var(--dashboard-border))] rounded-2xl p-3 h-full"
      style={{
        background: 'linear-gradient(180deg, #0D0D0D 0%, #121212 100%)'
      }}
    >
      <div className="flex items-center gap-5 h-full">
        {/* Left side - Stat boxes */}
        <div className="flex flex-col justify-center gap-3 min-w-[140px]">
          {/* Buys Box */}
          <div 
            className="rounded-lg p-3"
            style={{ background: '#102B1A' }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#2ECC71]" />
              <span className="text-xs font-medium text-[#2ECC71]/70">Buys</span>
            </div>
            <div className="text-[#2ECC71] font-bold text-xl">
              {buysVolume}
            </div>
            <div className="text-muted-foreground text-xs mt-1">
              {buysCount} transactions
            </div>
          </div>

          {/* Net Box */}
          <div 
            className="rounded-lg p-3"
            style={{ background: '#1A1A1A' }}
          >
            <div className="text-xs font-medium text-muted-foreground mb-1">
              Net
            </div>
            <div className={`font-bold text-2xl ${isNetPositive ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
              {netVolume}
            </div>
          </div>

          {/* Sells Box */}
          <div 
            className="rounded-lg p-3"
            style={{ background: '#2B1010' }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-[#E74C3C]" />
              <span className="text-xs font-medium text-[#E74C3C]/70">Sells</span>
            </div>
            <div className="text-[#E74C3C] font-bold text-xl">
              {sellsVolume}
            </div>
            <div className="text-muted-foreground text-xs mt-1">
              {sellsCount} transactions
            </div>
          </div>
        </div>

        {/* Right side - Mirror Chart */}
        <div className="flex-1 h-full flex items-center">
          <ResponsiveContainer width="100%" height="90%">
            <LineChart 
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            >
              <XAxis 
                dataKey="time"
                stroke="#333333"
                tick={{ fill: '#666666', fontSize: 10 }}
                tickLine={{ stroke: '#333333' }}
                axisLine={{ stroke: '#333333' }}
                tickMargin={8}
              />
              <YAxis 
                stroke="#333333"
                tick={{ fill: '#666666', fontSize: 10 }}
                tickLine={{ stroke: '#333333' }}
                axisLine={{ stroke: '#333333' }}
                domain={[-60, 60]}
                ticks={[-60, -30, 0, 30, 60]}
              />
              <ReferenceLine y={0} stroke="#333333" strokeWidth={1} />
              {/* Buys Line (top half) */}
              <Line 
                type="monotone"
                dataKey="buys"
                stroke="#2ECC71"
                strokeWidth={2}
                dot={false}
                animationDuration={300}
              />
              {/* Sells Line (bottom half - negative values) */}
              <Line 
                type="monotone"
                dataKey="sells"
                stroke="#E74C3C"
                strokeWidth={2}
                dot={false}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default BuysVsSellsCard;
