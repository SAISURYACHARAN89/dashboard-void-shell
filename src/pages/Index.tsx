import TradingViewCard from '@/components/TradingViewCard';
import HoldersGraphCard from '@/components/HoldersGraphCard';

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div 
        className="w-full max-w-[1400px] bg-[hsl(var(--dashboard-container))] border border-[hsl(var(--dashboard-border))] rounded-2xl p-8"
        style={{ minHeight: '600px' }}
      >
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* TradingView Chart - Left side, tall card */}
          <div className="lg:row-span-3 h-[600px] lg:h-full">
            <TradingViewCard />
          </div>
          
          {/* Right side - Stacked cards */}
          <div className="flex flex-col gap-6 h-[600px] lg:h-full">
            {/* Holders Graph - Slightly larger compact card */}
            <div className="h-40">
              <HoldersGraphCard />
            </div>
            
            {/* Placeholder for Buys vs Sells */}
            <div className="flex-1">
              {/* Buys vs Sells will go here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
