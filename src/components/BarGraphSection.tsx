import { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line } from 'recharts';
import { Users, UserCheck, Bell } from 'lucide-react';
import TimeframeSelector, { Timeframe } from './TimeframeSelector';
import EditModal from './EditModal';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import dayjs from 'dayjs';

interface BarGraphSectionProps {
  isExpanded?: boolean;
  isLayoutMode?: boolean;
  showMembers?: boolean;
  socialType?: string;
  dataSource?: 'ca' | 'community';
  data?: any;  // Full data object
  social?: {   // Social data specifically
    current?: {
      bookmarks: number;
      lastUpdated: string;
      likes: number;
      memberCount: number;
      quotes: number;
      replies: number;
      retweets: number;
      uniqueAuthors: number;
      views: number;
    };
    history?: Array<{
      bookmarks: number;
      likes: number;
      quotes: number;
      replies: number;
      retweets: number;
      time: string;
      timestamp: string;
      uniqueAuthors: number;
      views: number;
    }>;
  };
  twitterSearch?: {
    total_posts_count: number;
    total_media_posts_count: number;
    total_normal_posts_count: number;
    unique_authors_count: number;
    unique_authors: Record<string, {
      name: string;
      followers_count: number;
    }>;
    success: boolean;
  };
}

// Get available metrics for current mode - MOVED OUTSIDE COMPONENT to avoid dependency issues
const getAvailableMetrics = () => {
  return [
    { value: 'members', label: 'Members' },
    { value: 'uniqueAuthors', label: 'Unique Authors' },
    { value: 'totalPosts', label: 'Total Posts' },
    { value: 'mediaCount', label: 'Media Posts' },
    { value: 'comments', label: 'Comments' },
    { value: 'reposts', label: 'Reposts' },
    { value: 'likes', label: 'Likes' },
    { value: 'views', label: 'Views' },
    { value: 'quotes', label: 'Quotes' },
    { value: 'bookmarks', label: 'Bookmarks' }
  ];
};

