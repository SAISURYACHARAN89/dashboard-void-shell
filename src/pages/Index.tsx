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
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div 
        className="w-full max-w-[1400px] bg-[hsl(var(--dashboard-container))] border border-[hsl(var(--dashboard-border))] rounded-2xl p-8"
      >
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            {/* TradingView Chart */}
            <div className="h-[600px] lg:h-[484px]">
              <TradingViewCard isExpanded={false} />
            </div>
            
            {/* Horizontal Metrics Bar */}
            <div className="h-[60px]">
              <HorizontalMetricsBar isExpanded={false} />
            </div>

            {/* Views & Likes Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <ExpandableCard
                isExpanded={expandedCards.has('views')}
                onToggle={() => toggleCard('views')}
                expandedHeight="500px"
                className="h-[204px] group"
              >
                <MetricCard 
                  type="views"
                  value={240}
                  percentChange={18}
                  chartColor="#00FFFF"
                  isExpanded={expandedCards.has('views')}
                />
              </ExpandableCard>
              <ExpandableCard
                isExpanded={expandedCards.has('likes')}
                onToggle={() => toggleCard('likes')}
                expandedHeight="500px"
                className="h-[204px] group"
              >
                <MetricCard 
                  type="likes"
                  value={65}
                  percentChange={10}
                  chartColor="#FF00FF"
                  isExpanded={expandedCards.has('likes')}
                />
              </ExpandableCard>
            </div>
          </div>
          
          {/* Right side - Stacked cards */}
          <div className="flex flex-col gap-6">
            {/* Holders Graph - Slightly larger compact card */}
            <ExpandableCard
              isExpanded={expandedCards.has('holders')}
              onToggle={() => toggleCard('holders')}
              expandedHeight="600px"
              className="h-40 group"
            >
              <HoldersGraphCard isExpanded={expandedCards.has('holders')} />
            </ExpandableCard>
            
            {/* Buys vs Sells Card */}
            <ExpandableCard
              isExpanded={expandedCards.has('buys-sells')}
              onToggle={() => toggleCard('buys-sells')}
              expandedHeight="700px"
              className="h-[300px] group"
            >
              <BuysVsSellsCard isExpanded={expandedCards.has('buys-sells')} />
            </ExpandableCard>

            {/* Wallet Age Planet Map */}
            <ExpandableCard
              isExpanded={expandedCards.has('wallet-age')}
              onToggle={() => toggleCard('wallet-age')}
              expandedHeight="700px"
              className="h-[300px] group"
            >
              <WalletAgePlanetMapCard isExpanded={expandedCards.has('wallet-age')} />
            </ExpandableCard>
          </div>
        </div>

        {/* Bottom Row - Bar Graph and Scatter Plot */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Bar Graph Section */}
          <ExpandableCard
            isExpanded={expandedCards.has('bar-graph')}
            onToggle={() => toggleCard('bar-graph')}
            expandedHeight="700px"
            className="h-[320px] group"
          >
            <BarGraphSection isExpanded={expandedCards.has('bar-graph')} />
          </ExpandableCard>

          {/* Scatter Plot */}
          <ExpandableCard
            isExpanded={expandedCards.has('scatter')}
            onToggle={() => toggleCard('scatter')}
            expandedHeight="700px"
            className="h-[320px] group"
          >
            <ScatterPlotCard isExpanded={expandedCards.has('scatter')} />
          </ExpandableCard>
        </div>
      </div>
    </div>
  );
};

export default Index;
