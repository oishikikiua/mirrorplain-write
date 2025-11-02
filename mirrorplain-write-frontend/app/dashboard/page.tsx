"use client";

import { Navigation } from "@/components/Navigation";
import { useMetaMask } from "@/hooks/metamask/useMetaMaskProvider";
import { useMirrorPlainWrite } from "@/hooks/useMirrorPlainWrite";
import { WeeklyHeatmap, MonthlyTrend, GoalProgress } from "@/components/AnalyticsCharts";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const { isConnected, signer, account, chainId, fhevmInstance } = useMetaMask();
  const { submitEntry, decryptTotals, decryptAllEntries, getEntryCount, allowMentor, isLoading } = useMirrorPlainWrite(
    fhevmInstance,
    signer,
    account,
    chainId
  );

  const [activeTab, setActiveTab] = useState<"submit" | "analytics" | "authorization">("submit");
  const [wordCount, setWordCount] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [totals, setTotals] = useState<{ words: bigint; time: bigint } | null>(null);
  const [entryCount, setEntryCount] = useState(0);
  const [mentorAddress, setMentorAddress] = useState("");
  const [message, setMessage] = useState("");
  
  // Real historical data from blockchain (decrypted)
  const [historicalData, setHistoricalData] = useState<Array<{ timestamp: number; words: number; duration: number }>>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isConnected && signer && fhevmInstance) {
      loadData();
    }
  }, [isConnected, signer, fhevmInstance]);

  const loadData = async () => {
    if (refreshing) return; // Prevent concurrent refreshes
    
    setRefreshing(true);
    try {
      const totals = await decryptTotals();
      if (totals) setTotals(totals);
      
      const count = await getEntryCount();
      setEntryCount(count);
      
      // Fetch and decrypt all entries from blockchain
      if (count > 0) {
        setLoadingEntries(true);
        const entries = await decryptAllEntries();
        const formattedEntries = entries.map(entry => ({
          timestamp: entry.timestamp,
          words: parseInt(entry.words),
          duration: parseInt(entry.duration),
        }));
        setHistoricalData(formattedEntries);
        setLoadingEntries(false);
      } else {
        setHistoricalData([]);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await loadData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordCount || !duration) return;

    const success = await submitEntry(
      parseInt(wordCount),
      parseInt(duration) * 60,
      Math.floor(Date.now() / 1000)
    );

    if (success) {
      setMessage("Entry submitted successfully!");
      setWordCount("");
      setDuration("");
      setNotes("");
      setTimeout(() => {
        loadData();
        setMessage("");
      }, 2000);
    } else {
      setMessage("Failed to submit entry");
    }
  };

  const handleAllowMentor = async () => {
    if (!mentorAddress) return;
    const success = await allowMentor(mentorAddress);
    if (success) {
      setMessage("Mentor authorized successfully!");
      setMentorAddress("");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  if (!isConnected) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Please connect your wallet</h2>
            <p className="text-[var(--color-text-secondary)]">
              Connect your wallet to access the dashboard
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[var(--color-background)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-hover)] disabled:opacity-50 transition"
            >
              <svg 
                className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={`bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] transition-opacity ${refreshing ? 'opacity-50' : 'opacity-100'}`}>
              <div className="text-sm text-[var(--color-text-secondary)] mb-2">Total Words</div>
              <div className="text-3xl font-bold">
                {refreshing ? (
                  <div className="inline-block animate-pulse">---</div>
                ) : (
                  totals ? totals.words.toString() : "---"
                )}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-1">Encrypted on-chain</div>
            </div>
            <div className={`bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] transition-opacity ${refreshing ? 'opacity-50' : 'opacity-100'}`}>
              <div className="text-sm text-[var(--color-text-secondary)] mb-2">Total Time</div>
              <div className="text-3xl font-bold">
                {refreshing ? (
                  <div className="inline-block animate-pulse">---</div>
                ) : (
                  totals ? `${Math.floor(Number(totals.time) / 3600)}h ${Math.floor((Number(totals.time) % 3600) / 60)}m` : "---"
                )}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-1">Private sessions</div>
            </div>
            <div className={`bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] transition-opacity ${refreshing ? 'opacity-50' : 'opacity-100'}`}>
              <div className="text-sm text-[var(--color-text-secondary)] mb-2">Entries</div>
              <div className="text-3xl font-bold">
                {refreshing ? (
                  <div className="inline-block animate-pulse">---</div>
                ) : (
                  entryCount
                )}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-1">Recorded sessions</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
            <div className="border-b border-[var(--color-border)] flex">
              {[
                { key: "submit", label: "Submit Entry" },
                { key: "analytics", label: "Analytics" },
                { key: "authorization", label: "Authorization" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`px-6 py-4 font-semibold transition ${
                    activeTab === key
                      ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === "submit" && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Word Count</label>
                    <input
                      type="number"
                      value={wordCount}
                      onChange={(e) => setWordCount(e.target.value)}
                      placeholder="e.g., 500"
                      className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      min="1"
                      max="100000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g., 30"
                      className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      min="1"
                      max="1440"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Notes (optional, stays local)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Brief note (not uploaded)"
                      className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      rows={3}
                    />
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                      This note is NOT uploaded. Only encrypted count & time go on-chain.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-6 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition"
                  >
                    {isLoading ? "Submitting..." : "Encrypt & Submit"}
                  </button>
                  {message && (
                    <div className={`p-4 rounded-lg ${
                      message.includes("success") 
                        ? "bg-[var(--color-success)] bg-opacity-10 text-[var(--color-success)]"
                        : "bg-[var(--color-error)] bg-opacity-10 text-[var(--color-error)]"
                    }`}>
                      {message}
                    </div>
                  )}
                </form>
              )}

              {activeTab === "analytics" && (
                <div className="space-y-8">
                  {/* Analytics Header with Refresh Button */}
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Writing Analytics</h2>
                    <button
                      onClick={handleRefresh}
                      disabled={refreshing || loadingEntries}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-hover)] disabled:opacity-50 transition"
                    >
                      <svg 
                        className={`w-4 h-4 ${(refreshing || loadingEntries) ? 'animate-spin' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {(refreshing || loadingEntries) ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>

                  {/* Goal Progress */}
                  {totals && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Goal Progress</h3>
                      <GoalProgress 
                        current={Number(totals.words)} 
                        goal={3500} 
                        label="Weekly Goal: 3,500 words" 
                      />
                      <GoalProgress 
                        current={Number(totals.words)} 
                        goal={15000} 
                        label="Monthly Goal: 15,000 words" 
                      />
                    </div>
                  )}

                  {/* Charts */}
                  {loadingEntries ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
                      <p className="mt-4 text-[var(--color-text-secondary)]">Decrypting your writing history...</p>
                    </div>
                  ) : historicalData.length > 0 ? (
                    <>
                      <WeeklyHeatmap 
                        data={{
                          totalWords: totals ? Number(totals.words) : 0,
                          totalTime: totals ? Number(totals.time) : 0,
                          entries: historicalData,
                        }}
                      />
                      <MonthlyTrend 
                        data={{
                          totalWords: totals ? Number(totals.words) : 0,
                          totalTime: totals ? Number(totals.time) : 0,
                          entries: historicalData,
                        }}
                      />
                    </>
                  ) : entryCount > 0 ? (
                    <div className="text-center py-12 text-[var(--color-text-secondary)]">
                      <p>Failed to decrypt entries. Please try refreshing the page.</p>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-[var(--color-text-secondary)]">
                      <p>No data yet. Submit your first entry to see analytics!</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "authorization" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Mentor/Editor Address</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={mentorAddress}
                        onChange={(e) => setMentorAddress(e.target.value)}
                        placeholder="0x..."
                        className="flex-1 px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      />
                      <button
                        onClick={handleAllowMentor}
                        disabled={isLoading || !mentorAddress}
                        className="px-6 py-2 bg-[var(--color-primary)] text-white font-semibold rounded-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition"
                      >
                        Grant Access
                      </button>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                      Authorized users can only view aggregated statistics. They cannot access individual entries.
                    </p>
                  </div>
                  {message && activeTab === "authorization" && (
                    <div className="p-4 bg-[var(--color-success)] bg-opacity-10 text-[var(--color-success)] rounded-lg">
                      {message}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
