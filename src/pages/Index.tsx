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
      className={`${className} ${isDragging ? 'z-50' : ''} relative group/sortable`}
    >
      {/* Drag Handle - Only visible on hover */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-2 top-1/2 -translate-y-1/2 z-50 opacity-0 group-hover/sortable:opacity-100 transition-opacity cursor-grab active:cursor-grabbing bg-muted border border-border rounded p-1.5 hover:bg-accent"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className="text-muted-foreground"
        >
          <circle cx="3" cy="3" r="1" fill="currentColor" />
          <circle cx="9" cy="3" r="1" fill="currentColor" />
          <circle cx="3" cy="6" r="1" fill="currentColor" />
          <circle cx="9" cy="6" r="1" fill="currentColor" />
          <circle cx="3" cy="9" r="1" fill="currentColor" />
          <circle cx="9" cy="9" r="1" fill="currentColor" />
        </svg>
      </div>
      {children}
    </div>
  );
};

const Index = () => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const [isLayoutMode, setIsLayoutMode] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Load layout from localStorage on mount
  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboard-layout');
    const savedVisible = localStorage.getItem('dashboard-visible-sections');
    
    if (savedLayout) {
      try {
        setLayout(JSON.parse(savedLayout));
      } catch (error) {
        console.error('Failed to load layout:', error);
      }
    }
    
    if (savedVisible) {
      try {
        setVisibleSections(new Set(JSON.parse(savedVisible)));
      } catch (error) {
        console.error('Failed to load visible sections:', error);
      }
    } else {
      // Default: all sections visible
      const allSections = new Set([
        ...DEFAULT_LAYOUT.leftColumn.map(s => s.id),
        ...DEFAULT_LAYOUT.rightColumn.map(s => s.id),
        ...DEFAULT_LAYOUT.bottomRow.map(s => s.id),
      ]);
      setVisibleSections(allSections);
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;
    if (active.id === over.id) return;

    setLayout((prevLayout) => {
      // Find which column/row the active item is in
      let sourceColumn: 'leftColumn' | 'rightColumn' | 'bottomRow' | null = null;
      let sourceIndex = -1;
      let movedItem = null;

      if (prevLayout.leftColumn.find(item => item.id === active.id)) {
        sourceColumn = 'leftColumn';
        sourceIndex = prevLayout.leftColumn.findIndex(item => item.id === active.id);
        movedItem = prevLayout.leftColumn[sourceIndex];
      } else if (prevLayout.rightColumn.find(item => item.id === active.id)) {
        sourceColumn = 'rightColumn';
        sourceIndex = prevLayout.rightColumn.findIndex(item => item.id === active.id);
        movedItem = prevLayout.rightColumn[sourceIndex];
      } else if (prevLayout.bottomRow.find(item => item.id === active.id)) {
        sourceColumn = 'bottomRow';
        sourceIndex = prevLayout.bottomRow.findIndex(item => item.id === active.id);
        movedItem = prevLayout.bottomRow[sourceIndex];
      }

      // Find which column/row the over item is in
      let targetColumn: 'leftColumn' | 'rightColumn' | 'bottomRow' | null = null;
      let targetIndex = -1;

      if (prevLayout.leftColumn.find(item => item.id === over.id)) {
        targetColumn = 'leftColumn';
        targetIndex = prevLayout.leftColumn.findIndex(item => item.id === over.id);
      } else if (prevLayout.rightColumn.find(item => item.id === over.id)) {
        targetColumn = 'rightColumn';
        targetIndex = prevLayout.rightColumn.findIndex(item => item.id === over.id);
      } else if (prevLayout.bottomRow.find(item => item.id === over.id)) {
        targetColumn = 'bottomRow';
        targetIndex = prevLayout.bottomRow.findIndex(item => item.id === over.id);
      }

      if (!sourceColumn || !targetColumn || !movedItem) return prevLayout;

      // If moving within the same column
      if (sourceColumn === targetColumn) {
        const items = [...prevLayout[sourceColumn]];
        const reordered = arrayMove(items, sourceIndex, targetIndex);
        return {
          ...prevLayout,
          [sourceColumn]: reordered
        };
      }

      // Moving between different columns - create new arrays
      const newLayout = {
        leftColumn: [...prevLayout.leftColumn],
        rightColumn: [...prevLayout.rightColumn],
        bottomRow: [...prevLayout.bottomRow],
      };
      
      // Remove from source
      if (sourceColumn === 'leftColumn') {
        newLayout.leftColumn = newLayout.leftColumn.filter(item => item.id !== active.id);
      } else if (sourceColumn === 'rightColumn') {
        newLayout.rightColumn = newLayout.rightColumn.filter(item => item.id !== active.id);
      } else {
        newLayout.bottomRow = newLayout.bottomRow.filter(item => item.id !== active.id);
      }

      // Add to target at the correct position
      if (targetColumn === 'leftColumn') {
        newLayout.leftColumn.splice(targetIndex, 0, movedItem);
      } else if (targetColumn === 'rightColumn') {
        newLayout.rightColumn.splice(targetIndex, 0, movedItem);
      } else {
        newLayout.bottomRow.splice(targetIndex, 0, movedItem);
      }

      return newLayout;
    });
  };

  const saveLayout = () => {
    localStorage.setItem('dashboard-layout', JSON.stringify(layout));
    localStorage.setItem('dashboard-visible-sections', JSON.stringify([...visibleSections]));
    setIsLayoutMode(false);
    toast({
      title: "Layout Saved",
      description: "Your dashboard layout has been saved successfully.",
    });
  };

  const resetLayout = () => {
    setLayout(DEFAULT_LAYOUT);
    const allSections = new Set([
      ...DEFAULT_LAYOUT.leftColumn.map(s => s.id),
      ...DEFAULT_LAYOUT.rightColumn.map(s => s.id),
      ...DEFAULT_LAYOUT.bottomRow.map(s => s.id),
    ]);
    setVisibleSections(allSections);
    localStorage.removeItem('dashboard-layout');
    localStorage.removeItem('dashboard-visible-sections');
    setIsLayoutMode(false);
    toast({
      title: "Layout Reset",
      description: "Your dashboard layout has been reset to default.",
    });
  };

  const startLayoutMode = () => {
    setIsLayoutMode(true);
  };

  const toggleSectionVisibility = (sectionId: string) => {
    setVisibleSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
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
          <div className="h-[300px]">
            <BuysVsSellsCard isExpanded={false} />
          </div>
        );
      case 'views':
        return (
          <div className="w-full">
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
          </div>
        );
      case 'wallet-age':
        return (
          <ExpandableCard
            isExpanded={expandedCards.has('wallet-age')}
            onToggle={() => toggleCard('wallet-age')}
            expandedHeight="600px"
            className="h-[300px] group"
          >
            <WalletAgePlanetMapCard isExpanded={expandedCards.has('wallet-age')} />
          </ExpandableCard>
        );
      case 'likes':
        return (
          <div className="w-full">
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
          </div>
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
        className="w-full bg-[hsl(var(--dashboard-container))] border border-[hsl(var(--dashboard-border))] rounded-2xl p-8"
        style={{ maxWidth: '1600px' }}
      >
        {/* Header with Coin Info and Layout Controls */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <CoinInfoHeader />
          <div className="flex items-center gap-2">
            {!isLayoutMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startLayoutMode}
                >
                  Create Layout
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetLayout}
                  className="hidden sm:flex"
                >
                  Reset Layout
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={saveLayout}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save Layout
              </Button>
            )}
          </div>
        </div>

        {isLayoutMode ? (
          // Layout Mode: Blank canvas with section library
          <div className="relative min-h-[800px] border-2 border-dashed border-muted-foreground/20 rounded-xl p-6">
            {/* Section Library Panel */}
            <div className="absolute top-4 right-4 w-64 bg-card border border-border rounded-lg p-4 shadow-lg max-h-[calc(100vh-200px)] overflow-y-auto">
              <h3 className="text-sm font-semibold mb-3 text-foreground">Available Sections</h3>
              <p className="text-xs text-muted-foreground mb-4">Click to add/remove sections</p>
              <div className="space-y-2">
                {[
                  { id: 'trading-view', label: 'TradingView Chart', type: 'trading-view' },
                  { id: 'holders', label: 'Holders Graph', type: 'holders' },
                  { id: 'metrics-bar', label: 'Metrics Bar', type: 'metrics-bar' },
                  { id: 'buys-sells', label: 'Buys vs Sells', type: 'buys-sells' },
                  { id: 'views', label: 'Views', type: 'views' },
                  { id: 'wallet-age', label: 'Wallet Age', type: 'wallet-age' },
                  { id: 'likes', label: 'Likes', type: 'likes' },
                  { id: 'bar-graph', label: 'Bar Graph', type: 'bar-graph' },
                  { id: 'scatter', label: 'Scatter Plot', type: 'scatter' },
                ].map((section) => {
                  const isVisible = visibleSections.has(section.id);
                  return (
                    <button
                      key={section.id}
                      onClick={() => toggleSectionVisibility(section.id)}
                      className={`w-full p-3 rounded border text-left transition-colors text-xs font-medium ${
                        isVisible
                          ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                          : 'bg-muted border-border hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{section.label}</span>
                        {isVisible ? (
                          <span className="text-xs">✓</span>
                        ) : (
                          <span className="text-xs opacity-50">+</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Canvas Area */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={[
                  ...layout.leftColumn.filter(item => visibleSections.has(item.id)).map(item => item.id),
                  ...layout.rightColumn.filter(item => visibleSections.has(item.id)).map(item => item.id),
                  ...layout.bottomRow.filter(item => visibleSections.has(item.id)).map(item => item.id),
                ]}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pr-72">
                  {/* Left Column */}
                  <div className="flex flex-col gap-6 min-h-[400px]">
                    {layout.leftColumn.filter(item => visibleSections.has(item.id)).map((item, index, array) => {
                      // Check if this is Views and if Likes is also in the same column
                      if (item.type === 'views') {
                        const likesItem = array.find(i => i.type === 'likes');
                        if (likesItem) {
                          return (
                            <div key="views-likes-grid" className="grid grid-cols-2 gap-6">
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
                      // Skip Likes if it's already rendered with Views
                      if (item.type === 'likes' && array.find(i => i.type === 'views')) {
                        return null;
                      }
                      return (
                        <SortableCard key={item.id} id={item.id}>
                          {renderCard(item)}
                        </SortableCard>
                      );
                    })}
                  </div>
                  
                  {/* Right Column */}
                  <div className="flex flex-col gap-6 min-h-[400px]">
                    {layout.rightColumn.filter(item => visibleSections.has(item.id)).map((item, index, array) => {
                      // Check if this is Views and if Likes is also in the same column
                      if (item.type === 'views') {
                        const likesItem = array.find(i => i.type === 'likes');
                        if (likesItem) {
                          return (
                            <div key="views-likes-grid" className="grid grid-cols-2 gap-6">
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
                      // Skip Likes if it's already rendered with Views
                      if (item.type === 'likes' && array.find(i => i.type === 'views')) {
                        return null;
                      }
                      return (
                        <SortableCard key={item.id} id={item.id}>
                          {renderCard(item)}
                        </SortableCard>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 pr-72 min-h-[200px]">
                  {layout.bottomRow.filter(item => visibleSections.has(item.id)).map((item) => (
                    <SortableCard key={item.id} id={item.id}>
                      {renderCard(item)}
                    </SortableCard>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        ) : (
          // Normal Mode: No drag handles, just click to expand
          <>
            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="flex flex-col gap-6">
                {layout.leftColumn.filter(item => visibleSections.has(item.id)).map((item, index, array) => {
                  // Check if this is Views and if Likes is also in the same column
                  if (item.type === 'views') {
                    const likesItem = array.find(i => i.type === 'likes');
                    if (likesItem) {
                      return (
                        <div key="views-likes-grid" className="grid grid-cols-2 gap-6">
                          {renderCard(item)}
                          {renderCard(likesItem)}
                        </div>
                      );
                    }
                  }
                  // Skip Likes if it's already rendered with Views
                  if (item.type === 'likes' && array.find(i => i.type === 'views')) {
                    return null;
                  }
                  return (
                    <div key={item.id}>
                      {renderCard(item)}
                    </div>
                  );
                })}
              </div>
              
              {/* Right Column */}
              <div className="flex flex-col gap-6">
                {layout.rightColumn.filter(item => visibleSections.has(item.id)).map((item, index, array) => {
                  // Check if this is Views and if Likes is also in the same column
                  if (item.type === 'views') {
                    const likesItem = array.find(i => i.type === 'likes');
                    if (likesItem) {
                      return (
                        <div key="views-likes-grid" className="grid grid-cols-2 gap-6">
                          {renderCard(item)}
                          {renderCard(likesItem)}
                        </div>
                      );
                    }
                  }
                  // Skip Likes if it's already rendered with Views
                  if (item.type === 'likes' && array.find(i => i.type === 'views')) {
                    return null;
                  }
                  
                  // Check if this item should expand horizontally
                  const shouldExpandFull = (item.type === 'bar-graph' || item.type === 'scatter') 
                    && expandedCards.has(item.id);
                  
                  if (shouldExpandFull) {
                    return (
                      <div key={item.id} className="lg:col-start-1 lg:col-span-2 lg:-ml-[calc(50%+0.75rem)]">
                        {renderCard(item)}
                      </div>
                    );
                  }
                  
                  return (
                    <div key={item.id}>
                      {renderCard(item)}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {layout.bottomRow.filter(item => visibleSections.has(item.id)).map((item, index) => {
                // Check if this item should expand horizontally
                const shouldExpandFull = (item.type === 'bar-graph' || item.type === 'scatter') 
                  && expandedCards.has(item.id);
                
                // Check if previous item was also expanded
                const prevItem = index > 0 ? layout.bottomRow.filter(i => visibleSections.has(i.id))[index - 1] : null;
                const prevWasExpanded = prevItem && (prevItem.type === 'bar-graph' || prevItem.type === 'scatter') 
                  && expandedCards.has(prevItem.id);
                
                return (
                  <div 
                    key={item.id} 
                    className={`${shouldExpandFull ? 'lg:col-span-2' : ''} ${prevWasExpanded && shouldExpandFull ? 'mt-6' : ''}`}
                  >
                    {renderCard(item)}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
