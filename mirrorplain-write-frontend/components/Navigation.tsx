"use client";

import Link from "next/link";
import { useMetaMask } from "@/hooks/metamask/useMetaMaskProvider";
import { useState } from "react";

export function Navigation() {
  const { account, chainId, isConnected, connect, disconnect } = useMetaMask();
  const [showMenu, setShowMenu] = useState(false);

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const getChainName = (id: number) => {
    switch (id) {
      case 31337:
        return "Hardhat";
      case 11155111:
        return "Sepolia";
      default:
        return `Chain ${id}`;
    }
  };

  return (
    <nav className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-lg"></div>
            <span className="text-xl font-bold">MirrorPlain</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            <Link href="/" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition">
              Home
            </Link>
            <Link href="/dashboard" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition">
              Dashboard
            </Link>
            <Link href="/goals" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition">
              Goals
            </Link>
          </div>

          {/* Wallet Control */}
          <div className="flex items-center space-x-4">
            {!isConnected ? (
              <button
                onClick={connect}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] transition"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="px-4 py-2 bg-[var(--color-surface-hover)] rounded-lg hover:bg-[var(--color-border)] transition flex items-center space-x-2"
                >
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {chainId && getChainName(chainId)}
                  </span>
                  <span className="text-sm font-mono">{account && formatAddress(account)}</span>
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg py-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(account!);
                        setShowMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-surface-hover)]"
                    >
                      Copy Address
                    </button>
                    <button
                      onClick={() => {
                        disconnect();
                        setShowMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-surface-hover)] text-[var(--color-error)]"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="md:hidden p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMenu && (
        <div className="md:hidden border-t border-[var(--color-border)] py-4 px-4 space-y-2">
          <Link href="/" className="block py-2 hover:text-[var(--color-primary)]">
            Home
          </Link>
          <Link href="/dashboard" className="block py-2 hover:text-[var(--color-primary)]">
            Dashboard
          </Link>
          <Link href="/goals" className="block py-2 hover:text-[var(--color-primary)]">
            Goals
          </Link>
        </div>
      )}
    </nav>
  );
}

