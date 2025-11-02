"use client";

import { Navigation } from "@/components/Navigation";
import Link from "next/link";
import { useMetaMask } from "@/hooks/metamask/useMetaMaskProvider";

export default function HomePage() {
  const { isConnected } = useMetaMask();

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-br from-[var(--color-background)] to-[var(--color-surface)]">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">
              Privacy-First Writing Analytics
            </h1>
            <p className="text-xl md:text-2xl text-[var(--color-text-secondary)] max-w-3xl mx-auto">
              Track your writing progress with fully encrypted data on FHEVM
            </p>
            <div>
              <Link
                href={isConnected ? "/dashboard" : "#"}
                onClick={(e) => {
                  if (!isConnected) e.preventDefault();
                }}
                className="inline-block px-8 py-4 bg-[var(--color-primary)] text-white text-lg font-semibold rounded-lg hover:bg-[var(--color-primary-hover)] transition shadow-lg"
              >
                {isConnected ? "Go to Dashboard" : "Connect Wallet & Start"}
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[var(--color-surface)] p-8 rounded-xl border border-[var(--color-border)] hover:shadow-lg transition">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold mb-2">Encrypted Metrics</h3>
              <p className="text-[var(--color-text-secondary)]">
                Your word count & time stay encrypted on-chain. Zero leaks.
              </p>
            </div>
            <div className="bg-[var(--color-surface)] p-8 rounded-xl border border-[var(--color-border)] hover:shadow-lg transition">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-2">Goal Milestones</h3>
              <p className="text-[var(--color-text-secondary)]">
                Set private thresholds. Celebrate achievements without revealing details.
              </p>
            </div>
            <div className="bg-[var(--color-surface)] p-8 rounded-xl border border-[var(--color-border)] hover:shadow-lg transition">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold mb-2">Selective Sharing</h3>
              <p className="text-[var(--color-text-secondary)]">
                Grant mentors view-only access to aggregated trends via FHEVM allowance.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: "1", title: "Encrypt", desc: "Client-side encryption of word count & time" },
              { step: "2", title: "Submit", desc: "Store as euint32 on-chain" },
              { step: "3", title: "Aggregate", desc: "Encrypted addition generates trends" },
              { step: "4", title: "Authorize", desc: "Optional mentor access via FHE.allow" },
              { step: "5", title: "Decrypt", desc: "Only you can decrypt plaintext" },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-full flex items-center justify-center text-white font-bold">
                  {step}
                </div>
                <h4 className="font-bold mb-2">{title}</h4>
                <p className="text-sm text-[var(--color-text-secondary)]">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-[var(--color-border)] py-8 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-[var(--color-text-secondary)]">
            <p>Built with FHEVM • Privacy-Preserving Analytics</p>
          </div>
        </footer>
      </main>
    </>
  );
}