const BarGraphSection = ({ 
  isExpanded = false, 
  isLayoutMode = false,
  data,
  social,
  showMembers = true,
  socialType = 'X Community',
  dataSource = 'community'
}: BarGraphSectionProps) => {
  // Use social prop if provided, otherwise try to get it from data
  const socialData = social || data?.social;

  const isTweet = socialType === 'Tweet' && dataSource === 'community';
  const isAccount = socialType === 'Account' && dataSource === 'community';
  const isPost = data?.x_data_type === 'post';
  const isSingleAccount = data?.x_data_type === 'single_account';
  const isCommunity = data?.x_data_type === 'community';
  const isPostsWithCA = dataSource === 'ca';  // Keep this declaration
  const isCommunityAnalysis = dataSource === 'community' && !isTweet && !isAccount && showMembers;
  
  const [hoveredBar, setHoveredBar] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('5m');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [showMLine, setShowMLine] = useState(true);
  const [showCLine, setShowCLine] = useState(true);

  // Alert state for all modes
  const [alerts, setAlerts] = useState<{
    uniqueAuthors: number[];
    members: number[];
    totalPosts: number[];
    mediaCount: number[];
    comments: number[];
    reposts: number[];
    quotes: number[];
    views: number[];
    likes: number[];
    bookmarks: number[];
  }>({
    uniqueAuthors: [],
    members: [],
    totalPosts: [],
    mediaCount: [],
    comments: [],
    reposts: [],
    quotes: [],
    views: [],
    likes: [],
    bookmarks: []
  });

  const [tempAlertValue, setTempAlertValue] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('uniqueAuthors');

  // Add cache state
  const [dataCache, setDataCache] = useState<{
    chartData: any[];
    totalPostsData: any[];
    metrics: any;
    twitterSearchData: any;
    lastUpdate: number;
  }>({
    chartData: [],
    totalPostsData: [],
    metrics: {
      memberCount: 0,
      uniqueAuthors: 0,
      memberChangePercent: 0,
      uniqueAuthorsChangePercent: 0,
      totalPosts: 0,
      mediaCount: 0,
      normalPostCount: 0,
      comments: 0,
      reposts: 0,
      quotes: 0,
      views: 0,
      bookmarks: 0,
      likes: 0
    },
    twitterSearchData: null,
    lastUpdate: 0
  });

  // Cache duration (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Extract REAL data from props - FIXED to use actual data
  const currentMetrics = socialData?.current;
  const historyMetrics = socialData?.history || [];
  
  // Extract timeline data from the main data object
  const timelineData = data?.data?.x_data?.timeline || [];
  
  // Extract twitterSearch data
  const twitterSearchData = data?.twitterSearch || twitterSearch;

  // Calculate media posts (posts with links)
  const calculateMediaPosts = () => {
    if (!timelineData.length) return 0;
    
    const mediaPosts = timelineData.filter((post: any) => {
      const text = post.text || '';
      // Check for common URL patterns in text
      return text.includes('http://') || 
             text.includes('https://') || 
             text.includes('t.me/') ||
             text.includes('t.co/') ||
             text.includes('x.com/') ||
             text.includes('twitter.com/');
    });
    
    return mediaPosts.length;
  };

  // Calculate normal posts (posts without links)
  const calculateNormalPosts = () => {
    if (!timelineData.length) return 0;
    
    const normalPosts = timelineData.filter((post: any) => {
      const text = post.text || '';
      // Check for absence of common URL patterns
      return !text.includes('http://') && 
             !text.includes('https://') && 
             !text.includes('t.me/') &&
             !text.includes('t.co/') &&
             !text.includes('x.com/') &&
             !text.includes('twitter.com/');
    });
    
    return normalPosts.length;
  };

  // Helper functions with proper error handling
  const formatNumber = (num: number): string => {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Get metrics based on mode
  const getMetrics = () => {
    // For post type with twitterSearch data
    if (dataSource === 'ca' && twitterSearchData?.success) {
      return {
        memberCount: 0,
        uniqueAuthors: twitterSearchData.unique_authors_count || 0,
        memberChangePercent: 0,
        uniqueAuthorsChangePercent: 0,
        totalPosts: twitterSearchData.total_posts_count || 0,
        mediaCount: twitterSearchData.total_media_posts_count || 0,
        normalPostCount: twitterSearchData.total_normal_posts_count || 0,
        comments: 0,
        reposts: 0,
        quotes: 0,
        views: 0,
        bookmarks: 0,
        likes: 0
      };
    }

    // Use real current metrics if available
    if (currentMetrics) {      
      return {
        memberCount: currentMetrics.memberCount || 0,
        uniqueAuthors: currentMetrics.uniqueAuthors || data?.unique_authors || 0,
        memberChangePercent: calculateChangePercent('memberCount'),
        uniqueAuthorsChangePercent: calculateChangePercent('uniqueAuthors'),
        totalPosts: timelineData.length,
        mediaCount: calculateMediaPosts(timelineData),
        normalPostCount: calculateNormalPosts(timelineData),
        comments: currentMetrics.replies || 0,
        reposts: currentMetrics.retweets || 0,
        quotes: currentMetrics.quotes || 0,
        views: currentMetrics.views || 0,
        bookmarks: currentMetrics.bookmarks || 0,
        likes: currentMetrics.likes || 0
      };
    }

    // Fallback using timeline data only
    return {
      memberCount: data?.x_data?.fetchOne?.member_count || 0,
      uniqueAuthors: data?.unique_authors || 0,
      memberChangePercent: 0,
      uniqueAuthorsChangePercent: 0,
      totalPosts: timelineData.length,
      mediaCount: calculateMediaPosts(timelineData),
      normalPostCount: calculateNormalPosts(timelineData),
      comments: 0,
      reposts: 0,
      quotes: 0,
      views: 0,
      bookmarks: 0,
      likes: 0
    };
  };

  const calculateChangePercent = (metric: string): number => {
    if (!historyMetrics || historyMetrics.length < 2) return 0;
    try {
      const current = historyMetrics[historyMetrics.length - 1]?.[metric as keyof typeof historyMetrics[0]] || 0;
      const previous = historyMetrics[historyMetrics.length - 2]?.[metric as keyof typeof historyMetrics[0]] || 0;
      
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    } catch (error) {
      return 0;
    }
  };

  // Generate chart data from REAL history data
  const generateChartData = () => {
    // CA mode: show previous vs current unique authors (single data point)
    if (dataSource === 'ca' && twitterSearchData?.success) {
      const curr = twitterSearchData.unique_authors_count || 0;
      // Get previous value from history if available
      let prev = 0;
      try {
        const hist = data.history || [];
        if (hist.length > 0) {
          const last = hist[hist.length - 1];
          prev = last.search_metrics?.unique_authors_count ?? last.unique_authors ?? 0;
        }
      } catch (e) { prev = 0; }
      return [{
        time: 'Now',
        current: curr,
        previous: prev
      }];
    }

    if (historyMetrics.length > 0) {
      return historyMetrics.map((metric) => ({
        time: metric.time || dayjs(metric.timestamp).format('HH:mm:ss'),
        current: metric.memberCount || 0,
        previous: metric.uniqueAuthors || 0,
      })).slice(-20); // Keep last 20 points
    }
    
    // If no history, use current metrics as single data point
    if (currentMetrics) {
      return [{
        time: dayjs(currentMetrics.lastUpdated).format('HH:mm:ss'),
        current: currentMetrics.memberCount || 0,
        previous: currentMetrics.uniqueAuthors || 0,
      }];
    }
    
    // Empty state
    return [];
  };

  // Generate total posts data from REAL history data
  const generateTotalPostsData = () => {
    // CA mode: use twitterSearch totals
    if (dataSource === 'ca' && twitterSearchData?.success) {
      return [{
        time: 'Now',
        total: twitterSearchData.total_posts_count || 0,
        m: twitterSearchData.total_media_posts_count || 0,
        c: twitterSearchData.total_normal_posts_count || 0
      }];
    }

    if (historyMetrics.length > 0) {
      return historyMetrics.map((metric) => {
        const totalPosts = (metric.replies || 0) + (metric.retweets || 0) + (metric.quotes || 0);
        return {
          time: metric.time || dayjs(metric.timestamp).format('HH:mm'),
          total: totalPosts,
          m: metric.likes || 0, // Using likes as M value
          c: metric.replies || 0, // Using replies as C value
        };
      }).slice(-20);
    }
    
    // If no history data, create data points from current metrics
    if (currentMetrics || timelineData.length > 0) {
      const totalPosts = getMetrics().totalPosts;
      return [{
        time: dayjs().format('HH:mm'),
        total: totalPosts,
        m: getMetrics().mediaCount, // M is media count
        c: getMetrics().normalPostCount, // C is normal post count
      }];
    }
    
    // Empty state
    return [];
  };

  // Update cache when new valid data arrives - FIXED for CA data
  useEffect(() => {
    const now = Date.now();
    
    // Check if we have valid new data to cache
    const hasValidChartData = generateChartData().length > 0;
    const hasValidPostsData = generateTotalPostsData().length > 0;
    const hasValidMetrics = getMetrics().totalPosts > 0 || getMetrics().uniqueAuthors > 0;
    const hasValidTwitterSearch = twitterSearchData?.success;
    
    if (hasValidChartData || hasValidPostsData || hasValidMetrics || hasValidTwitterSearch) {
      setDataCache({
        chartData: hasValidChartData ? generateChartData() : dataCache.chartData,
        totalPostsData: hasValidPostsData ? generateTotalPostsData() : dataCache.totalPostsData,
        metrics: hasValidMetrics ? getMetrics() : dataCache.metrics,
        twitterSearchData: hasValidTwitterSearch ? {...twitterSearchData} : dataCache.twitterSearchData,
        lastUpdate: now
      });
    }
  }, [historyMetrics, currentMetrics, timelineData, dataSource, data, twitterSearchData]);

  // Check if cache is still valid
  const isCacheValid = useMemo(() => {
    return Date.now() - dataCache.lastUpdate < CACHE_DURATION;
  }, [dataCache.lastUpdate]);

  // Use cached data when current data is empty, otherwise use current data
  const persistentChartData = useMemo(() => {
    const currentData = generateChartData();
    
    // If we have current data, use it
    if (currentData && currentData.length > 0) {
      return currentData;
    }
    
    // If no current data but cache is valid, use cached data
    if (isCacheValid && dataCache.chartData.length > 0) {
      return dataCache.chartData;
    }
    
    // Otherwise return empty array
    return [];
  }, [generateChartData, isCacheValid, dataCache.chartData]);

  // Use cached data for total posts when current data is empty
  const persistentTotalPostsData = useMemo(() => {
    const currentData = generateTotalPostsData();
    
    // If we have current data, use it
    if (currentData && currentData.length > 0) {
      return currentData;
    }
    
    // If no current data but cache is valid, use cached data
    if (isCacheValid && dataCache.totalPostsData.length > 0) {
      return dataCache.totalPostsData;
    }
    
    // Otherwise return empty array
    return [];
  }, [generateTotalPostsData, isCacheValid, dataCache.totalPostsData]);

  // Use cached metrics when current metrics are empty - FIXED for CA data
  const persistentMetrics = useMemo(() => {
    const currentMetricsData = getMetrics();
    
    // For CA data, check if we have valid twitterSearch data
    if (dataSource === 'ca') {
      // If we have current twitterSearch data, use it
      if (twitterSearchData?.success) {
        return currentMetricsData;
      }
      // If no current twitterSearch but cache has valid CA data, use cached metrics
      if (isCacheValid && dataCache.twitterSearchData?.success) {
        return {
          memberCount: 0,
          uniqueAuthors: dataCache.twitterSearchData.unique_authors_count || 0,
          memberChangePercent: 0,
          uniqueAuthorsChangePercent: 0,
          totalPosts: dataCache.twitterSearchData.total_posts_count || 0,
          mediaCount: dataCache.twitterSearchData.total_media_posts_count || 0,
          normalPostCount: dataCache.twitterSearchData.total_normal_posts_count || 0,
          comments: 0,
          reposts: 0,
          quotes: 0,
          views: 0,
          bookmarks: 0,
          likes: 0
        };
      }
    }
    
    // For non-CA data, use the normal logic
    // If we have current metrics with valid data, use them
    if (currentMetricsData.totalPosts > 0 || currentMetricsData.uniqueAuthors > 0) {
      return currentMetricsData;
    }
    
    // If no current metrics but cache is valid, use cached metrics
    if (isCacheValid && (dataCache.metrics.totalPosts > 0 || dataCache.metrics.uniqueAuthors > 0)) {
      return dataCache.metrics;
    }
    
    // Otherwise return current metrics (which might be empty)
    return currentMetricsData;
  }, [getMetrics, isCacheValid, dataCache.metrics, dataCache.twitterSearchData, dataSource, twitterSearchData]);

  const metrics = persistentMetrics;

  // Check for triggered alerts - FIXED: Use availableMetrics directly
  const triggeredAlerts = useMemo(() => {
    const currentValues = {
      uniqueAuthors: metrics.uniqueAuthors,
      members: metrics.memberCount,
      totalPosts: metrics.totalPosts,
      mediaCount: metrics.mediaCount,
      comments: metrics.comments,
      reposts: metrics.reposts,
      quotes: metrics.quotes,
      views: metrics.views,
      likes: metrics.likes,
      bookmarks: metrics.bookmarks
    };

    const triggered: string[] = [];
    
    Object.entries(alerts).forEach(([metric, alertValues]) => {
      alertValues.forEach(alertValue => {
        if (currentValues[metric as keyof typeof currentValues] >= alertValue) {
          const metricLabel = getAvailableMetrics().find(m => m.value === metric)?.label || metric;
          triggered.push(`${metricLabel}: ${alertValue}`);
        }
      });
    });

    return triggered;
  }, [metrics, alerts]);

  // Get appropriate title and description based on data type
  const getTitleConfig = () => {
    if (isPostsWithCA && (twitterSearchData?.success || dataCache.twitterSearchData?.success)) {
      return {
        title: 'CA Post Analysis',
        description: 'Unique authors and post distribution'
      };
    }
    if (isPost) {
      return {
        title: 'Engagement Metrics',
        description: 'Likes vs Retweets for this post'
      };
    }
    if (isSingleAccount) {
      return {
        title: 'Account Analytics', 
        description: 'Follower metrics and account activity'
      };
    }
    if (isTweet || isAccount) {
      return {
        title: 'Comments vs Reposts',
        description: 'Current vs Previous Refresh'
      };
    }
    return {
      title: showMembers ? 'Members vs Unique Authors' : 'Unique Authors',
      description: isExpanded ? 'Extended historical comparison with detailed refresh data' : 'Current vs Previous Refresh'
    };
  };

  const titleConfig = getTitleConfig();

  const availableMetrics = getAvailableMetrics();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="px-3 py-2 rounded-lg border border-[hsl(var(--dashboard-border))]"
          style={{ background: 'rgba(0, 0, 0, 0.9)' }}
        >
          <div className="text-white text-xs font-medium mb-1">
            {payload[0].payload.time}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: '#FFFFFF' }} />
              <span className="text-white text-xs">
                {showMembers ? 'Members' : 'Current'}: {payload[0].value.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: '#808080' }} />
              <span className="text-white text-xs">
                {showMembers ? 'Unique Authors' : 'Previous'}: {payload[1].value.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Safe value access for display - UPDATED to use persistent data
  const currentTotalPosts = (dataSource === 'ca') ? metrics.totalPosts : metrics.totalPosts;
  const currentMValue = (dataSource === 'ca') ? metrics.mediaCount : metrics.mediaCount;
  const currentCValue = (dataSource === 'ca') ? metrics.normalPostCount : metrics.normalPostCount;

  const hasAlerts = Object.values(alerts).some(alertArray => alertArray.length > 0);

  // Get current value for selected metric
  const getCurrentMetricValue = () => {
    return metrics[selectedMetric as keyof typeof metrics] || 0;
  };

  // Handle adding new alert
  const handleAddAlert = () => {
    const value = parseInt(tempAlertValue);
    if (value && value > 0) {
      const currentAlerts = alerts[selectedMetric as keyof typeof alerts] || [];
      if (!currentAlerts.includes(value)) {
        setAlerts(prev => ({
          ...prev,
          [selectedMetric]: [...currentAlerts, value].sort((a, b) => a - b)
        }));
        setTempAlertValue('');
      }
    }
  };

  // Handle removing alert
  const handleRemoveAlert = (metric: string, index: number) => {
    setAlerts(prev => ({
      ...prev,
      [metric]: prev[metric as keyof typeof alerts].filter((_, i) => i !== index)
    }));
  };

  return (
    <div 
      className="border border-[hsl(var(--dashboard-border))] rounded-2xl p-6 h-full transition-all duration-300 hover:scale-[1.01] relative"
      style={{
        background: 'linear-gradient(180deg, #0D0D0D 0%, #121212 100%)'
      }}
    >
      {/* Cache Status Indicator */}
      {!isCacheValid && (dataCache.chartData.length > 0 || dataCache.totalPostsData.length > 0 || dataCache.twitterSearchData) && (
        <div className="absolute top-2 left-2 z-10">
          <div className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded border border-yellow-500/30 inline-flex items-center gap-1">
            <span>Showing cached data</span>
          </div>
        </div>
      )}

      {/* Alert Button & Timeframe Selector */}
      {!isLayoutMode && (
        <div className="absolute top-6 right-6 z-10 flex items-center gap-2">
          <button
            onClick={() => setIsAlertOpen(true)}
            className={`transition-colors relative ${
              hasAlerts ? 'text-[#8A2BE2] hover:text-[#8A2BE2]/80' : 'text-[#AAAAAA] hover:text-white'
            }`}
          >
            <Bell className="h-4 w-4" />
            {triggeredAlerts.length > 0 && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
          {/* <TimeframeSelector value={timeframe} onChange={setTimeframe} /> */}
        </div>
      )}

      <EditModal
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        title={`${titleConfig.title} Alerts`}
      >
        <div className="space-y-6">
          {/* Clear All Button */}
          {hasAlerts && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setAlerts({
                  uniqueAuthors: [],
                  members: [],
                  totalPosts: [],
                  mediaCount: [],
                  comments: [],
                  reposts: [],
                  quotes: [],
                  views: [],
                  likes: [],
                  bookmarks: []
                });
              }}
            >
              Clear All Alerts
            </Button>
          )}

          {/* Triggered Alerts Display */}
          {triggeredAlerts.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-red-400">Triggered Alerts</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {triggeredAlerts.map((alert, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium flex items-center justify-between border border-red-500/30"
                  >
                    <span>{alert}</span>
                    <span className="text-xs">Active</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Alerts Display */}
          {hasAlerts && (
            <div className="space-y-4">
              <Label className="text-sm font-semibold">Active Alerts</Label>
              {availableMetrics.map(metric => (
                alerts[metric.value as keyof typeof alerts]?.length > 0 && (
                  <div key={metric.value} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">{metric.label} Alerts</Label>
                      <span className="text-xs text-muted-foreground">{timeframe}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {alerts[metric.value as keyof typeof alerts].map((alertValue, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium flex items-center gap-2 border border-purple-500/30"
                        >
                          <span>{alertValue.toLocaleString()}</span>
                          <button
                            onClick={() => handleRemoveAlert(metric.value, idx)}
                            className="hover:text-purple-300"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}

          {/* Add New Alert */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold">Add New Alert</Label>
            
            {/* Metric Selection */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Select Metric</Label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="w-full p-2 bg-[#1A1F2C] border border-[#1E1E1E] rounded-lg text-sm text-foreground"
              >
                {availableMetrics.map(metric => (
                  <option key={metric.value} value={metric.value}>
                    {metric.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Alert Value Input */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Alert When Value Reaches</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Enter threshold value..."
                  value={tempAlertValue}
                  onChange={(e) => setTempAlertValue(e.target.value)}
                  className="bg-[#1A1F2C] border-[#1E1E1E]"
                />
                <Button 
                  onClick={handleAddAlert}
                  disabled={!tempAlertValue || parseInt(tempAlertValue) <= 0}
                >
                  Add Alert
                </Button>
              </div>
            </div>

            {/* Current Value Reference */}
            <div className="p-3 bg-[#1A1F2C] rounded-lg border border-[#1E1E1E]">
              <Label className="text-sm text-muted-foreground">Current Value</Label>
              <div className="text-lg font-semibold text-foreground mt-1">
                {getCurrentMetricValue().toLocaleString()} {availableMetrics.find(m => m.value === selectedMetric)?.label}
              </div>
            </div>
          </div>

          <Button 
            className="w-full" 
            onClick={() => setIsAlertOpen(false)}
            variant="outline"
          >
            Done
          </Button>
        </div>
      </EditModal>

      <div className="flex flex-col h-full">
        {/* Title */}
        <div className="mb-2">
          <h3 className="text-foreground text-base font-semibold">
            {titleConfig.title}
          </h3>
          <p className="text-muted-foreground text-xs mt-0.5">
            {titleConfig.description}
          </p>
        </div>

        {/* Alert Status Indicator */}
        {triggeredAlerts.length > 0 && (
          <div className="mb-3">
            <div className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30 inline-flex items-center gap-1">
              <span>{triggeredAlerts.length} alert{triggeredAlerts.length > 1 ? 's' : ''} triggered</span>
            </div>
          </div>
        )}

        {/* Data Status Indicator */}
        {!currentMetrics && historyMetrics.length === 0 && timelineData.length === 0 && !twitterSearchData?.success && !isCacheValid && (
          <div className="mb-3">
            <div className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded border border-yellow-500/30 inline-flex items-center gap-1">
              <span>No data available</span>
            </div>
          </div>
        )}

        {/* Data Loaded Indicator */}
        {(currentMetrics || historyMetrics.length > 0 || timelineData.length > 0 || twitterSearchData?.success || isCacheValid) && (
          <div className="mb-3">
            <div className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/30 inline-flex items-center gap-1">
              <span>
                {isCacheValid && !currentMetrics && historyMetrics.length === 0 && timelineData.length === 0 && !twitterSearchData?.success ? 'Cached data' : 'Live data'} • 
                {dataSource === 'ca' && ` ${metrics.totalPosts} posts • ${metrics.uniqueAuthors} authors`}
                {dataSource !== 'ca' && timelineData.length > 0 && ` ${timelineData.length} posts`}
                {historyMetrics.length > 0 && ` • ${historyMetrics.length} data points`}
              </span>
            </div>
          </div>
        )}

        {/* Charts Container */}
        <div className={`flex-1 min-h-0 flex gap-4 ${isExpanded ? '' : 'flex-col'}`}>
          {/* Main Bar Chart */}
          <div className={`${isExpanded && !isTweet && !isAccount ? 'w-[70%]' : 'flex-1'} min-h-0`}>
            {persistentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={persistentChartData}
                  margin={{ top: 30, right: 25, bottom: 5, left: 25 }}
                  barGap={-10}
                >
                  <XAxis 
                    dataKey="time"
                    stroke="#666666"
                    tick={{ fill: '#666666', fontSize: 11 }}
                    tickLine={{ stroke: '#333333' }}
                    axisLine={{ stroke: '#333333' }}
                  />
                  <YAxis 
                    stroke="#666666"
                    tick={{ fill: '#666666', fontSize: 11 }}
                    tickLine={{ stroke: '#333333' }}
                    axisLine={{ stroke: '#333333' }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  
                  {/* Previous refresh bars (semi-transparent) */}
                  <Bar 
                    dataKey="previous"
                    fill="#808080"
                    opacity={0.5}
                    radius={[4, 4, 0, 0]}
                    onMouseEnter={(data) => setHoveredBar(data)}
                    onMouseLeave={() => setHoveredBar(null)}
                  />
                  
                  {/* Current refresh bars (opaque) */}
                  <Bar 
                    dataKey="current"
                    fill="#FFFFFF"
                    radius={[4, 4, 0, 0]}
                    onMouseEnter={(data) => setHoveredBar(data)}
                    onMouseLeave={() => setHoveredBar(null)}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No chart data available
              </div>
            )}
          </div>

          {/* Total Posts Line Chart - Only shown when expanded */}
          {isExpanded && (
            <div className="w-[30%] min-h-0 border-l border-[hsl(var(--dashboard-border))] pl-4 flex flex-col shrink-0">
              <div className="mb-3 flex-shrink-0">
                <h4 className="text-foreground text-sm font-semibold mb-2">Engagement Metrics</h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMLine(!showMLine);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                      showMLine 
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500' 
                        : 'bg-[#1C1C1C] text-muted-foreground border border-[#2A2A2A]'
                    }`}
                  >
                    Media Posts
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCLine(!showCLine);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                      showCLine 
                        ? 'bg-green-500/20 text-green-400 border border-green-500' 
                        : 'bg-[#1C1C1C] text-muted-foreground border border-[#2A2A2A]'
                    }`}
                  >
                    Normal Posts
                  </button>
                </div>
              </div>
              
              <div className="flex-1 min-h-0 overflow-hidden">
                {persistentTotalPostsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={persistentTotalPostsData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                    >
                      <XAxis 
                        dataKey="time"
                        stroke="#333333"
                        tick={{ fill: '#666666', fontSize: 9 }}
                        tickLine={{ stroke: '#333333' }}
                        axisLine={{ stroke: '#333333' }}
                      />
                      <YAxis 
                        stroke="#333333"
                        tick={{ fill: '#666666', fontSize: 9 }}
                        tickLine={{ stroke: '#333333' }}
                        axisLine={{ stroke: '#333333' }}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0, 0, 0, 0.9)',
                          border: '1px solid #333',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: '#666666' }}
                      />
                      
                      {/* Total Posts Line - always visible */}
                      <Line 
                        type="monotone"
                        dataKey="total"
                        stroke="#B0B0B0"
                        strokeWidth={2}
                        dot={{ fill: '#B0B0B0', r: 2 }}
                      />
                      
                      {/* M Line - conditionally visible */}
                      {showMLine && (
                        <Line 
                          type="monotone"
                          dataKey="m"
                          stroke="#60A5FA"
                          strokeWidth={2}
                          dot={{ fill: '#60A5FA', r: 2 }}
                        />
                      )}
                      
                      {/* C Line - conditionally visible */}
                      {showCLine && (
                        <Line 
                          type="monotone"
                          dataKey="c"
                          stroke="#4ADE80"
                          strokeWidth={2}
                          dot={{ fill: '#4ADE80', r: 2 }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No engagement data
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Metrics Section */}
        <div className={`grid ${showMembers ? 'grid-cols-3' : 'grid-cols-2'} gap-4 mt-2 pt-3 border-t border-[hsl(var(--dashboard-border))]`}>
          {/* Members - Only show if showMembers is true */}
          {showMembers && (
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-foreground">
                    {metrics.memberCount.toLocaleString()}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    Members
                  </span>
                </div>
                <div 
                  className={`text-sm font-semibold ${metrics.memberChangePercent > 0 ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}
                >
                  {metrics.memberChangePercent > 0 ? '+' : ''}{metrics.memberChangePercent.toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {/* Unique Authors */}
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-muted-foreground" />
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-foreground">
                  {metrics.uniqueAuthors.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  Unique Authors
                </span>
              </div>
              {dataSource !== 'ca' && (
                <div className={`text-sm font-semibold ${metrics.uniqueAuthorsChangePercent > 0 ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
                  {metrics.uniqueAuthorsChangePercent > 0 ? '+' : ''}{metrics.uniqueAuthorsChangePercent.toFixed(1)}%
                </div>
              )}
            </div>
          </div>

          {/* Total Posts */}
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-foreground">
                  {metrics.totalPosts.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  Total Posts
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <span>Media: <span className="text-blue-400 font-semibold">
                  {metrics.mediaCount}
                </span></span>
                <span>Normal: <span className="text-green-400 font-semibold">
                  {metrics.normalPostCount}
                </span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarGraphSection;