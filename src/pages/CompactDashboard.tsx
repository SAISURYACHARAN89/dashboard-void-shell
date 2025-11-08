import React, { useEffect, useState, useRef } from "react";
import WalletAgePlanetMapCard from "@/components/WalletAgePlanetMapCard";
import {
  Eye,
  Heart,
  Copy,
  Search,
  Clock,
  Users,
  Bell,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import classNames from "classnames";
import { MdOutlineGroup } from "react-icons/md";
import { GiHumanTarget } from "react-icons/gi";
import { TfiLayoutMediaCenterAlt } from "react-icons/tfi";

type CoinItem = {
  id: string;
  name: string;
  contract?: string;
  views?: number;
  likes?: number;
  members?: number;
  users?: number;
  posts?: number;
  kol?: number[];
};

interface Alert {
  id: string;
  coinName: string;
  metricName: string;
  threshold: number;
  currentValue: number;
  timestamp: string;
}

const sampleCoins = [
  { id: "bnb", name: "BNB", views: 278, likes: 18, members: 19, users: 7, posts: 12, kol: [999, 2, 1, 1] },
  { id: "xyz", name: "XYZ", views: 112, likes: 8, members: 8, users: 4, posts: 3, kol: [1, 1, 0, 0] },
  { id: "okny", name: "OKNY", views: 256, likes: 24, members: 5, users: 2, posts: 6, kol: [0, 1, 2, 0] },
];

export default function CompactDashboard() {
  const [coins, setCoins] = useState<CoinItem[]>(() => [...sampleCoins]);
  const [selected, setSelected] = useState<CoinItem | null>(() => (sampleCoins.length ? sampleCoins[0] : null));
  const [inputValue, setInputValue] = useState("");
  const [selectedToggle, setSelectedToggle] = useState<"community" | "search">("community");
  const [showAlerts, setShowAlerts] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const addCoinFromContract = (contract: string) => {
    const trimmed = contract.trim();
    if (!trimmed) return;
    if (coins.length >= 8) return;

    const short = trimmed.length > 10 ? `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}` : trimmed;
    const id = short.toLowerCase().replace(/[^a-z0-9]/g, "");
    const newCoin: CoinItem = {
      id: id || `c${Date.now()}`,
      name: short.toUpperCase(),
      contract: trimmed,
      views: Math.floor(Math.random() * 400),
      likes: Math.floor(Math.random() * 100),
      members: Math.floor(Math.random() * 50),
      users: Math.floor(Math.random() * 20),
      posts: Math.floor(Math.random() * 30),
      kol: [
        Math.floor(Math.random() * 3),
        Math.floor(Math.random() * 3),
        Math.floor(Math.random() * 3),
        Math.floor(Math.random() * 3),
      ],
    };
    setCoins((prev) => [...prev, newCoin].slice(-8));
    setSelected(newCoin);
  };

  const handleInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      addCoinFromContract(inputValue);
      setInputValue("");
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (text && text.length > 3) {
      setTimeout(() => {
        addCoinFromContract(text);
        setInputValue("");
      }, 50);
      e.preventDefault();
    }
  };

  const handleCopy = async () => {
    if (!selected?.contract && !inputRef.current?.value) return;
    const text = selected?.contract ?? inputRef.current?.value ?? "";
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("copy failed", err);
    }
  };

  const handleCoinClick = (c: CoinItem) => setSelected(c);
  const handleCoinDoubleClick = (c: CoinItem) => {
    setCoins((prev) => prev.filter((coin) => coin.id !== c.id));
    if (selected?.id === c.id) setSelected(coins[0] || null);
  };

  const kolColors = ["#f6c85f", "#f29f4b", "#f07a3b", "#ef4636"];

  useEffect(() => {
    if (!selected && coins.length) setSelected(coins[0]);
    if (selected) {
      const exists = coins.find((c) => c.id === selected.id);
      if (!exists && coins.length) setSelected(coins[0]);
    }

    // Load alerts from localStorage
    const saved = localStorage.getItem("dashboard-alerts");
    if (saved) setAlerts(JSON.parse(saved));
  }, [coins, selected]);

  // 🔔 Alerts View
  if (showAlerts) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] text-white p-4 w-[320px]">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setShowAlerts(false)}
            className="p-2 hover:bg-[rgba(255,255,255,0.04)] rounded-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Alert Notifications</h1>
        </div>

        <div className="space-y-2 max-w-2xl mx-auto">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Bell className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>No alerts yet</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-[rgba(255,255,255,0.02)] p-4 rounded-md border border-[rgba(255,255,255,0.04)]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{alert.coinName}</h3>
                    <p className="text-sm text-gray-400">
                      {alert.metricName} reached {alert.threshold.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-500">
                      {alert.currentValue.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // 🧭 Main Dashboard
  return (
    <div className="p-2 w-[320px] max-w-[320px] h-[400px] bg-[#0b0b0c] text-white rounded-lg overflow-hidden flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center gap-2">
  {/* Bigger Logo */}
  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
    <img
      src="/klux-logo.png"
      alt="Klux Logo"
      className="w-full h-full object-contain rounded-sm"
    />
  </div>

  {/* Input */}
  <div className="flex-1 relative">
    <input
      ref={inputRef}
      onPaste={handlePaste}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onKeyDown={handleInputKey}
      placeholder="Paste contract..."
      className="w-full bg-[#0f0f10] border border-[rgba(255,255,255,0.06)] rounded-md py-1 px-2 text-xs placeholder:opacity-60"
    />
  </div>

  {/* Search Icon (smaller container to reduce width) */}
  <div className="p-1.5 rounded-md bg-[#0f0f10] border border-[rgba(255,255,255,0.04)] flex-shrink-0">
    <Search className="h-3 w-3 text-green-400" />
  </div>

  {/* Copy button */}
  <button
    onClick={handleCopy}
    className="p-1.5 rounded-md bg-[#0f0f10] border border-[rgba(255,255,255,0.04)] flex-shrink-0"
  >
    <Copy className="h-3 w-3" />
  </button>
</div>


      {/* Coins Grid */}
      <div className="bg-[rgba(255,255,255,0.02)] p-1.5 rounded-md grid grid-cols-4 gap-1.5 max-h-[72px] overflow-y-auto">
        {coins.map((c) => (
          <button
            key={c.id}
            onClick={() => handleCoinClick(c)}
            onDoubleClick={() => handleCoinDoubleClick(c)}
            className={classNames(
              "flex-none px-2 py-0.5 rounded-md text-xs border whitespace-nowrap overflow-hidden text-ellipsis",
              selected?.id === c.id
                ? "bg-green-500 text-black border-green-500"
                : "bg-transparent text-white border-[rgba(255,255,255,0.04)]"
            )}
            title="Double click to remove"
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Main Data */}
      <div className="flex gap-2">
        <div className="flex-1">
          <div className="bg-[rgba(255,255,255,0.02)] rounded-md p-1.5 h-[150px]">
            <WalletAgePlanetMapCard isLayoutMode={true} isExpanded={false} isExtension={true} data={{}} />
          </div>
        </div>

        <div className="w-[70px] flex flex-col gap-1.5">
          <div className="bg-[rgba(255,255,255,0.02)] p-1.5 rounded-md flex items-center gap-1.5 justify-center">
            <Eye className="h-4 w-4" />
            <div className="text-xs font-semibold">{selected?.views ?? 0}</div>
          </div>

          <div className="bg-[rgba(255,255,255,0.02)] p-1.5 rounded-md flex items-center gap-1.5 justify-center">
            <Heart className="h-4 w-4" />
            <div className="text-xs font-semibold">{selected?.likes ?? 0}</div>
          </div>

          <div className="bg-[rgba(255,255,255,0.02)] p-1.5 rounded-md flex items-center gap-1.5 justify-center">
            <Clock className="h-4 w-4" />
            <div className="text-xs font-semibold">27m</div>
          </div>

          <div className="bg-[rgba(255,255,255,0.02)] p-1.5 rounded-md flex items-center justify-center">
            <div
              className="relative w-10 h-4 rounded-full bg-[rgba(255,255,255,0.1)] cursor-pointer"
              onClick={() =>
                setSelectedToggle((prev) =>
                  prev === "community" ? "search" : "community"
                )
              }
            >
              <div
                className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-transform duration-200 ${
                  selectedToggle === "search"
                    ? "translate-x-6 bg-green-500"
                    : "bg-white"
                }`}
              >
                {selectedToggle === "community" ? (
                  <Users className="h-2 w-2 text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                ) : (
                  <Search className="h-2 w-2 text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Community / KOL */}
      <div className="flex gap-2 items-stretch">
        <div className="flex-1 bg-[rgba(255,255,255,0.02)] rounded-md p-1.5 flex flex-col justify-center">
          <div className="grid grid-cols-3 gap-1.5 text-center h-full">
            <div className="p-1.5 rounded bg-[rgba(255,255,255,0.03)] flex flex-col items-center justify-center">
              <MdOutlineGroup className="w-4 h-4 text-green-400 opacity-90 mb-0.5" />
              <div className="text-xs font-semibold">{selected?.members ?? 0}</div>
            </div>
            <div className="p-1.5 rounded bg-[rgba(255,255,255,0.03)] flex flex-col items-center justify-center">
              <GiHumanTarget className="w-4 h-4 text-blue-400 opacity-90 mb-0.5" />
              <div className="text-xs font-semibold">{selected?.users ?? 0}</div>
            </div>
           <div className="p-1.5 rounded bg-[rgba(255,255,255,0.03)] flex flex-col items-center justify-center">
  <TfiLayoutMediaCenterAlt className="w-4 h-4 text-purple-400 opacity-90 mb-0.5" />
  {/* Total posts */}
  <div className="text-xs font-semibold">{selected?.posts ?? 0}</div>
  {/* Breakdown: 12 • 8 */}
  <div className="text-[9px] font-semibold flex gap-1">
    <span className="text-blue-400">{selected?.postsBlue ?? 0}</span>
    <span className="text-white">•</span>
    <span className="text-green-400">{selected?.postsGreen ?? 0}</span>
  </div>
</div>

          </div>
        </div>

        <div className="flex-1 bg-[rgba(255,255,255,0.02)] rounded-md p-1.5 flex flex-col items-center justify-center gap-1.5">
          <div className="text-[10px] text-muted-foreground">KOL Conc.</div>
          <div className="flex gap-1.5 items-end">
            {kolColors.map((c, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div style={{ background: c }} className="w-3 h-3 rounded-full" />
                <div className="text-[10px] mt-0.5">
                  {selected?.kol?.[idx] ?? 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="flex items-center justify-between gap-1.5 mt-auto">
        <button
          onClick={() => (window.location.href = "/terminal")}
          className="flex-1 bg-green-600 hover:bg-green-700 text-black font-semibold py-1.5 rounded-md text-xs"
        >
          Terminal
        </button>
        <button className="w-16 bg-[rgba(255,255,255,0.02)] rounded-md py-1.5 text-xs">
          Layout
        </button>
        <button
          onClick={() => setShowAlerts(true)}
          className="w-16 bg-[rgba(255,255,255,0.02)] rounded-md py-1.5 text-xs flex items-center justify-center gap-1"
        >
          <Bell className="h-3 w-3" />
          Alert
        </button>
      </div>
    </div>
  );
}
