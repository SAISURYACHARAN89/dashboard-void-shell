import { useEffect, useState } from 'react';
import { Bell, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';

interface Alert {
  id: string;
  coinName: string;
  metricName: string;
  threshold: number;
  currentValue: number;
  timestamp: string;
}

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Fetch alerts from local storage or API
    const savedAlerts = localStorage.getItem('dashboard-alerts');
    if (savedAlerts) {
      setAlerts(JSON.parse(savedAlerts));
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => router.back()} 
          className="p-2 hover:bg-[rgba(255,255,255,0.04)] rounded-md"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">Alert Notifications</h1>
      </div>

      {/* Alerts List */}
      <div className="space-y-2 max-w-2xl mx-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Bell className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p>No alerts yet</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-[rgba(255,255,255,0.02)] p-4 rounded-md border border-[rgba(255,255,255,0.04)]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{alert.coinName}</h3>
                  <p className="text-sm text-gray-400">
                    {alert.metricName} reached {alert.threshold.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-500">
                    {alert.currentValue.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
