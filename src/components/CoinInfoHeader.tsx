import { useState, useEffect } from 'react';
import { Copy, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CoinInfoHeaderProps {
  tokenInfo?: {
    tokenAddress?: string;
    tokenName?: string;
    tokenTicker?: string;
    twitter?: string;
    tokenimage?: string;
    createdAt?: string;
  };
}

const CoinInfoHeader = ({ tokenInfo }: CoinInfoHeaderProps) => {
  const coinName = tokenInfo?.tokenName || "Unknown Coin";
  const contractAddress = tokenInfo?.tokenAddress || "0x0000...0000";
  const logoUrl = tokenInfo?.tokenimage || "/placeholder.svg"; // backend doesn’t send, so fallback
  const createdAt = new Date(tokenInfo?.createdAt || Date.now()); // backend doesn’t send, so just “now”
  const socialType = "Twitter";
  const socialLink = tokenInfo?.twitter || "";

  const [copied, setCopied] = useState(false);
  const [age, setAge] = useState("");

  useEffect(() => {
    const updateAge = () => {
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - createdAt.getTime()) / 1000);
      if (diffInSeconds < 60) {
        setAge(`${diffInSeconds} seconds ago`);
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        setAge(`${minutes} minute${minutes !== 1 ? 's' : ''} ago`);
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        setAge(`${hours} hour${hours !== 1 ? 's' : ''} ago`);
      } else {
        const days = Math.floor(diffInSeconds / 86400);
        setAge(`${days} day${days !== 1 ? 's' : ''} ago`);
      }
    }
    updateAge();
    const interval = setInterval(updateAge, 60000);
    return () => clearInterval(interval);
  }, [createdAt]);
  

 
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const truncateAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="w-full bg-gradient-to-r from-[hsl(0,0%,5%)] to-[hsl(0,0%,7%)] border border-[hsl(var(--dashboard-border))] rounded-xl px-6 py-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left Block */}
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
                  <p>{copied ? "Copied!" : "Copy Contract Address"}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Right Block */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{age}</span>
          </div>
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
