import { useState } from 'react';
import TradingViewCard from '@/components/TradingViewCard';
import HoldersGraphCard from '@/components/HoldersGraphCard';
import BuysVsSellsCard from '@/components/BuysVsSellsCard';
import WalletAgePlanetMapCard from '@/components/WalletAgePlanetMapCard';
import HorizontalMetricsBar from '@/components/HorizontalMetricsBar';
import MetricCard from '@/components/MetricCard';
import BarGraphSection from '@/components/BarGraphSection';
import ScatterPlotCard from '@/components/ScatterPlotCard';
import ExpandableCard from '@/components/ExpandableCard';

const Index = () => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };
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
            <ExpandableCard
              isExpanded={expandedCard === 'trading'}
              onToggle={() => toggleCard('trading')}
              expandedHeight="800px"
              className="h-[600px] lg:h-[484px] group"
            >
              <TradingViewCard isExpanded={expandedCard === 'trading'} />
            </ExpandableCard>
            
            {/* Horizontal Metrics Bar */}
            <ExpandableCard
              isExpanded={expandedCard === 'metrics'}
              onToggle={() => toggleCard('metrics')}
              expandedHeight="400px"
              className="h-[60px] group"
            >
              <HorizontalMetricsBar isExpanded={expandedCard === 'metrics'} />
            </ExpandableCard>

            {/* Views & Likes Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-[204px]">
              <ExpandableCard
                isExpanded={expandedCard === 'views'}
                onToggle={() => toggleCard('views')}
                expandedHeight="500px"
                className="group"
              >
                <MetricCard 
                  type="views"
                  value={240}
                  percentChange={18}
                  chartColor="#00FFFF"
                  isExpanded={expandedCard === 'views'}
                />
              </ExpandableCard>
              <ExpandableCard
                isExpanded={expandedCard === 'likes'}
                onToggle={() => toggleCard('likes')}
                expandedHeight="500px"
                className="group"
              >
                <MetricCard 
                  type="likes"
                  value={65}
                  percentChange={10}
                  chartColor="#FF00FF"
                  isExpanded={expandedCard === 'likes'}
                />
              </ExpandableCard>
            </div>
          </div>
          
          {/* Right side - Stacked cards */}
          <div className="flex flex-col gap-6">
            {/* Holders Graph - Slightly larger compact card */}
            <ExpandableCard
              isExpanded={expandedCard === 'holders'}
              onToggle={() => toggleCard('holders')}
              expandedHeight="600px"
              className="h-40 group"
            >
              <HoldersGraphCard isExpanded={expandedCard === 'holders'} />
            </ExpandableCard>
            
            {/* Buys vs Sells Card */}
            <ExpandableCard
              isExpanded={expandedCard === 'buys-sells'}
              onToggle={() => toggleCard('buys-sells')}
              expandedHeight="700px"
              className="h-[300px] group"
            >
              <BuysVsSellsCard isExpanded={expandedCard === 'buys-sells'} />
            </ExpandableCard>

            {/* Wallet Age Planet Map */}
            <ExpandableCard
              isExpanded={expandedCard === 'wallet-age'}
              onToggle={() => toggleCard('wallet-age')}
              expandedHeight="700px"
              className="h-[300px] group"
            >
              <WalletAgePlanetMapCard isExpanded={expandedCard === 'wallet-age'} />
            </ExpandableCard>
          </div>
        </div>

        {/* Bottom Row - Bar Graph and Scatter Plot */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Bar Graph Section */}
          <ExpandableCard
            isExpanded={expandedCard === 'bar-graph'}
            onToggle={() => toggleCard('bar-graph')}
            expandedHeight="700px"
            className="h-[320px] group"
          >
            <BarGraphSection isExpanded={expandedCard === 'bar-graph'} />
          </ExpandableCard>

          {/* Scatter Plot */}
          <ExpandableCard
            isExpanded={expandedCard === 'scatter'}
            onToggle={() => toggleCard('scatter')}
            expandedHeight="700px"
            className="h-[320px] group"
          >
            <ScatterPlotCard isExpanded={expandedCard === 'scatter'} />
          </ExpandableCard>
        </div>
      </div>
    </div>
  );
};

export default Index;
