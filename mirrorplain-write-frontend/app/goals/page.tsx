"use client";

import { Navigation } from "@/components/Navigation";
import { useMetaMask } from "@/hooks/metamask/useMetaMaskProvider";
import { useMirrorPlainWrite } from "@/hooks/useMirrorPlainWrite";
import { useState, useEffect, useCallback } from "react";

interface Milestone {
  icon: string;
  label: string;
  achieved: boolean;
  id: string;
}

export default function GoalsPage() {
  const { isConnected, signer, account, chainId, fhevmInstance } = useMetaMask();
  const { 
    setGoals, 
    isLoading, 
    decryptTotals, 
    getEntryCount, 
    decryptAllEntries,
    checkMilestone 
  } = useMirrorPlainWrite(fhevmInstance, signer, account, chainId);

  const [weeklyGoal, setWeeklyGoal] = useState("");
  const [monthlyGoal, setMonthlyGoal] = useState("");
  const [message, setMessage] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([
    { icon: "🌱", label: "First Entry", achieved: false, id: "first-entry" },
    { icon: "📝", label: "1K Words", achieved: false, id: "1k-words" },
    { icon: "🔥", label: "7-Day Streak", achieved: false, id: "7-day-streak" },
    { icon: "🏆", label: "Monthly Goal", achieved: false, id: "monthly-goal" },
  ]);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load milestones
  const loadMilestones = useCallback(async () => {
    if (!isConnected || !account) return;

    setLoadingMilestones(true);
    try {
      // Get basic stats
      const entryCount = await getEntryCount();
      const totals = await decryptTotals();
      const entries = await decryptAllEntries();

      const newMilestones: Milestone[] = [
        { 
          icon: "🌱", 
          label: "First Entry", 
          achieved: entryCount > 0, 
          id: "first-entry" 
        },
        { 
          icon: "📝", 
          label: "1K Words", 
          achieved: totals ? Number(totals.words) >= 1000 : false, 
          id: "1k-words" 
        },
        { 
          icon: "🔥", 
          label: "7-Day Streak", 
          achieved: check7DayStreak(entries), 
          id: "7-day-streak" 
        },
        { 
          icon: "🏆", 
          label: "Monthly Goal", 
          achieved: false, // Will be checked separately if monthly goal is set
          id: "monthly-goal" 
        },
      ];

      // 1K Words milestone: already checked above using decrypted totals
      // Monthly Goal: would require decrypting the monthly goal from contract
      // For now, we show it as not achieved (can be enhanced later)

      setMilestones(newMilestones);
    } catch (e) {
      console.error("[GoalsPage] Failed to load milestones:", e);
    } finally {
      setLoadingMilestones(false);
    }
  }, [isConnected, account, getEntryCount, decryptTotals, decryptAllEntries, checkMilestone]);

  // Check 7-day streak (last 7 consecutive days)
  const check7DayStreak = (entries: Array<{ timestamp: number }>): boolean => {
    if (entries.length === 0) return false;

    // Get unique dates (YYYY-MM-DD format)
    const dateSet = new Set(
      entries.map(e => {
        const date = new Date(e.timestamp * 1000);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      })
    );

    // Check if there are entries for each of the last 7 days (including today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const year = checkDate.getFullYear();
      const month = String(checkDate.getMonth() + 1).padStart(2, '0');
      const day = String(checkDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      if (!dateSet.has(dateStr)) {
        return false;
      }
    }

    return true;
  };

  // Load milestones on mount and when connected
  useEffect(() => {
    if (isConnected && account) {
      loadMilestones();
    }
  }, [isConnected, account, loadMilestones]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weeklyGoal || !monthlyGoal) return;

    const success = await setGoals(parseInt(weeklyGoal), parseInt(monthlyGoal));

    if (success) {
      setMessage("Goals updated successfully!");
      setTimeout(() => setMessage(""), 3000);
      // Refresh milestones after updating goals
      await loadMilestones();
    } else {
      setMessage("Failed to update goals");
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await loadMilestones();
    } finally {
      setRefreshing(false);
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
              Connect your wallet to set goals
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8">Writing Goals</h1>

          {/* Current Goals */}
          <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] mb-8">
            <h2 className="text-xl font-bold mb-4">Current Goals</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📊</span>
                <div>
                  <div className="font-semibold">Weekly Target</div>
                  <div className="text-sm text-[var(--color-text-secondary)]">Set your weekly word count goal</div>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-2xl mr-3">📊</span>
                <div>
                  <div className="font-semibold">Monthly Target</div>
                  <div className="text-sm text-[var(--color-text-secondary)]">Set your monthly word count goal</div>
                </div>
              </div>
            </div>
          </div>

          {/* Set Goals Form */}
          <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)]">
            <h2 className="text-xl font-bold mb-6">Update Goals</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Weekly Word Target
                </label>
                <input
                  type="number"
                  value={weeklyGoal}
                  onChange={(e) => setWeeklyGoal(e.target.value)}
                  placeholder="e.g., 3500"
                  className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  min="1"
                  max="50000"
                  required
                />
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Target word count for the week (1 - 50,000)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Monthly Word Target
                </label>
                <input
                  type="number"
                  value={monthlyGoal}
                  onChange={(e) => setMonthlyGoal(e.target.value)}
                  placeholder="e.g., 15000"
                  className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  min="1"
                  max="200000"
                  required
                />
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Target word count for the month (1 - 200,000)
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition"
              >
                {isLoading ? "Updating..." : "Update Goals"}
              </button>

              {message && (
                <div className={`p-4 rounded-lg ${
                  message.includes("successfully")
                    ? "bg-[var(--color-success)] bg-opacity-10 text-[var(--color-success)]"
                    : "bg-[var(--color-error)] bg-opacity-10 text-[var(--color-error)]"
                }`}>
                  {message}
                </div>
              )}
            </form>
          </div>

          {/* Milestones */}
          <div className="mt-8 bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Milestones</h2>
              <button
                onClick={handleRefresh}
                disabled={refreshing || loadingMilestones}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-hover)] disabled:opacity-50 transition"
              >
                <svg 
                  className={`w-4 h-4 ${(refreshing || loadingMilestones) ? 'animate-spin' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {(refreshing || loadingMilestones) ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            <p className="text-[var(--color-text-secondary)] mb-6">
              Milestone badges will appear here as you achieve your writing goals.
            </p>
            {loadingMilestones ? (
              <div className="text-center py-8 text-[var(--color-text-secondary)]">
                Loading milestones...
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {milestones.map(({ icon, label, achieved, id }) => (
                  <div
                    key={id}
                    className={`p-4 rounded-lg text-center border transition ${
                      achieved
                        ? "border-[var(--color-success)] bg-[var(--color-success)] bg-opacity-10"
                        : "border-[var(--color-border)] opacity-50"
                    }`}
                  >
                    <div className="text-3xl mb-2">{icon}</div>
                    <div className="text-sm font-medium">{label}</div>
                    {achieved && (
                      <div className="text-xs text-[var(--color-success)] mt-1">✓ Achieved</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

