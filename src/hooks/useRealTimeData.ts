// --- 3) useRealTimeData.ts — real data hook with optional active contract support ---

import { useState, useEffect, useCallback } from "react";

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
  twitterSearch?: {
    total_posts_count: number;
    total_media_posts_count: number;
    total_normal_posts_count: number;
    unique_authors_count: number;
    unique_authors: Record<string, { name: string; followers_count: number }>;
    success: boolean;
  };
  x_data_type?: "community" | "single_account" | "post";
  key?: string;
}

const STORAGE_KEY = "realTimeData";
const ACTIVE_CONTRACT_KEY = "activeContract";

type Options = {
  baseUrl?: string;           // e.g. "http://localhost:5050"
};

export default function useRealTimeData(opts?: Options) {
  const baseUrl = (opts?.baseUrl || "http://localhost:5050").replace(/\/+$/,"");

  const [activeContract, setActiveContract] = useState<string | null>(() =>
    localStorage.getItem(ACTIVE_CONTRACT_KEY)
  );

  const [data, setData] = useState<RealTimeData>(() => {
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
          lastUpdate: "",
          stats: null,
          data: null,
          tokeninfo: null,
          twitterSearch: {
            total_posts_count: 0,
            total_media_posts_count: 0,
            total_normal_posts_count: 0,
            unique_authors_count: 0,
            unique_authors: {},
            success: false
          },
          x_data_type: undefined,
          key: undefined
        };
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJson = useCallback(async (path: string) => {
    try {
      const res = await fetch(`${baseUrl}/api/${path}`);
      if (!res.ok) throw new Error(`GET ${path} ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error(`Error fetching ${path}`, e);
      return null;
    }
  }, [baseUrl]);

  // Optional: tell backend which contract to use
  const selectContract = useCallback(async (contract: string) => {
    const trimmed = contract.trim();
    if (!trimmed) return false;

    try {
      // If your backend supports it, inform server of the active contract
      await fetch(`${baseUrl}/api/select-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contract: trimmed })
      }).catch(() => {}); // it's okay if you don't have this endpoint

      localStorage.setItem(ACTIVE_CONTRACT_KEY, trimmed);
      setActiveContract(trimmed);
      return true;
    } catch (e) {
      console.error("selectContract failed", e);
      return false;
    }
  }, [baseUrl]);

  const fetchAll = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const [
        marketCap, holders, buysSells, walletAge, social, metrics,
        dataResp, tokeninfo, twitterSearch, xDataResp
      ] = await Promise.all([
        fetchJson("marketcap"),
        fetchJson("holders"),
        fetchJson("buys-sells"),
        fetchJson("wallet-age"),
        fetchJson("social"),
        fetchJson("metrics"),
        fetchJson("data"),
        fetchJson("tokeninfo"),
        fetchJson("twitter-search"),
        fetchJson("x-data")
      ]);

      const twitterSearchNormalized = (twitterSearch && typeof twitterSearch === "object")
        ? {
            total_posts_count: twitterSearch.total_posts_count ?? 0,
            total_media_posts_count: twitterSearch.total_media_posts_count ?? 0,
            total_normal_posts_count: twitterSearch.total_normal_posts_count ?? 0,
            unique_authors_count: twitterSearch.unique_authors_count ?? 0,
            unique_authors: (twitterSearch.unique_authors && typeof twitterSearch.unique_authors === "object")
              ? Object.fromEntries(
                  Object.entries<any>(twitterSearch.unique_authors).map(([k, v]) => [
                    k,
                    { name: v?.name ?? "", followers_count: Number(v?.followers_count || v?.followers || 0) || 0 }
                  ])
                )
              : {},
            success: Boolean(
              twitterSearch.success ||
              (twitterSearch.unique_authors && Object.keys(twitterSearch.unique_authors || {}).length > 0) ||
              (twitterSearch.unique_authors_count && twitterSearch.unique_authors_count > 0)
            )
          }
        : {
            total_posts_count: 0,
            total_media_posts_count: 0,
            total_normal_posts_count: 0,
            unique_authors_count: 0,
            unique_authors: {},
            success: false
          };

      const newState: RealTimeData = {
        marketCap, holders, buysSells, walletAge, social, metrics,
        data: dataResp, tokeninfo,
        twitterSearch: twitterSearchNormalized,
        x_data_type: xDataResp?.x_data_type,
        key: xDataResp?.key,
        stats: dataResp?.axiom
          ? {
              dexPaid: dataResp.axiom.dexPaid,
              bundlersHoldPercent: dataResp.axiom.bundlersHoldPercent,
              snipersHoldPercent: dataResp.axiom.snipersHoldPercent,
              top10HoldersPercent: dataResp.axiom.top10HoldersPercent,
              insidersHoldPercent: dataResp.axiom.insidersHoldPercent
            }
          : null,
        lastUpdate: new Date().toISOString()
      };

      setData(newState);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      setError(null);
    } catch (e) {
      console.error("fetchAll failed", e);
      setError("Failed to fetch data");
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, [fetchJson]);

  useEffect(() => {
    fetchAll(true);
    const id = setInterval(() => fetchAll(false), 5000);
    return () => clearInterval(id);
  }, [fetchAll]);

  return {
    data,
    isLoading,
    error,
    refetch: () => fetchAll(true),
    activeContract,
    selectContract
  };
}
