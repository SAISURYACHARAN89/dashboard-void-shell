import { useMemo } from 'react';

const WalletAgePlanetMapCard = () => {
  const walletData = useMemo(() => ({
    old: { count: 112, color: '#C97A40', label: 'Old Wallets' },
    average: { count: 256, color: '#2E86C1', label: 'Average Wallets' },
    new: { count: 89, color: '#F2A7C6', label: 'New Wallets' }
  }), []);

  return (
    <div 
      className="border border-[hsl(var(--dashboard-border))] rounded-2xl p-5 h-full flex flex-col transition-all duration-300 hover:scale-[1.01]"
      style={{
        background: 'linear-gradient(180deg, #0D0D0D 0%, #121212 100%)'
      }}
    >
      {/* Title */}
      <div className="mb-4">
        <h3 className="text-foreground text-lg font-semibold">Wallet Age Distribution</h3>
        <p className="text-muted-foreground text-xs mt-1">Based on wallet creation date</p>
      </div>

      {/* Planets Container */}
      <div className="flex-1 flex items-center justify-around gap-4 px-2 sm:px-4">
        {/* Jupiter - Old Wallets */}
        <div className="flex flex-col items-center gap-3 animate-float" style={{ animationDelay: '0s' }}>
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32">
            {/* Asteroid Belt */}
            <svg className="absolute inset-0 w-full h-full animate-spin-slow" style={{ animationDuration: '20s' }}>
              <ellipse
                cx="50%"
                cy="50%"
                rx="45%"
                ry="25%"
                fill="none"
                stroke="#444444"
                strokeWidth="1"
                strokeDasharray="2,4"
                opacity="0.6"
              />
              {/* Asteroid dots */}
              {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                const radians = (angle * Math.PI) / 180;
                const rx = 0.45;
                const ry = 0.25;
                const x = 50 + rx * 100 * Math.cos(radians);
                const y = 50 + ry * 100 * Math.sin(radians);
                return (
                  <circle
                    key={i}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="1.5"
                    fill="#666666"
                    opacity="0.8"
                  />
                );
              })}
            </svg>
            
            {/* Jupiter Planet */}
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <defs>
                <radialGradient id="jupiterGradient" cx="35%" cy="35%">
                  <stop offset="0%" stopColor="#E8A668" />
                  <stop offset="40%" stopColor="#C97A40" />
                  <stop offset="100%" stopColor="#8B5A2B" />
                </radialGradient>
              </defs>
              <circle cx="50" cy="50" r="40" fill="url(#jupiterGradient)" />
              {/* Bands */}
              <ellipse cx="50" cy="42" rx="38" ry="3" fill="#B86F38" opacity="0.4" />
              <ellipse cx="50" cy="52" rx="37" ry="2.5" fill="#A66030" opacity="0.3" />
              <ellipse cx="50" cy="60" rx="35" ry="2" fill="#8B5A2B" opacity="0.25" />
            </svg>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: walletData.old.color }}>
              {walletData.old.count}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{walletData.old.label}</div>
          </div>
        </div>

        {/* Earth - Average Wallets */}
        <div className="flex flex-col items-center gap-3 animate-float" style={{ animationDelay: '0.5s' }}>
          <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <defs>
                <radialGradient id="earthGradient" cx="35%" cy="35%">
                  <stop offset="0%" stopColor="#5DADE2" />
                  <stop offset="50%" stopColor="#2E86C1" />
                  <stop offset="100%" stopColor="#1A5276" />
                </radialGradient>
              </defs>
              <circle cx="50" cy="50" r="40" fill="url(#earthGradient)" />
              {/* Land masses */}
              <path
                d="M 30 40 Q 35 35 40 38 L 45 42 Q 48 40 50 43 L 52 45 Z"
                fill="#27AE60"
                opacity="0.7"
              />
              <path
                d="M 55 35 Q 60 32 65 35 L 68 38 Q 70 36 72 39 Z"
                fill="#229954"
                opacity="0.7"
              />
              <path
                d="M 35 60 Q 40 58 45 60 L 50 63 Q 52 61 55 64 Z"
                fill="#1E8449"
                opacity="0.7"
              />
              {/* Clouds */}
              <ellipse cx="40" cy="50" rx="8" ry="4" fill="white" opacity="0.3" />
              <ellipse cx="65" cy="55" rx="6" ry="3" fill="white" opacity="0.25" />
              {/* Shine */}
              <circle cx="35" cy="35" r="8" fill="white" opacity="0.2" />
            </svg>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: walletData.average.color }}>
              {walletData.average.count}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{walletData.average.label}</div>
          </div>
        </div>

        {/* Pluto - New Wallets */}
        <div className="flex flex-col items-center gap-3 animate-float" style={{ animationDelay: '1s' }}>
          <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <defs>
                <radialGradient id="plutoGradient" cx="35%" cy="35%">
                  <stop offset="0%" stopColor="#F8C9DC" />
                  <stop offset="50%" stopColor="#F2A7C6" />
                  <stop offset="100%" stopColor="#D88BA8" />
                </radialGradient>
              </defs>
              <circle cx="50" cy="50" r="38" fill="url(#plutoGradient)" />
              {/* Craters */}
              <circle cx="40" cy="45" r="5" fill="#D88BA8" opacity="0.4" />
              <circle cx="60" cy="55" r="4" fill="#D88BA8" opacity="0.3" />
              <circle cx="52" cy="38" r="3" fill="#D88BA8" opacity="0.35" />
            </svg>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: walletData.new.color }}>
              {walletData.new.count}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{walletData.new.label}</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin 20s linear infinite;
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default WalletAgePlanetMapCard;
