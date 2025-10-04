import { useState, useEffect } from 'react';
import Index from '../pages/Index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw, ExternalLink, Copy, CheckCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PairAddressInput = () => {
  const [pairAddress, setPairAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [configData, setConfigData] = useState<{ 
    pairAddress: string; 
    communityId: string;
    twitterUrl?: string;
    autoDiscovered?: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const API_BASE = "https://kluxback.onrender.com";

  // Check if we're already configured on component mount
  useEffect(() => {
    checkExistingConfig();
  }, []);

  const checkExistingConfig = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/config`);
      if (response.ok) {
        const config = await response.json();
        if (config.pairAddress) {
          setIsConfigured(true);
          setConfigData(config);
        }
      }
    } catch (error) {
      console.log('No existing configuration found');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  const validatePairAddress = (address: string): boolean => {
    // Solana addresses are base58 encoded, typically 32-44 characters
    const trimmed = address.trim();
    return trimmed.length >= 32 && trimmed.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(trimmed);
  };

  const handleAnalyze = async () => {
    if (!validatePairAddress(pairAddress)) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Solana pair address (32-44 characters, base58 format)",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1️⃣ Configure dashboard - NO communityId needed, backend will auto-discover
      const configResponse = await fetch(`${API_BASE}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairAddress: pairAddress.trim() })
      });

      if (!configResponse.ok) {
        const errorData = await configResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${configResponse.status}: ${configResponse.statusText}`);
      }

      const configResult = await configResponse.json();
      
      if (configResult.status === 'error') {
        throw new Error(configResult.message || 'Configuration failed');
      }

      console.log("✅ Configuration successful:", configResult);

      // 2️⃣ Wait a moment for backend to initialize, then check status
      await new Promise(resolve => setTimeout(resolve, 1000));

      let retries = 15; // Increased retries
      let dashboardReady = false;

      while (retries-- > 0) {
        try {
          const statusRes = await fetch(`${API_BASE}/api/status`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            console.log("Status check:", statusData);
            
            if (statusData.status === 'active') {
              dashboardReady = true;
              break;
            }
          }
        } catch (error) {
          console.log('Status check failed, retrying...');
        }

        await new Promise(res => setTimeout(res, 1000)); // wait 1s before retry
      }

      if (!dashboardReady) {
        throw new Error("Dashboard taking too long to initialize. Please try again.");
      }

      // 3️⃣ Verify data is flowing by checking the data endpoint
      const dataResponse = await fetch(`${API_BASE}/api/data`);
      if (!dataResponse.ok) throw new Error("Failed to fetch initial data");

      const data = await dataResponse.json();
      console.log("Initial data:", data);

      setIsConfigured(true);
      setConfigData({
        pairAddress: pairAddress.trim(),
        communityId: configResult.config.communityId,
        twitterUrl: configResult.config.twitterUrl,
        autoDiscovered: configResult.config.autoDiscovered
      });

      toast({ 
        title: "Dashboard Ready!", 
        description: configResult.config.autoDiscovered 
          ? `Auto-discovered community for ${configResult.config.twitterUrl || 'this token'}`
          : "Token analysis started successfully"
      });

    } catch (err) {
      console.error("Error configuring dashboard:", err);
      toast({
        title: "Configuration Failed",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIsConfigured(false);
    setConfigData(null);
    setPairAddress('');
    toast({
      title: "Reset",
      description: "Enter a new pair address to analyze",
    });
  };

  // ✅ If configured, show the main dashboard with reset option
  if (isConfigured && configData) {
    return (
      <div>
        <div className="fixed top-4 right-4 z-50">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Analyze New Token
          </Button>
        </div>
        <Index />
      </div>
    );
  }

  // ✅ Show input form
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Token Analysis
          </CardTitle>
          <CardDescription className="text-base pt-2">
            Enter a Solana token pair address to analyze real-time market data and social metrics
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="pair-address" className="text-sm font-medium">
                Pair Address
              </label>
              <Badge variant="secondary" className="text-xs">
                Required
              </Badge>
            </div>
            
            <div className="relative">
              <Input
                id="pair-address"
                type="text"
                placeholder="Enter Solana pair address..."
                value={pairAddress}
                onChange={(e) => setPairAddress(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                disabled={isLoading}
                className="pr-20 font-mono text-sm"
              />
              
              {pairAddress && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={() => copyToClipboard(pairAddress)}
                >
                  {copied ? (
                    <CheckCheck className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
            
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              <p>• Solana addresses are 32-44 characters</p>
              <p>• Community ID will be auto-discovered from Twitter URL</p>
              <p className="font-mono bg-muted p-2 rounded mt-1 break-all">
                Example: 7Zb1bR... or 67NMXH4SeEM2ZH7Jggko5V4iJpsRWe8D4oKJtAFgxgjH
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleAnalyze}
              disabled={isLoading || !validatePairAddress(pairAddress)}
              className="w-full h-11 text-base font-semibold"
              size="lg"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Configuring Dashboard...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Analyze Token
                </>
              )}
            </Button>
            
            
          </div>

          {/* Features list */}
          
        </CardContent>
      </Card>
    </div>
  );
};

export default PairAddressInput;