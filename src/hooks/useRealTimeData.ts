// hooks/useRealTimeData.ts
import { useState, useEffect, useCallback } from 'react';

interface RealTimeData {
  marketCap: any;
  holders: any;
  buysSells: any;
  walletAge: any;
  social: any;
  metrics: any;
  lastUpdate: string;
  stats: any;
  data: any;
  tokeninfo?: any;
}

const STORAGE_KEY = "realTimeData";

const useRealTimeData = () => {
  const [data, setData] = useState<RealTimeData>(() => {
    // Load from localStorage on first render
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved
      ? JSON.parse(saved)
      : {
          marketCap: null,
          holders: null,
          buysSells: null,
          walletAge: null,
          social: null,
          metrics: null,
          lastUpdate: '',
          stats: null,
          data: null,
          tokeninfo: null,
        };
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (endpoint: string) => {
    try {
      const response = await fetch(`http://localhost:5050/api/${endpoint}`);
      if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
      return await response.json();
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      return null;
    }
  }, []);

  const fetchAllData = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);

    try {
      const [
        marketCap,
        holders,
        buysSells,
        walletAge,
        social,
        metrics,
        dataResp,
        tokeninfo,
      ] = await Promise.all([
        fetchData('marketcap'),
        fetchData('holders'),
        fetchData('buys-sells'),
        fetchData('wallet-age'),
        fetchData('social'),
        fetchData('metrics'),
        fetchData('data'),
        fetchData('tokeninfo'),
      ]);

      const newData: RealTimeData = {
        marketCap,
        holders,
        buysSells,
        walletAge,
        social,
        metrics,
        data: dataResp,
        tokeninfo,
        stats: dataResp?.axiom
          ? {
              dexPaid: dataResp.axiom.dexPaid,
              bundlersHoldPercent: dataResp.axiom.bundlersHoldPercent,
              snipersHoldPercent: dataResp.axiom.snipersHoldPercent,
              top10HoldersPercent: dataResp.axiom.top10HoldersPercent,
              insidersHoldPercent: dataResp.axiom.insidersHoldPercent,
            }
          : null,
        lastUpdate: new Date().toISOString(),
      };

      setData(newData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData)); // ✅ Save to localStorage
      setError(null);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching all data:', err);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, [fetchData]);

  // Initial fetch + silent polling
  useEffect(() => {
    fetchAllData(true); // fetch with loader
    const interval = setInterval(() => fetchAllData(false), 5000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  return { data, isLoading, error, refetch: () => fetchAllData(true) };
};

export default useRealTimeData;
