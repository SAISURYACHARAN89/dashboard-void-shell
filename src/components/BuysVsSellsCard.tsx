import { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Bell, RefreshCw } from 'lucide-react';
import EditModal from './EditModal';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';

interface BuysVsSellsCardProps {
  isExpanded?: boolean;
  isLayoutMode?: boolean;
  data?: {
    current: {
      buyVolume: number;
      sellVolume: number;
      netVolume: number;
      buyCount: number;
      sellCount: number;
      lastUpdated: string;
    };
    history: Array<{
      timestamp: string;
      time: string;
      buyVolume: number;
      sellVolume: number;
      netVolume: number;
      buyCount: number;
      sellCount: number;
    }>;
  };
}

const BuysVsSellsCard = ({ isExpanded = false, isLayoutMode = false, data }: BuysVsSellsCardProps) => {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [savedAlerts, setSavedAlerts] = useState<number[]>([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState<number[]>([]);
  const [newAlertValue, setNewAlertValue] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [triggeredAlertMessage, setTriggeredAlertMessage] = useState('');

  // Extract backend data
  const currentData = data?.current || {
    buyVolume: 0,
    sellVolume: 0,
    netVolume: 0,
    buyCount: 0,
    sellCount: 0,
    lastUpdated: ''
  };
  const historyData = data?.history || [];

  const { buyVolume, sellVolume, netVolume, buyCount, sellCount } = currentData;
  const isNetPositive = netVolume >= 0;

  // Format numbers
  const formatVolume = (volume: number) => {
    if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
    if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)}K`;
    return volume.toFixed(0);
  };

  const formatNetVolume = (volume: number) => {
    const prefix = volume >= 0 ? '+' : '-';
    const abs = Math.abs(volume);
    if (abs >= 1_000_000) return `${prefix}${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${prefix}${(abs / 1_000).toFixed(1)}K`;
    return `${prefix}${abs.toFixed(0)}`;
  };

  // Trigger alerts
  useEffect(() => {
    savedAlerts.forEach(alertValue => {
      if (Math.abs(netVolume) >= alertValue && !triggeredAlerts.includes(alertValue)) {
        setTriggeredAlertMessage(`🚨 Net Volume reached ${alertValue}k!`);
        const audio = new Audio('/ting.mp3'); // put ting.mp3 in public folder
        audio.play();
        setTriggeredAlerts(prev => [...prev, alertValue]);
        setTimeout(() => setTriggeredAlertMessage(''), 5000);
      }
    });
  }, [netVolume, savedAlerts, triggeredAlerts]);

  // Process chart data
  const chartData = useMemo(() => {
    if (!historyData.length) {
      const mock = [];
      const labels = ['12h', '18h', '24h', '6h', '12h', 'Now'];
      for (const time of labels) {
        mock.push({
          time,
          buys: Math.random() * 60 + 40,
          sells: -1 * (Math.random() * 40 + 30),
          net: Math.random() * 20 - 10,
        });
      }
      return mock;
    }

    const filtered = historyData.slice(-20);
    return filtered.map((item) => ({
      time: item.time,
      buys: item.buyVolume / 100,
      sells: -item.sellVolume / 100,
      net: item.netVolume
    }));
  }, [historyData]);

  // Refresh handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div
      className="border border-[hsl(var(--dashboard-border))] rounded-2xl p-5 h-full transition-all duration-300 hover:scale-[1.01] relative flex flex-col"
      style={{ background: 'linear-gradient(180deg, #0D0D0D 0%, #121212 100%)' }}
    >
      {/* Triggered alert message */}
      {triggeredAlertMessage && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-4 py-2 rounded shadow-lg z-50">
          {triggeredAlertMessage}
        </div>
      )}

      {/* Alert + Refresh */}
      {!isLayoutMode && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setIsAlertOpen(true); }}
            className={`transition-colors ${savedAlerts.length > 0 ? 'text-[#8A2BE2]' : 'text-[#AAAAAA] hover:text-white'}`}
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
        title="Net Volume Alerts"
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
              <div className="flex flex-wrap gap-2">
                {savedAlerts.map((alertValue, index) => (
                  <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1F2C] border border-[#8A2BE2] rounded-lg text-sm">
                    <span className="text-foreground font-medium">{alertValue}k</span>
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
            <Label htmlFor="volume-alert" className="text-sm text-muted-foreground">
              Alert me when net volume reaches
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="volume-alert"
                type="number"
                step="0.1"
                placeholder="e.g., 10"
                value={newAlertValue}
                onChange={(e) => setNewAlertValue(e.target.value)}
                className="bg-[#1A1F2C] border-[#1E1E1E]"
              />
              <Button
                onClick={() => {
                  const value = parseFloat(newAlertValue);
                  if (value > 0 && !savedAlerts.includes(value)) {
                    setSavedAlerts([...savedAlerts, value].sort((a, b) => a - b));
                    setNewAlertValue('');
                  }
                }}
                disabled={!newAlertValue || parseFloat(newAlertValue) <= 0}
              >
                Add
              </Button>
            </div>
          </div>

          <Button className="w-full" onClick={() => setIsAlertOpen(false)}>Done</Button>
        </div>
      </EditModal>

      {/* Stats Row */}
      <div className="flex gap-6 w-full justify-around mb-5">
        <div className="rounded-lg p-4 flex-1" style={{ background: '#102B1A' }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-[#2ECC71]" />
            <span className="text-sm font-medium text-[#2ECC71]/70">Buys</span>
          </div>
          <div className="text-[#2ECC71] font-bold text-2xl">{formatVolume(buyVolume)}</div>
          <div className="text-muted-foreground text-xs mt-1">{buyCount} transactions</div>
        </div>

        <div className="rounded-lg p-4 flex-1" style={{ background: '#1A1A1A' }}>
          <div className="text-sm font-medium text-muted-foreground mb-2">Net</div>
          <div className={`font-bold text-3xl ${isNetPositive ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
            {formatNetVolume(netVolume)}
          </div>
        </div>

        <div className="rounded-lg p-4 flex-1" style={{ background: '#2B1010' }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-[#E74C3C]" />
            <span className="text-sm font-medium text-[#E74C3C]/70">Sells</span>
          </div>
          <div className="text-[#E74C3C] font-bold text-2xl">{formatVolume(Math.abs(sellVolume))}</div>
          <div className="text-muted-foreground text-xs mt-1">{sellCount} transactions</div>
        </div>
      </div>
    </div>
  );
};

export default BuysVsSellsCard;
