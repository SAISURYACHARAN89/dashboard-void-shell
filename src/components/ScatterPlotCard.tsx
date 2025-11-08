import { useMemo, useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { Users2, Users, UserPlus, Crown, Bell, Pencil, User, CalendarDays, Clock, MessageCircle, TrendingUp, Eye, Bookmark, Repeat, Heart, MessageSquare } from 'lucide-react';
import TimeframeSelector, { Timeframe } from './TimeframeSelector';
import EditModal from './EditModal';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

interface DataPoint {
  time: string;
  followers: number;
  author: string;
  timestamp: string;
}

interface ScatterPlotCardProps {
  isExpanded?: boolean;
  isLayoutMode?: boolean;
  socialType?: string;
  dataSource?: 'ca' | 'community';
  data?: {
    author_followers: Array<{
      author: string;
      followers: number;
    }>;
    x_data?: {
      post?: any;
      profile?: any;
    };
    x_data_type?: 'post' | 'single_account';
    platform_data?: any;
    current?: any;
    history?: Array<any>;
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

// Get available metrics for current mode - MOVED OUTSIDE to avoid initialization issues
const getAvailableMetrics = (isAccount: boolean, isSingleAccount: boolean) => {
  if (isAccount || isSingleAccount) {
    return [
      { value: 'followers', label: 'Followers', color: '#2ECC71' }
    ];
  }
  return [
    { value: 'mini', label: 'Mini', color: '#8B5CF6' },
    { value: 'micro', label: 'Micro', color: '#3B82F6' },
    { value: 'macro', label: 'Macro', color: '#10B981' },
    { value: 'kol', label: 'KOL', color: '#F59E0B' }
  ];
};

const ScatterPlotCard = ({ 
  isExpanded = false, 
  isLayoutMode = false, 
  socialType = 'X Community', 
  dataSource = 'community', 
  data,
  twitterSearch
}: ScatterPlotCardProps) => {
  const isTweet = socialType === 'Tweet' && dataSource === 'community';
  const isAccount = socialType === 'Account' && dataSource === 'community';
  const isPost = !dataSource.includes('ca') && data?.x_data_type === 'post';
  const isSingleAccount = !dataSource.includes('ca') && data?.x_data_type === 'single_account';
  
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('5m');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isPresetOpen, setIsPresetOpen] = useState(false);
  const [isPresetSaved, setIsPresetSaved] = useState(false);
  
  // Alert state for all modes
  const [alerts, setAlerts] = useState<{
    mini: number[];
    micro: number[];
    macro: number[];
    kol: number[];
    followers: number[];
  }>({
    mini: [],
    micro: [],
    macro: [],
    kol: [],
    followers: []
  });

  const [tempAlertValue, setTempAlertValue] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('mini');

  // Concentration thresholds (0-100 scale) - ACTUALLY USED NOW
  const [miniMax, setMiniMax] = useState(1000);
  const [microMax, setMicroMax] = useState(10000);
  const [macroMax, setMacroMax] = useState(100000);
  const [largeMin, setLargeMin] = useState(100000);
  
  // Colors for each type
  const [miniColor, setMiniColor] = useState('#8B5CF6');
  const [microColor, setMicroColor] = useState('#3B82F6');
  const [macroColor, setMacroColor] = useState('#10B981');
  const [kolColor, setKolColor] = useState('#F59E0B');

  // Add cache state
  const [dataCache, setDataCache] = useState<{
    scatterData: DataPoint[];
    authorFollowers: any[];
    caAuthors: any[];
    lastUpdate: number;
  }>({
    scatterData: [],
    authorFollowers: [],
    caAuthors: [],
    lastUpdate: 0
  });

  // Cache duration (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Extract data based on type with proper CA handling
  const authorFollowers = data?.author_followers ?? [];

  // Handle CA mode author data properly (accept twitterSearch prop OR search metrics inside `data`)
  const caAuthors = useMemo(() => {
    const rawSearch =
      twitterSearch ||
      (data as any)?.twitterSearch ||
      (data as any)?.search_metrics ||
      (data as any)?.searchMetrics ||
      null;

    const uniqueAuthorsObj =
      rawSearch?.unique_authors ?? rawSearch?.uniqueAuthors ?? {};

    if (rawSearch && (rawSearch.success || Object.keys(uniqueAuthorsObj || {}).length > 0)) {
      return Object.entries(uniqueAuthorsObj).map(([username, u]: any) => ({
        author: username,
        author_name: (u && (u.name ?? u.author_name)) || username,
        followers: Number(u?.followers_count ?? u?.followers ?? 0) || 0
      }));
    }
    return []; // return empty array (not null) to simplify downstream logic
  }, [twitterSearch, data]);

  // Update cache when new valid data arrives
  useEffect(() => {
    const now = Date.now();
    
    // Check if we have valid new data to cache
    const hasValidAuthorData = authorFollowers && authorFollowers.length > 0;
    const hasValidCAData = dataSource === 'ca' && caAuthors && caAuthors.length > 0;
    
    if (hasValidAuthorData || hasValidCAData) {
      // Generate new scatter data
      const newScatterData = generateScatterData();
      
      if (newScatterData.length > 0) {
        setDataCache({
          scatterData: newScatterData,
          authorFollowers: hasValidAuthorData ? [...authorFollowers] : dataCache.authorFollowers,
          caAuthors: hasValidCAData ? [...caAuthors] : dataCache.caAuthors,
          lastUpdate: now
        });
      }
    }
  }, [authorFollowers, caAuthors, dataSource]);

  // Function to generate scatter data
  const generateScatterData = (): DataPoint[] => {
    // CA mode: convert unique_authors into scatter points
    if (dataSource === 'ca' && caAuthors && caAuthors.length > 0) {
      // distribute times slightly so points are visible across x axis
      return caAuthors.map((item, index) => ({
        time: `${9 + (index % 8)}:00`,
        followers: Number(item.followers) || 0,
        author: item.author,
        author_name: item.author_name,
        timestamp: `${9 + (index % 8)}:00 • Recent`
      }));
    }

    // Community/post/single account mode
    if ((dataSource === 'community' || isPost || isSingleAccount) && (authorFollowers || []).length > 0) {
      return (authorFollowers || []).map((item: any, index: number) => ({
        time: `${Math.floor(index / ((authorFollowers?.length || 1) / 8)) + 9}:00`,
        followers: item.followers,
        author: item.author_name || item.author,
        timestamp: `${Math.floor(index / ((authorFollowers?.length || 1) / 8)) + 9}:00 • Recent`
      }));
    }

    // Empty state
    return [];
  };

  // Check if cache is still valid
  const isCacheValid = useMemo(() => {
    return Date.now() - dataCache.lastUpdate < CACHE_DURATION;
  }, [dataCache.lastUpdate]);

  // Use cached data when current data is empty, otherwise use current data
  const persistentScatterData = useMemo(() => {
    const currentData = generateScatterData();
    
    // If we have current data, use it
    if (currentData && currentData.length > 0) {
      return currentData;
    }
    
    // If no current data but cache is valid, use cached data
    if (isCacheValid && dataCache.scatterData.length > 0) {
      return dataCache.scatterData;
    }
    
    // Otherwise return empty array
    return [];
  }, [generateScatterData, isCacheValid, dataCache.scatterData]);

  // Use CA data when in CA mode, fallback to community data with persistence
  const sourceAuthors = useMemo(() => {
    if (dataSource === 'ca') {
      // For CA mode, use current data if available, otherwise cached data
      if (caAuthors && caAuthors.length > 0) {
        return caAuthors;
      }
      if (isCacheValid && dataCache.caAuthors.length > 0) {
        return dataCache.caAuthors;
      }
      return [];
    } else {
      // For community mode, use current data if available, otherwise cached data
      if (authorFollowers && authorFollowers.length > 0) {
        return authorFollowers;
      }
      if (isCacheValid && dataCache.authorFollowers.length > 0) {
        return dataCache.authorFollowers;
      }
      return [];
    }
  }, [dataSource, caAuthors, authorFollowers, isCacheValid, dataCache.caAuthors, dataCache.authorFollowers]);

  // Extract post data if available
  const postData = data?.x_data?.post;
  const profileData = data?.x_data?.profile;
  const platformData = data?.platform_data;
  const currentMetrics = data?.current;
  const historyMetrics = data?.history || [];

  // Helper functions with proper error handling
  const calculateAccountAge = (createdAt: string): string => {
    if (!createdAt) return 'Unknown';
    try {
      const created = new Date(createdAt);
      const now = new Date();
      const diffYears = now.getFullYear() - created.getFullYear();
      return `${diffYears} years`;
    } catch (error) {
      return 'Unknown';
    }
  };

  const calculateTimeAgo = (createdAt: string): string => {
    if (!createdAt) return 'Unknown';
    try {
      const created = new Date(createdAt);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
      return `${diffHours} hours`;
    } catch (error) {
      return 'Unknown';
    }
  };

  const formatNumber = (num: number): string => {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const calculateFollowerChange = (): number => {
    if (!historyMetrics || historyMetrics.length < 2) return 0;
    try {
      const current = currentMetrics?.memberCount || 0;
      const previous = historyMetrics[historyMetrics.length - 2]?.memberCount || 0;
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    } catch (error) {
      return 0;
    }
  };

  // FIXED: Get follower type using ACTUAL threshold values
  const getFollowerType = (followers: number): string => {
    if (followers < miniMax) return 'mini';
    if (followers < microMax) return 'micro';
    if (followers < macroMax) return 'macro';
    return 'kol';
  };

  // FIXED: Get color using ACTUAL color state values
  const getColorByType = (followers: number): string => {
    const type = getFollowerType(followers);
    switch (type) {
      case 'mini': return miniColor;
      case 'micro': return microColor;
      case 'macro': return macroColor;
      case 'kol': return kolColor;
      default: return '#00FFFF';
    }
  };

  // Get owner data based on data type with proper fallbacks
  const getOwnerData = () => {
    if (isPost && postData) {
      const user = postData.user || {};
      return {
        name: `@${user.screen_name || 'Unknown'}`,
        accountAge: calculateAccountAge(user.created_at),
        followers: formatNumber(user.followers_count || 0),
        tweetAge: calculateTimeAgo(postData.created_at),
        followerChange: 0, // Not applicable for posts
        posts: formatNumber(user.statuses_count || 0),
        tweetMetrics: {
          likes: postData.favorite_count || 0,
          retweets: postData.retweet_count || 0,
          quotes: postData.quote_count || 0,
          replies: postData.reply_count || 0,
          views: parseInt(postData.views_count) || 0,
          bookmarks: postData.bookmark_count || 0
        }
      };
    }
    
    if (isSingleAccount && profileData) {
      const followerChange = calculateFollowerChange();
      return {
        name: `@${profileData.screen_name || 'Unknown'}`,
        accountAge: calculateAccountAge(profileData.created_at),
        followers: formatNumber(profileData.followers_count || 0),
        followerChange: followerChange,
        posts: formatNumber(profileData.statuses_count || 0),
        postChange: 0, // You might want to calculate this from history
        tweetMetrics: {
          likes: currentMetrics?.likes || 0,
          retweets: currentMetrics?.retweets || 0,
          quotes: currentMetrics?.quotes || 0,
          replies: currentMetrics?.replies || 0,
          views: currentMetrics?.views || 0,
          bookmarks: currentMetrics?.bookmarks || 0
        }
      };
    }

    // Fallback to mock data
    return {
      name: '@elonmusk',
      accountAge: '15 years',
      followers: '180M',
      tweetAge: '2 hours',
      followerChange: 0,
      posts: '3,247',
      postChange: 0,
      tweetMetrics: {
        likes: 6,
        retweets: 2,
        quotes: 3,
        replies: 8,
        views: 1196,
        bookmarks: 1
      }
    };
  };

  const ownerData = getOwnerData();

  // FIXED: Count categories using ACTUAL threshold values with persistent data
  const miniCount = (sourceAuthors || []).filter((f: any) => (Number(f.followers) || 0) < miniMax).length;
  const microCount = (sourceAuthors || []).filter((f: any) => {
    const v = Number(f.followers) || 0;
    return v >= miniMax && v < microMax;
  }).length;
  const macroCount = (sourceAuthors || []).filter((f: any) => {
    const v = Number(f.followers) || 0;
    return v >= microMax && v < macroMax;
  }).length;
  const largeCount = (sourceAuthors || []).filter((f: any) => (Number(f.followers) || 0) >= largeMin).length;

  // Update max follower count calculation with persistent data
  const maxFollowerCount = useMemo(() => {
    if (!sourceAuthors || sourceAuthors.length === 0) return 50000;
    return Math.max(...sourceAuthors.map((f: any) => Number(f.followers) || 0));
  }, [sourceAuthors]);

  // Check for triggered alerts
  const triggeredAlerts = useMemo(() => {
    const currentValues = {
      mini: miniCount,
      micro: microCount,
      macro: macroCount,
      kol: largeCount,
      followers: parseInt(ownerData.followers.replace(/[KM]/g, '')) * (ownerData.followers.includes('M') ? 1000000 : 1000) || 0
    };

    const triggered: string[] = [];
    
    Object.entries(alerts).forEach(([metric, alertValues]) => {
      alertValues.forEach(alertValue => {
        if (currentValues[metric as keyof typeof currentValues] >= alertValue) {
          triggered.push(`${metric}: ${alertValue}`);
        }
      });
    });

    return triggered;
  }, [miniCount, microCount, macroCount, largeCount, ownerData.followers, alerts]);

  // Follower growth data for Account type (line chart) - using actual history data
  const followerGrowthData = useMemo(() => {
    if (!isAccount && !isSingleAccount) return [];
    
    // Use actual history data if available
    if (historyMetrics && historyMetrics.length > 0) {
      return historyMetrics.map((metric, index) => ({
        time: metric.time || `${9 + index}:00`,
        followers: metric.memberCount || 0,
      }));
    }
    
    // Fallback to mock data
    const times = isExpanded
      ? ['8:00', '8:30', '9:00', '9:15', '9:30', '9:45', '10:00', '10:15', '10:30', '10:45', '11:00', '11:30']
      : ['9:00', '9:15', '9:30', '9:45', '10:00', '10:15', '10:30', '10:45'];
    
    let baseFollowers = 40000;
    return times.map((time) => {
      baseFollowers += Math.floor(Math.random() * 800) + 200;
      return {
        time,
        followers: baseFollowers,
      };
    });
  }, [isExpanded, timeframe, isAccount, isSingleAccount, historyMetrics]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length && hoveredPoint) {
      return (
        <div 
          className="px-4 py-3 rounded-lg animate-fade-in"
          style={{ 
            background: 'rgba(10, 10, 10, 0.95)',
            border: '1px solid #2ECC71'
          }}
        >
          <div className="text-white font-bold text-sm mb-1">
            {hoveredPoint.author}
          </div>
          <div className="text-white text-xs mb-1">
            {(hoveredPoint.followers / 1000).toFixed(1)}k followers
          </div>
          <div className="text-muted-foreground text-xs">
            {hoveredPoint.timestamp}
          </div>
        </div>
      );
    }
    return null;
  };

  const formatYAxis = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toString();
  };

  // Render tweet metrics section
  // const renderTweetMetrics = () => (
  //   <div className="grid grid-cols-3 gap-2 mt-3">
  //     <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0A0A0A] border border-[hsl(var(--dashboard-border))]">
  //       <Heart className="w-3 h-3 text-red-400" />
  //       <div>
  //         <div className="text-xs font-bold text-foreground">{ownerData.tweetMetrics.likes}</div>
  //         <div className="text-[10px] text-muted-foreground">Likes</div>
  //       </div>
  //     </div>
  //     <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0A0A0A] border border-[hsl(var(--dashboard-border))]">
  //       <Repeat className="w-3 h-3 text-green-400" />
  //       <div>
  //         <div className="text-xs font-bold text-foreground">{ownerData.tweetMetrics.retweets}</div>
  //         <div className="text-[10px] text-muted-foreground">Retweets</div>
  //       </div>
  //     </div>
  //     <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0A0A0A] border border-[hsl(var(--dashboard-border))]">
  //       <MessageSquare className="w-3 h-3 text-blue-400" />
  //       <div>
  //         <div className="text-xs font-bold text-foreground">{ownerData.tweetMetrics.replies}</div>
  //         <div className="text-[10px] text-muted-foreground">Replies</div>
  //       </div>
  //     </div>
  //     <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0A0A0A] border border-[hsl(var(--dashboard-border))]">
  //       <MessageCircle className="w-3 h-3 text-purple-400" />
  //       <div>
  //         <div className="text-xs font-bold text-foreground">{ownerData.tweetMetrics.quotes}</div>
  //         <div className="text-[10px] text-muted-foreground">Quotes</div>
  //       </div>
  //     </div>
  //     <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0A0A0A] border border-[hsl(var(--dashboard-border))]">
  //       <Eye className="w-3 h-3 text-yellow-400" />
  //       <div>
  //         <div className="text-xs font-bold text-foreground">{formatNumber(ownerData.tweetMetrics.views)}</div>
  //         <div className="text-[10px] text-muted-foreground">Views</div>
  //       </div>
  //     </div>
  //     <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0A0A0A] border border-[hsl(var(--dashboard-border))]">
  //       <Bookmark className="w-3 h-3 text-cyan-400" />
  //       <div>
  //         <div className="text-xs font-bold text-foreground">{ownerData.tweetMetrics.bookmarks}</div>
  //         <div className="text-[10px] text-muted-foreground">Bookmarks</div>
  //       </div>
  //     </div>
  //   </div>
  // );

  // FIXED: Safe handling of followerChange with proper null checks
  const displayFollowerChange = ownerData.followerChange || 0;
  const shouldShowFollowerChange = displayFollowerChange !== 0 && !isNaN(displayFollowerChange);

  const availableMetrics = getAvailableMetrics(isAccount, isSingleAccount);
  const hasAlerts = Object.values(alerts).some(alertArray => alertArray.length > 0);

  return (
    <div 
      className="border border-[hsl(var(--dashboard-border))] rounded-2xl p-6 h-full transition-all duration-300 hover:scale-[1.01] relative"
      style={{
        background: 'linear-gradient(180deg, #0D0D0D 0%, #121212 100%)'
      }}
    >
      {/* Cache Status Indicator */}
      {!isCacheValid && dataCache.scatterData.length > 0 && (
        <div className="absolute top-2 left-2 z-10">
          <div className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded border border-yellow-500/30 inline-flex items-center gap-1">
            <span>Showing cached data</span>
          </div>
        </div>
      )}

      {/* Alert & Preset Buttons & Timeframe Selector */}
      {!isLayoutMode && !isTweet && (
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
          {!(isAccount || isSingleAccount) && (
            <button
              onClick={() => setIsPresetOpen(true)}
              className={`transition-colors ${isPresetSaved ? 'text-[#8A2BE2] hover:text-[#8A2BE2]/80' : 'text-[#AAAAAA] hover:text-white'}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {/* <TimeframeSelector value={timeframe} onChange={setTimeframe} /> */}
        </div>
      )}

      {/* Alert Modal */}
      <EditModal
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        title={(isAccount || isSingleAccount) ? "Follower Alerts" : "KOL Concentration Alerts"}
      >
        <div className="space-y-6">
          {/* Clear All Button */}
          {hasAlerts && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setAlerts({
                  mini: [],
                  micro: [],
                  macro: [],
                  kol: [],
                  followers: []
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
                      <Label className="text-sm" style={{ color: metric.color }}>{metric.label} Alerts</Label>
                      <span className="text-xs text-muted-foreground">{timeframe}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {alerts[metric.value as keyof typeof alerts].map((alertValue, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium flex items-center gap-2 border border-purple-500/30"
                        >
                          <span>{alertValue}</span>
                          <button
                            onClick={() => {
                              setAlerts(prev => ({
                                ...prev,
                                [metric.value]: prev[metric.value as keyof typeof alerts].filter((_, i) => i !== idx)
                              }));
                            }}
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
                  onClick={() => {
                    const value = parseInt(tempAlertValue);
                    if (value && value > 0) {
                      const currentAlerts = alerts[selectedMetric as keyof typeof alerts];
                      if (!currentAlerts.includes(value)) {
                        setAlerts(prev => ({
                          ...prev,
                          [selectedMetric]: [...currentAlerts, value].sort((a, b) => a - b)
                        }));
                        setTempAlertValue('');
                      }
                    }
                  }}
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
                {selectedMetric === 'followers' 
                  ? ownerData.followers 
                  : selectedMetric === 'mini' ? miniCount :
                    selectedMetric === 'micro' ? microCount :
                    selectedMetric === 'macro' ? macroCount : largeCount
                } {availableMetrics.find(m => m.value === selectedMetric)?.label}
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

      {/* Preset Modal */}
      <EditModal
        isOpen={isPresetOpen}
        onClose={() => setIsPresetOpen(false)}
        title="KOL Concentration Settings"
      >
        <div className="space-y-5">
         
          <div className="space-y-6">
            {/* Mini Concentration */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm text-foreground">Mini Concentration (Max)</Label>
                <Input
                  type="color"
                  value={miniColor}
                  onChange={(e) => setMiniColor(e.target.value)}
                  className="w-10 h-10 p-1 bg-[#1A1F2C] border-[#1E1E1E] cursor-pointer"
                />
              </div>
              <Input
                type="number"
                value={miniMax}
                onChange={(e) => setMiniMax(e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                className="bg-[#1A1F2C] border-[#1E1E1E]"
                placeholder="Enter max value"
              />
              <p className="text-xs text-muted-foreground mt-1">Range: 0 - {miniMax.toLocaleString()} followers</p>
            </div>

            {/* Micro Concentration */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm text-foreground">Micro Concentration (Max)</Label>
                <Input
                  type="color"
                  value={microColor}
                  onChange={(e) => setMicroColor(e.target.value)}
                  className="w-10 h-10 p-1 bg-[#1A1F2C] border-[#1E1E1E] cursor-pointer"
                />
              </div>
              <Input
                type="number"
                value={microMax}
                onChange={(e) => setMicroMax(e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                className="bg-[#1A1F2C] border-[#1E1E1E]"
                placeholder="Enter max value"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Min required: {(miniMax + 1).toLocaleString()} | Range: {miniMax.toLocaleString()} - {microMax.toLocaleString()} followers
              </p>
            </div>

            {/* Macro Concentration */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm text-foreground">Macro Concentration (Max)</Label>
                <Input
                  type="color"
                  value={macroColor}
                  onChange={(e) => setMacroColor(e.target.value)}
                  className="w-10 h-10 p-1 bg-[#1A1F2C] border-[#1E1E1E] cursor-pointer"
                />
              </div>
              <Input
                type="number"
                value={macroMax}
                onChange={(e) => setMacroMax(e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                className="bg-[#1A1F2C] border-[#1E1E1E]"
                placeholder="Enter max value"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Min required: {(microMax + 1).toLocaleString()} | Range: {microMax.toLocaleString()} - {macroMax.toLocaleString()} followers
              </p>
            </div>

            {/* Large/KOL Concentration */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm text-foreground">Large/KOL Concentration (Min)</Label>
                <Input
                  type="color"
                  value={kolColor}
                  onChange={(e) => setKolColor(e.target.value)}
                  className="w-10 h-10 p-1 bg-[#1A1F2C] border-[#1E1E1E] cursor-pointer"
                />
              </div>
              <Input
                type="number"
                value={largeMin}
                onChange={(e) => setLargeMin(e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                className="bg-[#1A1F2C] border-[#1E1E1E]"
                placeholder="Enter min value"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Min required: {(macroMax + 1).toLocaleString()} | Range: {macroMax.toLocaleString()}+ followers
              </p>
            </div>
          </div>

          {/* <Button 
            className="w-full" 
            onClick={() => { setIsPresetSaved(true); setIsPresetOpen(false); }}
            disabled={microMax <= miniMax || macroMax <= microMax || largeMin <= macroMax}
          >
            Save Changes
          </Button> */}
        </div>
      </EditModal>

      <div className="flex flex-col h-full">
        {/* Title */}
        <div className="mb-2">
          <h3 className="text-foreground text-base font-semibold">
            {dataSource === 'ca' 
              ? 'KOL Distribution' 
              : (isTweet || isPost 
                ? 'Post Details' 
                : (isAccount || isSingleAccount 
                  ? 'Account Details' 
                  : 'KOL Concentration'))}
          </h3>
          <p className="text-muted-foreground text-xs mt-0.5">
            {dataSource === 'ca'
              ? 'Author distribution by follower count from search results'
              : isTweet || isPost
                ? 'Information about the post author and engagement metrics'
                : isAccount || isSingleAccount
                  ? 'Account follower metrics and age information'
                  : isExpanded 
                    ? 'Extended author distribution by follower count with detailed segmentation' 
                    : 'Author distribution by follower count'}
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

        {(isTweet || isPost) ? (
          /* Post/Tweet Owner Details */
          <div className="flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-3 w-full px-1">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0A0A0A] border border-[hsl(var(--dashboard-border))]">
                <User className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Author</div>
                  <div className="text-sm font-bold text-foreground truncate">{ownerData.name}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0A0A0A] border border-[hsl(var(--dashboard-border))]">
                <CalendarDays className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Account Age</div>
                  <div className="text-sm font-bold text-foreground">{ownerData.accountAge}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0A0A0A] border border-[hsl(var(--dashboard-border))]">
                <Users className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Followers</div>
                  <div className="text-sm font-bold text-foreground">{ownerData.followers}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0A0A0A] border border-[hsl(var(--dashboard-border))]">
                <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Post Age</div>
                  <div className="text-sm font-bold text-foreground">{ownerData.tweetAge}</div>
                </div>
              </div>
            </div>
            
            {/* Tweet Metrics */}
            {/* {renderTweetMetrics()} */}
          </div>
        ) : (isAccount || isSingleAccount) ? (
          /* Account Owner Details with Full Width Follower Graph */
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            {/* Account Info Cards */}
            <div className="grid grid-cols-3 gap-3 px-1 flex-shrink-0">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0A0A0A] border border-[hsl(var(--dashboard-border))]">
                <User className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Account</div>
                  <div className="text-sm font-bold text-foreground truncate">{ownerData.name}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0A0A0A] border border-[hsl(var(--dashboard-border))]">
                <CalendarDays className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Account Age</div>
                  <div className="text-sm font-bold text-foreground">{ownerData.accountAge}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0A0A0A] border border-[hsl(var(--dashboard-border))]">
                <Users className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Followers</div>
                  <div className="text-sm font-bold text-foreground">{ownerData.followers}</div>
                </div>
              </div>
            </div>

            {/* Full Width Follower Growth Graph */}
            <div 
              className="flex-1 px-1 min-h-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3 rounded-lg bg-[#0A0A0A] border border-[hsl(var(--dashboard-border))] flex flex-col h-full min-h-0">
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Follower Growth</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{ownerData.followers}</span>
                    {shouldShowFollowerChange && (
                      <span className={`text-xs font-semibold ${displayFollowerChange > 0 ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
                        {displayFollowerChange > 0 ? '+' : ''}{displayFollowerChange.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={followerGrowthData}
                      margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                    >
                      <XAxis 
                        dataKey="time"
                        stroke="#666666"
                        tick={{ fill: '#666666', fontSize: 9 }}
                        tickLine={{ stroke: '#333333' }}
                        axisLine={{ stroke: '#333333' }}
                      />
                      <YAxis 
                        stroke="#666666"
                        tick={{ fill: '#666666', fontSize: 9 }}
                        tickLine={{ stroke: '#333333' }}
                        axisLine={{ stroke: '#333333' }}
                        tickFormatter={formatYAxis}
                        width={35}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0, 0, 0, 0.9)',
                          border: '1px solid #2ECC71',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: '#FFFFFF' }}
                      />
                      <Line 
                        type="monotone"
                        dataKey="followers"
                        stroke="#2ECC71"
                        strokeWidth={2}
                        dot={{ fill: '#2ECC71', r: 2 }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Scatter Plot for Community */}
            <div className="flex-1 min-h-0 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 10, right: 25, bottom: 5, left: 25 }}
                >
                  <XAxis 
                    dataKey="time"
                    type="category"
                    allowDuplicatedCategory={false}
                    stroke="#666666"
                    tick={{ fill: '#666666', fontSize: 11 }}
                    tickLine={{ stroke: '#333333' }}
                    axisLine={{ stroke: '#333333' }}
                  />
                  <YAxis 
                    dataKey="followers"
                    type="number"
                    stroke="#666666"
                    tick={{ fill: '#666666', fontSize: 11 }}
                    tickLine={{ stroke: '#333333' }}
                    axisLine={{ stroke: '#333333' }}
                    tickFormatter={formatYAxis}
                    domain={[0, maxFollowerCount + maxFollowerCount * 0.1]}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ strokeDasharray: '3 3', stroke: '#333333' }}
                  />
                  <Scatter
                    data={persistentScatterData}
                    fill="#00FFFF"
                    onMouseEnter={(data) => setHoveredPoint(data as DataPoint)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {persistentScatterData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getColorByType(entry.followers)}
                        opacity={0.8}
                        r={hoveredPoint === entry ? 2 : 0.8}
                        style={{ 
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom Metrics Section */}
            <div className="flex items-center justify-between gap-3 mt-2 pt-3 border-t border-[hsl(var(--dashboard-border))]">
              {/* Mini (<1k) */}
              <div className="flex items-center gap-2">
                <Users2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-lg font-bold text-foreground">
                    {miniCount}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
                    Mini
                  </div>
                </div>
              </div>

              {/* Micro (1k-10k) */}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-lg font-bold text-foreground">
                    {microCount}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
                    Micro
                  </div>
                </div>
              </div>

              {/* Macro (10k-100k) */}
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-lg font-bold text-foreground">
                    {macroCount}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
                    Macro
                  </div>
                </div>
              </div>

              {/* Large (>100k) */}
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-lg font-bold text-foreground">
                    {largeCount}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
                    Large
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ScatterPlotCard;