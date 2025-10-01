import { useState, useEffect } from 'react';
import { Copy, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CoinInfoHeaderProps {
  coinName?: string;
  contractAddress?: string;
  logoUrl?: string;
  createdAt?: Date;
  socialType?: string;
  socialLink?: string;
}

const CoinInfoHeader = ({
  coinName = "PEPE",
  contractAddress = "0xA4F8C3C9E5D6B7A8F9E0D1C2B3A4F5E6D7C8B9A0",
  logoUrl = "/placeholder.svg",
  createdAt = new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
  socialType = "X Community",
  socialLink = "https://x.com"
}: CoinInfoHeaderProps) => {
  const [copied, setCopied] = useState(false);
  const [age, setAge] = useState("");

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
    const interval = setInterval(() => {
      setAge(calculateAge());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [createdAt]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="w-full bg-gradient-to-r from-[hsl(0,0%,5%)] to-[hsl(0,0%,7%)] border-2 border-[hsl(180,70%,50%)]/30 rounded-xl px-6 py-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left Block - Identity */}
        <div className="flex items-center gap-4">
          {/* Logo Box */}
          <div className="w-12 h-12 rounded-lg bg-[hsl(0,0%,11%)] border border-[hsl(var(--border))] flex items-center justify-center overflow-hidden flex-shrink-0">
            <img 
              src={logoUrl} 
              alt={coinName}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Coin Info */}
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
                  <p>{copied ? "Copied!" : "Copy Contract Address"}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Right Block - Meta Info */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Age */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{age}</span>
          </div>

          {/* Social Type */}
          {socialLink ? (
            <a
              href={socialLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-foreground hover:text-accent-foreground px-3 py-1 rounded border border-[hsl(var(--border))] hover:border-[hsl(var(--ring))] transition-colors"
            >
              {socialType}
            </a>
          ) : (
            <span className="text-sm font-medium text-foreground px-3 py-1 rounded border border-[hsl(var(--border))]">
              {socialType}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoinInfoHeader;
