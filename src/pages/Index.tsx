import TradingViewCard from '@/components/TradingViewCard';
import HoldersGraphCard from '@/components/HoldersGraphCard';
import BuysVsSellsCard from '@/components/BuysVsSellsCard';
import WalletAgePlanetMapCard from '@/components/WalletAgePlanetMapCard';
import HorizontalMetricsBar from '@/components/HorizontalMetricsBar';
import MetricCard from '@/components/MetricCard';
import BarGraphSection from '@/components/BarGraphSection';
import ScatterPlotCard from '@/components/ScatterPlotCard';

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div 
        className="w-full max-w-[1400px] bg-[hsl(var(--dashboard-container))] border border-[hsl(var(--dashboard-border))] rounded-2xl p-8"
        style={{ minHeight: '600px' }}
      >
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            {/* TradingView Chart */}
            <div className="h-[600px] lg:h-[484px]">
              <TradingViewCard />
            </div>
            
            {/* Horizontal Metrics Bar */}
            <div className="h-[60px]">
              <HorizontalMetricsBar />
            </div>

            {/* Views & Likes Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-[216px]">
              <MetricCard 
                type="views"
                value={240}
                percentChange={18}
                chartColor="#00FFFF"
              />
              <MetricCard 
                type="likes"
                value={65}
                percentChange={10}
                chartColor="#FF00FF"
              />
            </div>
          </div>
          
          {/* Right side - Stacked cards */}
          <div className="flex flex-col gap-6">
            {/* Holders Graph - Slightly larger compact card */}
            <div className="h-40">
              <HoldersGraphCard />
            </div>
            
            {/* Buys vs Sells Card */}
            <div className="h-[300px]">
              <BuysVsSellsCard />
            </div>

            {/* Wallet Age Planet Map */}
            <div className="h-[300px]">
              <WalletAgePlanetMapCard />
            </div>
          </div>
        </div>

        {/* Bottom Row - Bar Graph and Scatter Plot */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Bar Graph Section */}
          <div className="h-[320px]">
            <BarGraphSection />
          </div>

          {/* Scatter Plot */}
          <div className="h-[320px]">
            <ScatterPlotCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
