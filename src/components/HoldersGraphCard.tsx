import { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, Users, Bell, RefreshCw } from 'lucide-react';
import EditModal from './EditModal';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';

interface HoldersGraphCardProps {
  isExpanded?: boolean;
  isLayoutMode?: boolean;
  data?: {
    current: {
      holderCount: number;
      percentChange: number;
      holderIncrease: number;
      lastUpdated: string;
      walletAgeDistribution: Record<string, number>;
      totalHolders: number;
    };
    history: Array<{
      timestamp: string;
      time: string;
      value: number;
      marketCap: number;
      uniqueAuthors: number;
      totalViews: number;
    }>;
  };
}

const HoldersGraphCard = ({ isExpanded = false, isLayoutMode = false, data }: HoldersGraphCardProps) => {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [savedAlerts, setSavedAlerts] = useState<number[]>([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState<number[]>([]);
  const [newAlertValue, setNewAlertValue] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [triggeredAlertMessage, setTriggeredAlertMessage] = useState('');

  const currentData = data?.current || {
    holderCount: 65,
    percentChange: 8,
    holderIncrease: 12,
    lastUpdated: new Date().toISOString(),
    walletAgeDistribution: { baby: 15, adult: 35, old: 15 },
    totalHolders: 65
  };

  const historyData = data?.history || [];
  const { holderCount, percentChange, holderIncrease } = currentData;
  const isPositive = percentChange > 0;

  // Trigger alerts with sound & on-screen message
  useEffect(() => {
    savedAlerts.forEach(alertValue => {
      if (holderCount >= alertValue && !triggeredAlerts.includes(alertValue)) {
        // Show message
        setTriggeredAlertMessage(`🚨 Holders reached ${alertValue}!`);

        // Play ting sound
        const audio = new Audio('/ting.mp3'); // put ting.mp3 in public folder
        audio.play();

        // Record as triggered
        setTriggeredAlerts(prev => [...prev, alertValue]);

        // Clear message after 5s
        setTimeout(() => setTriggeredAlertMessage(''), 5000);
      }
    });
  }, [holderCount, savedAlerts, triggeredAlerts]);

  const chartData = useMemo(() => {
    if (!historyData.length) {
      const data = [];
      let base = 50;
      const timeLabels = isExpanded 
        ? ['1d', '6h', '12h', '18h', '24h', '6h', '12h', '18h', '24h', 'Now']
        : ['12h', '18h', '24h', '6h', '12h', 'Now'];
      for (let i = 0; i < timeLabels.length; i++) {
        base += Math.random() * 5 + 2;
        data.push({ value: Math.round(base), time: timeLabels[i] });
      }
      return data;
    }
    return [...historyData];
  }, [historyData, isExpanded]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div 
      className="border border-[hsl(var(--dashboard-border))] rounded-2xl p-5 h-full relative"
      style={{ background: 'linear-gradient(180deg, #0D0D0D 0%, #121212 100%)' }}
    >
      {/* Triggered alert message */}
      {triggeredAlertMessage && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-4 py-2 rounded shadow-lg z-50">
          {triggeredAlertMessage}
        </div>
      )}

      {/* Alert & Refresh */}
      {!isLayoutMode && (
        <div className="flex justify-end items-center gap-2 mb-2">
          <button
            onClick={() => setIsAlertOpen(true)}
            className={`transition-colors ${savedAlerts.length > 0 ? 'text-[#8A2BE2] hover:text-[#8A2BE2]/80' : 'text-[#AAAAAA] hover:text-white'}`}
          >
            <Bell className="h-4 w-4" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-[#AAAAAA] hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      )}

      {/* Alert Modal */}
      <EditModal
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        title="Holders Alerts"
      >
        <div className="space-y-4">
          {savedAlerts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Active Alerts</Label>
                <button
                  onClick={() => { setSavedAlerts([]); setTriggeredAlerts([]); }}
                  className="text-xs text-muted-foreground hover:text-[#8A2BE2] transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {savedAlerts.map((alertValue, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1F2C] border border-[#8A2BE2] rounded-lg text-sm"
                  >
                    <span className="text-foreground font-medium">{alertValue} holders</span>
                    <button
                      onClick={() => {
                        setSavedAlerts(savedAlerts.filter((_, i) => i !== index));
                        setTriggeredAlerts(triggeredAlerts.filter(v => v !== alertValue));
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="holder-alert" className="text-sm text-muted-foreground">
              Alert me when holders reach
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="holder-alert"
                type="number"
                placeholder="e.g., 100"
                value={newAlertValue}
                onChange={(e) => setNewAlertValue(e.target.value)}
                className="bg-[#1A1F2C] border-[#1E1E1E]"
              />
              <Button 
                onClick={() => {
                  const value = parseInt(newAlertValue);
                  if (value && value > 0 && !savedAlerts.includes(value)) {
                    setSavedAlerts([...savedAlerts, value].sort((a, b) => a - b));
                    setNewAlertValue('');
                  }
                }}
                disabled={!newAlertValue || parseInt(newAlertValue) <= 0}
              >
                Add
              </Button>
            </div>
          </div>

          <Button className="w-full" onClick={() => setIsAlertOpen(false)}>Done</Button>
        </div>
      </EditModal>

      {/* Holder Info & Chart */}
      <div className="flex flex-col h-full -mt-1">
        <div className="flex items-center gap-3 mb-1">
          <Users className="w-6 h-6 text-muted-foreground" />
          <div className="flex items-center gap-4">
            <div>
              <div className="text-foreground text-xl font-bold">{holderCount.toLocaleString()}</div>
              <div className="text-muted-foreground text-[10px]">Total Holders</div>
            </div>
            <div className={`flex items-center gap-1.5 ${isPositive ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
              <TrendingUp className={`w-3 h-3 ${!isPositive && 'rotate-180'}`} />
              <span className="text-xs font-semibold">{isPositive ? '+' : ''}{percentChange.toFixed(1)}%</span>
              <span className="text-[10px] font-medium">({isPositive ? '↑' : '↓'} {Math.abs(holderIncrease)})</span>
            </div>
          </div>
        </div>

        <div className="w-full" style={{ height: '50%', marginTop: '5%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData}
              margin={{ top: 0, right: 10, left: 0, bottom: 5 }}
            >
              <XAxis dataKey="time" stroke="#333333" tick={{ fill: '#666666', fontSize: 10 }} tickLine={{ stroke: '#333333' }} axisLine={{ stroke: '#333333' }} tickMargin={8} />
              <YAxis stroke="#333333" tick={{ fill: '#666666', fontSize: 10 }} tickLine={{ stroke: '#333333' }} axisLine={{ stroke: '#333333' }} />
              <Tooltip contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #2ECC71', borderRadius: '8px' }} labelStyle={{ color: '#666666' }} />
              <Line type="monotone" dataKey="value" stroke="#B0B0B0" strokeWidth={2} dot animationDuration={300} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {!historyData.length && (
        <div className="absolute bottom-2 right-2">
          <div className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">Using sample data</div>
        </div>
      )}
    </div>
  );
};

export default HoldersGraphCard;
