import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, ResponsiveContainer } from 'recharts';
import { Eye, Heart, Bell } from 'lucide-react';
import TimeframeSelector, { Timeframe } from './TimeframeSelector';
import EditModal from './EditModal';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { format } from 'date-fns';

interface MetricCardProps {
  type: 'views' | 'likes';
  value: number;
  percentChange: number;
  chartColor: string;
  isLayoutMode?: boolean;
  data?: {
    current: {
      views: number;
      likes: number;
      retweets: number;
      replies: number;
      uniqueAuthors: number;
      memberCount: number;
      lastUpdated: string;
    };
    history: Array<{
      timestamp: string;
      time: string;
      views: number;
      likes: number;
      retweets: number;
      replies: number;
      uniqueAuthors: number;
    }>;
  };
}

const MetricCard = ({ 
  type, 
  value, 
  percentChange, 
  chartColor, 
  isLayoutMode = false, 
  data 
}: MetricCardProps) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('5m');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [savedAlerts, setSavedAlerts] = useState<Array<{ 
    value: number; 
    timeframe: Timeframe;
    type: 'above' | 'below';
    id: string;
  }>>([]);
  const [newAlertValue, setNewAlertValue] = useState('');
  const [alertType, setAlertType] = useState<'above' | 'below'>('above');

  // Build chart data from real backend history
  const chartData = useMemo(() => {
    if (!data?.history) {
      // Fallback to mock data if no real data
      const mockData = [];
      const timeLabels = ['6h', '12h', '18h', '24h', 'Now'];
      
      const baseMultiplier = timeframe === '5m' ? 0.6 : timeframe === '15m' ? 0.65 : 0.7;
      const growthMultiplier = timeframe === '5m' ? 0.02 : timeframe === '15m' ? 0.025 : 0.03;
      
      let base = value * baseMultiplier;
      for (let i = 0; i < timeLabels.length; i++) {
        base += Math.random() * (value * 0.05) + (value * growthMultiplier);
        mockData.push({ 
          value: Math.round(base),
          time: timeLabels[i]
        });
      }
      return mockData;
    }

    // Use real historical data from backend
    const history = [...data.history];
    
    // Filter based on timeframe
    let filteredData = history;
    switch (timeframe) {
      case '5m':
        filteredData = history.slice(-8);
        break;
      case '15m':
        filteredData = history.slice(-12);
        break;
      case '1h':
        filteredData = history.slice(-16);
        break;
      default:
        filteredData = history;
    }

    // Format time labels
    return filteredData.map((point, index) => ({
      value: type === 'views' ? point.views : point.likes,
      time: index === filteredData.length - 1 ? 'Now' : format(new Date(point.timestamp), 'HH:mm'),
    }));
  }, [data, type, timeframe, value]);

  // Check for active alerts
  const checkAlerts = useMemo(() => {
    const currentValue = type === 'views' ? data?.current?.views : data?.current?.likes;
    if (!currentValue) return [];

    const triggeredAlerts = savedAlerts.filter(alert => {
      if (alert.timeframe !== timeframe) return false;
      
      if (alert.type === 'above' && currentValue >= alert.value) {
        return true;
      }
      if (alert.type === 'below' && currentValue <= alert.value) {
        return true;
      }
      return false;
    });

    return triggeredAlerts;
  }, [data, type, timeframe, savedAlerts]);

  // Show toast when alerts are triggered
  useState(() => {
    if (checkAlerts.length > 0) {
      checkAlerts.forEach(alert => {
        console.log(`ALERT: ${type} is ${alert.type === 'above' ? 'above' : 'below'} ${alert.value} in ${timeframe}`);
        // You can integrate with your toast system here
      });
    }
  });

  const Icon = type === 'views' ? Eye : Heart;
  const label = type === 'views' ? 'Views' : 'Likes';
  const isPositive = percentChange > 0;

  return (
    <div 
      className="border border-[hsl(var(--dashboard-border))] rounded-2xl p-5 h-full flex flex-col overflow-hidden relative"
      style={{
        background: 'linear-gradient(180deg, #0D0D0D 0%, #121212 100%)'
      }}
    >
      {/* Alert Button & Timeframe Selector */}
      {!isLayoutMode && (
        <div className="absolute top-5 right-5 z-10 flex items-center gap-2">
          <button
            onClick={() => setIsAlertOpen(true)}
            className={`transition-colors relative ${
              savedAlerts.length > 0 ? 'text-[#8A2BE2] hover:text-[#8A2BE2]/80' : 'text-[#AAAAAA] hover:text-white'
            }`}
          >
            <Bell className="h-4 w-4" />
            {checkAlerts.length > 0 && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
          {/* <TimeframeSelector value={timeframe} onChange={setTimeframe} /> */}
        </div>
      )}

      <EditModal
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        title={`${type === 'views' ? 'Views' : 'Likes'} Alerts`}
      >
        <div className="space-y-4">
          {/* Active Alerts Display */}
          {savedAlerts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Active Alerts</Label>
                <button
                  onClick={() => setSavedAlerts([])}
                  className="text-xs text-muted-foreground hover:text-[#8A2BE2] transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {savedAlerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className={`flex items-center justify-between p-3 rounded-lg text-sm ${
                      checkAlerts.some(a => a.id === alert.id)
                        ? 'bg-red-500/20 border border-red-500'
                        : 'bg-[#1A1F2C] border border-[#8A2BE2]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-medium">
                        {alert.value.toLocaleString()} {type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({alert.type === 'above' ? 'above' : 'below'} in {alert.timeframe})
                      </span>
                    </div>
                    <button
                      onClick={() => setSavedAlerts(savedAlerts.filter(a => a.id !== alert.id))}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Alert */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">
              Create new alert for {timeframe}
            </Label>
            
            {/* Alert Type Selection */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAlertType('above')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  alertType === 'above'
                    ? 'bg-[#8A2BE2] text-white'
                    : 'bg-[#1A1F2C] text-muted-foreground hover:text-foreground'
                }`}
              >
                Above
              </button>
              <button
                type="button"
                onClick={() => setAlertType('below')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  alertType === 'below'
                    ? 'bg-[#8A2BE2] text-white'
                    : 'bg-[#1A1F2C] text-muted-foreground hover:text-foreground'
                }`}
              >
                Below
              </button>
            </div>

            {/* Alert Value Input */}
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={`Enter ${type} value...`}
                value={newAlertValue}
                onChange={(e) => setNewAlertValue(e.target.value)}
                className="bg-[#1A1F2C] border-[#1E1E1E]"
              />
              <Button 
                onClick={() => {
                  const alertValue = parseInt(newAlertValue);
                  if (alertValue && alertValue > 0) {
                    const newAlert = {
                      value: alertValue,
                      timeframe,
                      type: alertType,
                      id: `${type}-${alertValue}-${timeframe}-${Date.now()}`
                    };
                    
                    // Check if similar alert already exists
                    const alertExists = savedAlerts.some(
                      alert => alert.value === newAlert.value && 
                              alert.timeframe === newAlert.timeframe && 
                              alert.type === newAlert.type
                    );

                    if (!alertExists) {
                      setSavedAlerts([...savedAlerts, newAlert]);
                      setNewAlertValue('');
                    }
                  }
                }}
                disabled={!newAlertValue || parseInt(newAlertValue) <= 0}
              >
                Add Alert
              </Button>
            </div>

            {/* Current Value Reference */}
            <div className="p-3 bg-[#1A1F2C] rounded-lg border border-[#1E1E1E]">
              <Label className="text-sm text-muted-foreground">Current Value</Label>
              <div className="text-lg font-semibold text-foreground mt-1">
                {value.toLocaleString()} {type}
              </div>
            </div>
          </div>

          <Button 
            className="w-full" 
            onClick={() => setIsAlertOpen(false)}
            variant="outline"
          >
            Done
          </Button>
        </div>
      </EditModal>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-h-0 pt-2">
        {/* Top section - Icon and Stats */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-muted-foreground" />
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {value.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {label}
                </span>
              </div>
              <div 
                className={`text-sm font-semibold mt-1 ${
                  isPositive ? 'text-[#2ECC71]' : 'text-[#E74C3C]'
                }`}
              >
                {isPositive ? '+' : ''}{percentChange}%
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              <XAxis 
                dataKey="time"
                stroke="#333333"
                tick={{ fill: '#666666', fontSize: 10 }}
                tickLine={{ stroke: '#333333' }}
                axisLine={{ stroke: '#333333' }}
                tickMargin={6}
              />
              <Line 
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                dot={false}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Alert Status Indicator */}
        {checkAlerts.length > 0 && (
          <div className="absolute bottom-3 left-3">
            <div className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30">
              {checkAlerts.length} alert{checkAlerts.length > 1 ? 's' : ''} triggered
            </div>
          </div>
        )}

        {/* Data Status Indicator */}
        {!data?.history && (
          <div className="absolute bottom-3 right-3">
            <div className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
              Sample data
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;