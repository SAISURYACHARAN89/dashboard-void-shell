import { useState, useEffect } from 'react';
import { Copy, Check, Clock, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CoinInfoHeaderProps {
  tokenInfo?: {
    tokenAddress?: string;
    tokenName?: string;
    tokenTicker?: string;
    twitter?: string;
    tokenimage?: string;
    createdAt?: string;
  };
  onDataSourceChange?: (dataSource: 'ca' | 'community') => void;
  onSocialTypeChange?: (socialType: string) => void;
}

const CoinInfoHeader = ({
  tokenInfo,
  onDataSourceChange,
  onSocialTypeChange
}: CoinInfoHeaderProps) => {
  const coinName = tokenInfo?.tokenName || 'Unknown Coin';
  const contractAddress = tokenInfo?.tokenAddress || '0x0000...0000';
  const logoUrl = tokenInfo?.tokenimage || '/placeholder.svg';
  const createdAt = new Date(tokenInfo?.createdAt || Date.now());
  const socialLink = tokenInfo?.twitter || '';

  // --- UI State ---
  const [copied, setCopied] = useState(false);
  const [age, setAge] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ca' | 'community'>('community');
  const [selectedSocial, setSelectedSocial] = useState('X Community');

  // --- Social Options ---
  const socialOptions = ['X Community', 'Tweet', 'Account', 'nada'];

  // --- Auto-switch to CA when 'nada' is selected ---
  useEffect(() => {
    if (selectedSocial === 'nada' && selectedFilter === 'community') {
      setSelectedFilter('ca');
      onDataSourceChange?.('ca');
    }
  }, [selectedSocial, selectedFilter, onDataSourceChange]);

  // --- Age Calculation ---
  const calculateAge = () => {
    const now = new Date();
    const diff = now.getTime() - createdAt.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  };

  useEffect(() => {
    setAge(calculateAge());
    const interval = setInterval(() => setAge(calculateAge()), 60000);
    return () => clearInterval(interval);
  }, [createdAt]);

  // --- Copy Contract Address ---
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // --- Address Truncate ---
  const truncateAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  // --- Filter Handler ---
  const handleFilterChange = (filter: 'ca' | 'community') => {
    // Always allow switching to CA mode
    if (filter === 'ca') {
      setSelectedFilter('ca');
      onDataSourceChange?.('ca');
      return;
    }

    // Only allow community mode if not in 'nada' social type
    if (selectedSocial !== 'nada') {
      setSelectedFilter('community');
      onDataSourceChange?.('community');
    }
  };

  // Ensure CA mode is selected when social type is 'nada'
  useEffect(() => {
    if (selectedSocial === 'nada') {
      setSelectedFilter('ca');
      onDataSourceChange?.('ca');
    }
  }, [selectedSocial, onDataSourceChange]);

  return (
    <div className="w-full bg-gradient-to-r from-[hsl(0,0%,5%)] to-[hsl(0,0%,7%)] border border-[hsl(var(--dashboard-border))] rounded-xl px-6 py-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

        {/* Left Block - Identity */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[hsl(0,0%,11%)] border border-[hsl(var(--border))] flex items-center justify-center overflow-hidden flex-shrink-0">
            <img
              src={logoUrl}
              alt={coinName}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {coinName}
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-mono">
                {truncateAddress(contractAddress)}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-accent"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-accent-neon-green" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{copied ? 'Copied!' : 'Copy Contract Address'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Right Block - Meta Info */}
        <div className="flex items-center gap-4 sm:gap-6">

          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className={`text-xs font-medium ${
                selectedFilter === 'ca'
                  ? 'border-white text-white'
                  : 'border-[hsl(var(--border))] text-muted-foreground'
              }`}
              onClick={() => handleFilterChange('ca')}
            >
              Posts with CA
            </Button>
            {selectedSocial !== 'nada' && (
              <Button
                variant="outline"
                size="sm"
                className={`text-xs font-medium ${
                  selectedFilter === 'community'
                    ? 'border-white text-white'
                    : 'border-[hsl(var(--border))] text-muted-foreground'
                }`}
                onClick={() => handleFilterChange('community')}
              >
                {selectedSocial === 'X Community'
                  ? 'Community analysis'
                  : selectedSocial === 'Tweet'
                  ? 'Tweet analysis'
                  : selectedSocial === 'Account'
                  ? 'Account analysis'
                  : 'Posts inside community'}
              </Button>
            )}
          </div>

          {/* Age */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{age}</span>
          </div>

          {/* Social Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-sm font-medium text-foreground hover:text-accent-foreground px-3 py-1 rounded border border-[hsl(var(--border))] hover:border-[hsl(var(--ring))] transition-colors flex items-center gap-2">
                {selectedSocial}
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[hsl(var(--popover))] border-[hsl(var(--border))]">
              {socialOptions.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => {
                    setSelectedSocial(option);
                    onSocialTypeChange?.(option);
                  }}
                  className="cursor-pointer"
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default CoinInfoHeader;
