import { useState, useEffect } from 'react';
import TradingViewCard from '@/components/TradingViewCard';
import HoldersGraphCard from '@/components/HoldersGraphCard';
import BuysVsSellsCard from '@/components/BuysVsSellsCard';
import WalletAgePlanetMapCard from '@/components/WalletAgePlanetMapCard';
import HorizontalMetricsBar from '@/components/HorizontalMetricsBar';
import MetricCard from '@/components/MetricCard';
import BarGraphSection from '@/components/BarGraphSection';
import ScatterPlotCard from '@/components/ScatterPlotCard';
import ExpandableCard from '@/components/ExpandableCard';
import CoinInfoHeader from '@/components/CoinInfoHeader';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Define the default layout with columns
const DEFAULT_LAYOUT = {
  leftColumn: [
    { id: 'trading-view', type: 'trading-view' },
    { id: 'metrics-bar', type: 'metrics-bar' },
    { id: 'views', type: 'views' },
    { id: 'likes', type: 'likes' },
  ],
  rightColumn: [
    { id: 'holders', type: 'holders' },
    { id: 'buys-sells', type: 'buys-sells' },
    { id: 'wallet-age', type: 'wallet-age' },
  ],
  bottomRow: [
    { id: 'bar-graph', type: 'bar-graph' },
    { id: 'scatter', type: 'scatter' },
  ],
};

// Sortable card wrapper component
const SortableCard = ({ 
  id, 
  children, 
  className = '' 
}: { 
  id: string; 
  children: React.ReactNode; 
  className?: string;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className} ${isDragging ? 'z-50' : ''}`}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
};

const Index = () => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const { toast } = useToast();

  // Load layout from localStorage on mount
  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboard-layout');
    if (savedLayout) {
      try {
        setLayout(JSON.parse(savedLayout));
      } catch (error) {
        console.error('Failed to load layout:', error);
      }
    }
  }, []);

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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (column: 'leftColumn' | 'rightColumn' | 'bottomRow') => (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLayout((prevLayout) => {
        const items = prevLayout[column];
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return {
          ...prevLayout,
          [column]: arrayMove(items, oldIndex, newIndex),
        };
      });
    }
  };

  const saveLayout = () => {
    localStorage.setItem('dashboard-layout', JSON.stringify(layout));
    toast({
      title: "Layout Saved",
      description: "Your dashboard layout has been saved successfully.",
    });
  };

  const resetLayout = () => {
    setLayout(DEFAULT_LAYOUT);
    localStorage.removeItem('dashboard-layout');
    toast({
      title: "Layout Reset",
      description: "Your dashboard layout has been reset to default.",
    });
  };

  const renderCard = (item: typeof DEFAULT_LAYOUT.leftColumn[0]) => {
    switch (item.type) {
      case 'trading-view':
        return (
          <div className="h-[600px] lg:h-[484px]">
            <TradingViewCard isExpanded={false} />
          </div>
        );
      case 'holders':
        return (
          <ExpandableCard
            isExpanded={expandedCards.has('holders')}
            onToggle={() => toggleCard('holders')}
            expandedHeight="600px"
            className="h-40 group"
          >
            <HoldersGraphCard isExpanded={expandedCards.has('holders')} />
          </ExpandableCard>
        );
      case 'metrics-bar':
        return (
          <div className="h-[60px]">
            <HorizontalMetricsBar isExpanded={false} />
          </div>
        );
      case 'buys-sells':
        return (
          <ExpandableCard
            isExpanded={expandedCards.has('buys-sells')}
            onToggle={() => toggleCard('buys-sells')}
            expandedHeight="700px"
            className="h-[300px] group"
          >
            <BuysVsSellsCard isExpanded={expandedCards.has('buys-sells')} />
          </ExpandableCard>
        );
      case 'views':
        return (
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
              chartColor="#B0B0B0"
              isExpanded={expandedCards.has('views')}
            />
          </ExpandableCard>
        );
      case 'wallet-age':
        return (
          <ExpandableCard
            isExpanded={expandedCards.has('wallet-age')}
            onToggle={() => toggleCard('wallet-age')}
            expandedHeight="700px"
            className="h-[300px] group"
          >
            <WalletAgePlanetMapCard isExpanded={expandedCards.has('wallet-age')} />
          </ExpandableCard>
        );
      case 'likes':
        return (
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
              chartColor="#B0B0B0"
              isExpanded={expandedCards.has('likes')}
            />
          </ExpandableCard>
        );
      case 'bar-graph':
        return (
          <ExpandableCard
            isExpanded={expandedCards.has('bar-graph')}
            onToggle={() => toggleCard('bar-graph')}
            expandedHeight="700px"
            className="h-[320px] group"
          >
            <BarGraphSection isExpanded={expandedCards.has('bar-graph')} />
          </ExpandableCard>
        );
      case 'scatter':
        return (
          <ExpandableCard
            isExpanded={expandedCards.has('scatter')}
            onToggle={() => toggleCard('scatter')}
            expandedHeight="700px"
            className="h-[320px] group"
          >
            <ScatterPlotCard isExpanded={expandedCards.has('scatter')} />
          </ExpandableCard>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div 
        className="w-full max-w-[1400px] bg-[hsl(var(--dashboard-container))] border border-[hsl(var(--dashboard-border))] rounded-2xl p-8"
      >
        {/* Header with Coin Info and Layout Controls */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <CoinInfoHeader />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetLayout}
              className="hidden sm:flex"
            >
              Reset Layout
            </Button>
            <Button
              size="sm"
              onClick={saveLayout}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Layout
            </Button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd('leftColumn')}
            >
              <SortableContext
                items={layout.leftColumn.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {layout.leftColumn.map((item) => {
                  // Handle views and likes as a grid
                  if (item.type === 'views') {
                    const likesItem = layout.leftColumn.find(i => i.type === 'likes');
                    if (likesItem) {
                      return (
                        <div key="views-likes-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <SortableCard id={item.id}>
                            {renderCard(item)}
                          </SortableCard>
                          <SortableCard id={likesItem.id}>
                            {renderCard(likesItem)}
                          </SortableCard>
                        </div>
                      );
                    }
                  }
                  if (item.type === 'likes') {
                    // Skip likes as it's rendered with views
                    return null;
                  }
                  return (
                    <SortableCard key={item.id} id={item.id}>
                      {renderCard(item)}
                    </SortableCard>
                  );
                })}
              </SortableContext>
            </DndContext>
          </div>
          
          {/* Right Column */}
          <div className="flex flex-col gap-6">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd('rightColumn')}
            >
              <SortableContext
                items={layout.rightColumn.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {layout.rightColumn.map((item) => (
                  <SortableCard key={item.id} id={item.id}>
                    {renderCard(item)}
                  </SortableCard>
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd('bottomRow')}
          >
            <SortableContext
              items={layout.bottomRow.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {layout.bottomRow.map((item) => (
                <SortableCard key={item.id} id={item.id}>
                  {renderCard(item)}
                </SortableCard>
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
};

export default Index;
