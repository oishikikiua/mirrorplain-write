"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from "react";
import { Eip1193Provider, BrowserProvider, JsonRpcSigner } from "ethers";
import { useEip6963 } from "./useEip6963";
import { useFhevm } from "@/fhevm/useFhevm";

interface MetaMaskContextType {
  provider: Eip1193Provider | undefined;
  browserProvider: BrowserProvider | undefined;
  signer: JsonRpcSigner | undefined;
  account: string | undefined;
  chainId: number | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | undefined;
  connect: () => Promise<void>;
  disconnect: () => void;
  fhevmInstance: any;
  fhevmStatus: string;
}

const MetaMaskContext = createContext<MetaMaskContextType | undefined>(undefined);

export function MetaMaskProvider({ children, initialMockChains }: { children: ReactNode; initialMockChains?: Record<number, string> }) {
  const { providers } = useEip6963();
  
  const [provider, setProvider] = useState<Eip1193Provider | undefined>(undefined);
  const [browserProvider, setBrowserProvider] = useState<BrowserProvider | undefined>(undefined);
  const [signer, setSigner] = useState<JsonRpcSigner | undefined>(undefined);
  const [account, setAccount] = useState<string | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  const providerRef = useRef<Eip1193Provider | undefined>(undefined);
  const hasAttemptedReconnect = useRef(false);

  // FHEVM integration
  const { instance: fhevmInstance, status: fhevmStatus } = useFhevm(provider, initialMockChains);

  // Persistence helpers
  const saveWalletState = useCallback((connectorId: string, accounts: string[], chainId: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("wallet.connected", "true");
    localStorage.setItem("wallet.lastConnectorId", connectorId);
    localStorage.setItem("wallet.lastAccounts", JSON.stringify(accounts));
    localStorage.setItem("wallet.lastChainId", chainId);
  }, []);

  const clearWalletState = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("wallet.connected");
    localStorage.removeItem("wallet.lastConnectorId");
    localStorage.removeItem("wallet.lastAccounts");
    localStorage.removeItem("wallet.lastChainId");
  }, []);

  const getStoredWalletState = useCallback(() => {
    if (typeof window === "undefined") return null;
    const connected = localStorage.getItem("wallet.connected");
    const connectorId = localStorage.getItem("wallet.lastConnectorId");
    const accounts = localStorage.getItem("wallet.lastAccounts");
    const chainIdHex = localStorage.getItem("wallet.lastChainId");
    
    if (connected === "true" && connectorId) {
      return { connectorId, accounts, chainIdHex };
    }
    return null;
  }, []);

  // Setup provider listeners
  const setupListeners = useCallback((prov: Eip1193Provider) => {
    const handleAccountsChanged = (accounts: unknown) => {
      console.log("[MetaMaskProvider] accountsChanged", accounts);
      if (Array.isArray(accounts) && accounts.length > 0) {
        setAccount(accounts[0]);
        saveWalletState("io.metamask", accounts, chainId?.toString(16) || "0x1");
      } else {
        // Disconnected
        setAccount(undefined);
        setIsConnected(false);
        clearWalletState();
      }
    };

    const handleChainChanged = (chainIdHex: unknown) => {
      console.log("[MetaMaskProvider] chainChanged", chainIdHex);
      if (typeof chainIdHex === "string") {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
        if (account) {
          saveWalletState("io.metamask", [account], chainIdHex);
        }
      }
    };

    const handleConnect = (connectInfo: unknown) => {
      console.log("[MetaMaskProvider] connect", connectInfo);
      setIsConnected(true);
    };

    const handleDisconnect = (error: unknown) => {
      console.log("[MetaMaskProvider] disconnect", error);
      setAccount(undefined);
      setIsConnected(false);
      clearWalletState();
    };

    // Type assertion for event emitter methods
    const provWithEvents = prov as any;
    provWithEvents.on?.("accountsChanged", handleAccountsChanged);
    provWithEvents.on?.("chainChanged", handleChainChanged);
    provWithEvents.on?.("connect", handleConnect);
    provWithEvents.on?.("disconnect", handleDisconnect);

    return () => {
      provWithEvents.removeListener?.("accountsChanged", handleAccountsChanged);
      provWithEvents.removeListener?.("chainChanged", handleChainChanged);
      provWithEvents.removeListener?.("connect", handleConnect);
      provWithEvents.removeListener?.("disconnect", handleDisconnect);
    };
  }, [account, chainId, saveWalletState, clearWalletState]);

  // Silent reconnect on page load
  useEffect(() => {
    if (hasAttemptedReconnect.current) return;
    if (providers.length === 0) return;

    const stored = getStoredWalletState();
    if (!stored) return;

    hasAttemptedReconnect.current = true;

    const reconnect = async () => {
      console.log("[MetaMaskProvider] Attempting silent reconnect...");
      
      // Find provider by connectorId
      const targetProvider = providers.find(p => p.info.rdns === stored.connectorId) || providers[0];
      if (!targetProvider) return;

      const prov = targetProvider.provider;
      setProvider(prov);
      providerRef.current = prov;

      try {
        // Use eth_accounts (silent, no popup)
        const accounts = await prov.request({ method: "eth_accounts" });
        if (Array.isArray(accounts) && accounts.length > 0) {
          const browserProv = new BrowserProvider(prov);
          const signer = await browserProv.getSigner();
          const chainIdHex = await prov.request({ method: "eth_chainId" });
          const chainId = parseInt(chainIdHex as string, 16);

          setAccount(accounts[0]);
          setBrowserProvider(browserProv);
          setSigner(signer);
          setChainId(chainId);
          setIsConnected(true);

          console.log("[MetaMaskProvider] Silent reconnect successful");
        } else {
          console.log("[MetaMaskProvider] No accounts found, clearing state");
          clearWalletState();
        }
      } catch (e) {
        console.error("[MetaMaskProvider] Silent reconnect failed:", e);
        clearWalletState();
      }
    };

    reconnect();
  }, [providers, getStoredWalletState, clearWalletState]);

  // Setup listeners when provider changes
  useEffect(() => {
    if (!provider) return;
    return setupListeners(provider);
  }, [provider, setupListeners]);

  // Connect function (explicit user action)
  const connect = useCallback(async () => {
    if (isConnecting) return;
    if (providers.length === 0) {
      setError(new Error("No wallet providers found"));
      return;
    }

    setIsConnecting(true);
    setError(undefined);

    try {
      // Use first available provider (in real app, show selector)
      const targetProvider = providers[0];
      const prov = targetProvider.provider;

      setProvider(prov);
      providerRef.current = prov;

      // Request accounts (shows wallet popup)
      const accounts = await prov.request({ method: "eth_requestAccounts" });
      if (!Array.isArray(accounts) || accounts.length === 0) {
        throw new Error("No accounts returned");
      }

      const browserProv = new BrowserProvider(prov);
      const signer = await browserProv.getSigner();
      const chainIdHex = await prov.request({ method: "eth_chainId" });
      const chainId = parseInt(chainIdHex as string, 16);

      setAccount(accounts[0]);
      setBrowserProvider(browserProv);
      setSigner(signer);
      setChainId(chainId);
      setIsConnected(true);

      saveWalletState(targetProvider.info.rdns, accounts, chainIdHex as string);

      console.log("[MetaMaskProvider] Connected successfully");
    } catch (e) {
      console.error("[MetaMaskProvider] Connection failed:", e);
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, providers, saveWalletState]);

  // Disconnect function
  const disconnect = useCallback(() => {
    setAccount(undefined);
    setProvider(undefined);
    setBrowserProvider(undefined);
    setSigner(undefined);
    setChainId(undefined);
    setIsConnected(false);
    clearWalletState();
    console.log("[MetaMaskProvider] Disconnected");
  }, [clearWalletState]);

  return (
    <MetaMaskContext.Provider
      value={{
        provider,
        browserProvider,
        signer,
        account,
        chainId,
        isConnected,
        isConnecting,
        error,
        connect,
        disconnect,
        fhevmInstance,
        fhevmStatus,
      }}
    >
      {children}
    </MetaMaskContext.Provider>
  );
}

export function useMetaMask() {
  const context = useContext(MetaMaskContext);
  if (!context) {
    throw new Error("useMetaMask must be used within MetaMaskProvider");
  }
  return context;
}

