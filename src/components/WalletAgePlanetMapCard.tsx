import { useMemo, useState } from 'react';
import { Pencil, Copy } from 'lucide-react';
import EditModal from './EditModal';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import useRealTimeData from '../hooks/useRealTimeData';

interface WalletAgePlanetMapCardProps {
  isExpanded?: boolean;
  isLayoutMode?: boolean;
  isExtension?: boolean; // Add this prop
}

const WalletAgePlanetMapCard = ({ 
  isExpanded = false, 
  isLayoutMode = false,
  isExtension = false 
}: WalletAgePlanetMapCardProps) => {
  const { toast } = useToast();
  const { data: realTimeData, isLoading } = useRealTimeData();
  const [isPresetOpen, setIsPresetOpen] = useState(false);
  const [isPresetSaved, setIsPresetSaved] = useState(false);
  const [newWalletMaxDays, setNewWalletMaxDays] = useState('30');
  const [oldWalletMinDays, setOldWalletMinDays] = useState('180');
  
  // Calculate wallet age in days
  const calculateWalletAge = (fundedAt: string) => {
    const fundedDate = new Date(fundedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - fundedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Filter wallets based on user-defined thresholds
  const filteredWallets = useMemo(() => {
    if (!realTimeData?.walletAge?.holders) {
      return { old: [], average: [], new: [] };
    }

    const newMaxDays = parseInt(newWalletMaxDays);
    const oldMinDays = parseInt(oldWalletMinDays);

    return realTimeData.walletAge.holders.reduce((acc, holder) => {
      const ageInDays = calculateWalletAge(holder.fundedAt);
      
      if (ageInDays <= newMaxDays) {
        acc.new.push({
          address: holder.walletAddress,
          age: `${ageInDays} days`,
          fundedAt: holder.fundedAt
        });
      } else if (ageInDays >= oldMinDays) {
        acc.old.push({
          address: holder.walletAddress,
          age: `${ageInDays} days`,
          fundedAt: holder.fundedAt
        });
      } else {
        acc.average.push({
          address: holder.walletAddress,
          age: `${ageInDays} days`,
          fundedAt: holder.fundedAt
        });
      }
      
      return acc;
    }, { old: [] as any[], average: [] as any[], new: [] as any[] });
  }, [realTimeData, newWalletMaxDays, oldWalletMinDays]);

  // Always use filtered counts for consistency
  const walletData = useMemo(() => {
    return {
      old: { 
        count: filteredWallets.old.length, 
        color: '#C97A40', 
        label: 'Old Wallets' 
      },
      average: { 
        count: filteredWallets.average.length, 
        color: '#2E86C1', 
        label: 'Average Wallets' 
      },
      new: { 
        count: filteredWallets.new.length, 
        color: '#F2A7C6', 
        label: 'New Wallets' 
      },
    };
  }, [filteredWallets]);

  // Get backend distribution for reference (optional)
  const backendDistribution = useMemo(() => {
    const dist = realTimeData?.walletAge?.distribution;
    return dist ? {
      old: dist.old ?? 0,
      average: dist.adult ?? 0,
      new: dist.baby ?? 0
    } : null;
  }, [realTimeData]);

  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address copied!",
      description: "Wallet address copied to clipboard",
    });
  };

  return (
    <div className={`border border-[hsl(var(--dashboard-border))] rounded-2xl ${
      isExtension ? 'p-1' : 'p-5'
    } h-full flex flex-col transition-all duration-300 hover:scale-[1.01] relative`}>

      {/* Preset Button & Timeframe Display */}
      {!isLayoutMode && (
        <div className="absolute top-5 right-5 z-10 flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPresetOpen(true);
            }}
            className={`transition-colors ${isPresetSaved ? 'text-[#8A2BE2] hover:text-[#8A2BE2]/80' : 'text-[#AAAAAA] hover:text-white'}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          {/* <div className="px-3 py-1.5 rounded-full bg-[#1C1C1C] text-white text-xs font-medium">
            ∞
          </div> */}
        </div>
      )}

      <EditModal
        isOpen={isPresetOpen}
        onClose={() => setIsPresetOpen(false)}
        title="Wallet Age Definitions"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="new-wallet-max" className="text-sm text-muted-foreground">
              New wallet (less than X days old)
            </Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                id="new-wallet-max"
                type="number"
                value={newWalletMaxDays}
                onChange={(e) => setNewWalletMaxDays(e.target.value)}
                className="bg-[#1A1F2C] border-[#1E1E1E]"
                min="1"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">days</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Wallets created within the last {newWalletMaxDays} days
            </p>
          </div>
          
          <div>
            <Label htmlFor="old-wallet-min" className="text-sm text-muted-foreground">
              Old wallet (more than X days old)
            </Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                id="old-wallet-min"
                type="number"
                value={oldWalletMinDays}
                onChange={(e) => setOldWalletMinDays(e.target.value)}
                className="bg-[#1A1F2C] border-[#1E1E1E]"
                min="1"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">days</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Wallets created more than {oldWalletMinDays} days ago
            </p>
          </div>

          <div className="p-3 bg-[#1A1F2C] rounded-lg border border-[#1E1E1E]">
            <Label className="text-sm text-muted-foreground">Average wallet</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Automatically defined as wallets between {newWalletMaxDays} and {oldWalletMinDays} days old
            </p>
          </div>

          <div className="p-3 bg-[#1A1F2C] rounded-lg border border-[#1E1E1E]">
            <Label className="text-sm text-muted-foreground">Current Distribution</Label>
            <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
              <div className="text-center">
                <div style={{ color: '#F2A7C6' }} className="font-semibold">{filteredWallets.new.length}</div>
                <div className="text-muted-foreground">New</div>
                <div className="text-muted-foreground text-[10px]">≤ {newWalletMaxDays}d</div>
              </div>
              <div className="text-center">
                <div style={{ color: '#2E86C1' }} className="font-semibold">{filteredWallets.average.length}</div>
                <div className="text-muted-foreground">Average</div>
                <div className="text-muted-foreground text-[10px]">{newWalletMaxDays}-{oldWalletMinDays}d</div>
              </div>
              <div className="text-center">
                <div style={{ color: '#C97A40' }} className="font-semibold">{filteredWallets.old.length}</div>
                <div className="text-muted-foreground">Old</div>
                <div className="text-muted-foreground text-[10px]">≥ {oldWalletMinDays}d</div>
              </div>
            </div>
            {backendDistribution && (
              <div className="mt-2 pt-2 border-t border-[#1E1E1E]">
                <Label className="text-sm text-muted-foreground">Backend Default</Label>
                <div className="grid grid-cols-3 gap-2 mt-1 text-xs">
                  <div className="text-center">
                    <div style={{ color: '#F2A7C6' }} className="font-semibold">{backendDistribution.new}</div>
                    <div className="text-muted-foreground">New</div>
                  </div>
                  <div className="text-center">
                    <div style={{ color: '#2E86C1' }} className="font-semibold">{backendDistribution.average}</div>
                    <div className="text-muted-foreground">Average</div>
                  </div>
                  <div className="text-center">
                    <div style={{ color: '#C97A40' }} className="font-semibold">{backendDistribution.old}</div>
                    <div className="text-muted-foreground">Old</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button className="w-full" onClick={() => { 
            setIsPresetSaved(true); 
            setIsPresetOpen(false); 
          }}>
            Save Changes
          </Button>
        </div>
      </EditModal>

      {/* Title - Updated positioning for extension view */}
      <div className={`${
        isExtension 
          ? 'mb-1 pl-2 pt-1.5' // Added padding-left and padding-top for extension
          : 'mb-4'
      }`}>
        <h3 className={`text-foreground ${
          isExtension 
            ? 'text-xs pl-1' // Made text smaller and added extra left padding for extension
            : 'text-lg'
        } font-semibold`}>
          {isExtension ? 'WAD' : 'Wallet Age Distribution'}
        </h3>
        {!isExtension && (
          <p className="text-muted-foreground text-xs mt-1">
            {isExpanded ? 'Based on wallet creation date • Detailed planetary visualization with orbit animations' : 'Based on wallet creation date'}
            {isPresetSaved && (
              <span className="text-[#8A2BE2] ml-1">• Custom thresholds applied</span>
            )}
          </p>
        )}
      </div>

      {/* Planets Container */}
      <div className={`flex-1 flex ${
        isExpanded ? 'flex-col gap-4 overflow-hidden' : 'items-center justify-between'
      }`}>
        <div className={`flex items-center ${
          isExpanded ? 'justify-start pl-8 flex-shrink-0' : 'justify-between w-full'
        } ${isExtension ? 'gap-1 px-1' : 'gap-4'}`}>
          {/* Jupiter - Old Wallets */}
          <div className={`flex flex-col items-center gap-1 ${!isExtension && 'animate-float'}`} style={{ animationDelay: '0s' }}>
            <div className={`relative ${
              isExtension 
                ? 'w-10 h-10' 
                : isExpanded 
                  ? 'w-40 h-40 lg:w-48 lg:h-48' 
                  : 'w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32'
            }`}>
              {/* Asteroid Belt - Adjusted for extension */}
              <svg className="absolute inset-0 w-full h-full animate-spin-slow" style={{ animationDuration: '20s' }}>
                <ellipse
                  cx="50%"
                  cy="50%"
                  rx={isExtension ? "35%" : "45%"}  // Reduced by 10% for extension
                  ry={isExtension ? "20%" : "25%"}  // Reduced by 10% for extension
                  fill="none"
                  stroke="#444444"
                  strokeWidth="1"
                  strokeDasharray="2,4"
                  opacity="0.6"
                />
                {/* Asteroid dots - Adjusted positions for extension */}
                {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                  const radians = (angle * Math.PI) / 180;
                  const rx = isExtension ? 0.4 : 0.45;  // Reduced by 10% for extension
                  const ry = isExtension ? 0.22 : 0.25;  // Reduced by 10% for extension
                  const x = 50 + rx * 100 * Math.cos(radians);
                  const y = 50 + ry * 100 * Math.sin(radians);
                  return (
                    <circle
                      key={i}
                      cx={`${x}%`}
                      cy={`${y}%`}
                      r={isExtension ? "1" : "1.5"}  // Reduced dot size for extension
                      fill="#666666"
                      opacity="0.8"
                    />
                  );
                })}
              </svg>
              
              {/* Jupiter Planet - Adjusted bands for extension */}
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
                <ellipse 
                  cx="50" 
                  cy="42" 
                  rx={isExtension ? "34" : "38"}  // Reduced by 10% for extension
                  ry={isExtension ? "2.7" : "3"}  // Reduced by 10% for extension
                  fill="#B86F38" 
                  opacity="0.4" 
                />
                <ellipse 
                  cx="50" 
                  cy="52" 
                  rx={isExtension ? "33" : "37"}  // Reduced by 10% for extension
                  ry={isExtension ? "2.2" : "2.5"}  // Reduced by 10% for extension
                  fill="#A66030" 
                  opacity="0.3" 
                />
                <ellipse 
                  cx="50" 
                  cy="60" 
                  rx={isExtension ? "31" : "35"}  // Reduced by 10% for extension
                  ry={isExtension ? "1.8" : "2"}  // Reduced by 10% for extension
                  fill="#8B5A2B" 
                  opacity="0.25" 
                />
              </svg>
            </div>
            <div className="text-center">
              <div className={`${isExtension ? 'text-base' : 'text-2xl'} font-bold`} style={{ color: walletData.old.color }}>
                {walletData.old.count}
              </div>
              {!isExtension && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {walletData.old.label}
                </div>
              )}
            </div>
          </div>

          {/* Earth - Average Wallets */}
          <div className={`flex flex-col items-center gap-1 ${!isExtension && 'animate-float'}`} style={{ animationDelay: '0.5s' }}>
            <div className={`${
              isExtension 
                ? 'w-9 h-9' 
                : isExpanded 
                  ? 'w-32 h-32 lg:w-40 lg:h-40' 
                  : 'w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28'
            }`}>
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
                {/* Clouds - Adjusted for extension */}
                <ellipse 
                  cx="40" 
                  cy="50" 
                  rx={isExtension ? "7" : "8"}  // Reduced by 10% for extension
                  ry={isExtension ? "3.6" : "4"}  // Reduced by 10% for extension
                  fill="white" 
                  opacity="0.3" 
                />
                <ellipse 
                  cx="65" 
                  cy="55" 
                  rx={isExtension ? "5.4" : "6"}  // Reduced by 10% for extension
                  ry={isExtension ? "2.7" : "3"}  // Reduced by 10% for extension
                  fill="white" 
                  opacity="0.25" 
                />
                {/* Shine */}
                <circle 
                  cx="35" 
                  cy="35" 
                  r={isExtension ? "7" : "8"}  // Reduced by 10% for extension
                  fill="white" 
                  opacity="0.2" 
                />
              </svg>
            </div>
            <div className="text-center">
              <div className={`${isExtension ? 'text-base' : 'text-2xl'} font-bold`} style={{ color: walletData.average.color }}>
                {walletData.average.count}
              </div>
              {!isExtension && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {walletData.average.label}
                </div>
              )}
            </div>
          </div>

          {/* Pluto - New Wallets */}
          <div className={`flex flex-col items-center gap-1 ${!isExtension && 'animate-float'}`} style={{ animationDelay: '1s' }}>
            <div className={`${
              isExtension 
                ? 'w-8 h-8' 
                : isExpanded 
                  ? 'w-28 h-28 lg:w-36 lg:h-36' 
                  : 'w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24'
            }`}>
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
              <div className={`${isExtension ? 'text-base' : 'text-2xl'} font-bold`} style={{ color: walletData.new.color }}>
                {walletData.new.count}
              </div>
              {!isExtension && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {walletData.new.label}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Wallet Address Lists - Only shown when expanded */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden min-h-0">
            {/* Old Wallets List */}
            <div className="space-y-2 flex flex-col min-h-0">
              <h4 className="text-sm font-semibold text-foreground flex-shrink-0" style={{ color: walletData.old.color }}>
                Old Wallets ({filteredWallets.old.length})
              </h4>
              <div className="space-y-2 overflow-y-auto pr-2 flex-1">
                {filteredWallets.old.map((wallet, index) => (
                  <div
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(wallet.address);
                    }}
                    className="flex items-center justify-between p-3 bg-[#1A1F2C] border border-[#1E1E1E] rounded-lg hover:border-[#8A2BE2] transition-all cursor-pointer group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground font-mono truncate">
                        {wallet.address}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{wallet.age}</p>
                    </div>
                    <Copy className="h-3 w-3 text-muted-foreground group-hover:text-[#8A2BE2] transition-colors ml-2 flex-shrink-0" />
                  </div>
                ))}
                {filteredWallets.old.length === 0 && (
                  <div className="p-3 bg-[#1A1F2C] border border-[#1E1E1E] rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">No old wallets found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Average Wallets List */}
            <div className="space-y-2 flex flex-col min-h-0">
              <h4 className="text-sm font-semibold text-foreground flex-shrink-0" style={{ color: walletData.average.color }}>
                Average Wallets ({filteredWallets.average.length})
              </h4>
              <div className="space-y-2 overflow-y-auto pr-2 flex-1">
                {filteredWallets.average.map((wallet, index) => (
                  <div
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(wallet.address);
                    }}
                    className="flex items-center justify-between p-3 bg-[#1A1F2C] border border-[#1E1E1E] rounded-lg hover:border-[#8A2BE2] transition-all cursor-pointer group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground font-mono truncate">
                        {wallet.address}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{wallet.age}</p>
                    </div>
                    <Copy className="h-3 w-3 text-muted-foreground group-hover:text-[#8A2BE2] transition-colors ml-2 flex-shrink-0" />
                  </div>
                ))}
                {filteredWallets.average.length === 0 && (
                  <div className="p-3 bg-[#1A1F2C] border border-[#1E1E1E] rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">No average wallets found</p>
                  </div>
                )}
              </div>
            </div>

            {/* New Wallets List */}
            <div className="space-y-2 flex flex-col min-h-0">
              <h4 className="text-sm font-semibold text-foreground flex-shrink-0" style={{ color: walletData.new.color }}>
                New Wallets ({filteredWallets.new.length})
              </h4>
              <div className="space-y-2 overflow-y-auto pr-2 flex-1">
                {filteredWallets.new.map((wallet, index) => (
                  <div
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(wallet.address);
                    }}
                    className="flex items-center justify-between p-3 bg-[#1A1F2C] border border-[#1E1E1E] rounded-lg hover:border-[#8A2BE2] transition-all cursor-pointer group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground font-mono truncate">
                        {wallet.address}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{wallet.age}</p>
                    </div>
                    <Copy className="h-3 w-3 text-muted-foreground group-hover:text-[#8A2BE2] transition-colors ml-2 flex-shrink-0" />
                  </div>
                ))}
                {filteredWallets.new.length === 0 && (
                  <div className="p-3 bg-[#1A1F2C] border border-[#1E1E1E] rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">No new wallets found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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