"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Eip1193Provider } from "ethers";
import { FhevmInstance } from "./fhevmTypes";
import { createFhevmInstance, FhevmAbortError } from "./internal/fhevm";

export interface UseFhevmResult {
  instance: FhevmInstance | undefined;
  isLoading: boolean;
  error: Error | undefined;
  status: string;
}

export function useFhevm(
  provider: Eip1193Provider | undefined,
  mockChains?: Record<number, string>
): UseFhevmResult {
  const [instance, setInstance] = useState<FhevmInstance | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [status, setStatus] = useState<string>("idle");

  const abortControllerRef = useRef<AbortController | undefined>(undefined);
  const activeProviderRef = useRef<Eip1193Provider | undefined>(undefined);

  const createInstance = useCallback(async () => {
    if (!provider) {
      setInstance(undefined);
      setStatus("no-provider");
      return;
    }

    // Cancel previous instance creation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    activeProviderRef.current = provider;

    setIsLoading(true);
    setError(undefined);
    setStatus("creating");

    try {
      const inst = await createFhevmInstance({
        provider,
        mockChains,
        signal: controller.signal,
        onStatusChange: (newStatus) => {
          setStatus(newStatus);
        },
      });

      if (controller.signal.aborted) {
        return;
      }

      if (activeProviderRef.current !== provider) {
        return;
      }

      setInstance(inst);
      setStatus("ready");
      console.log("[useFhevm] Instance created successfully");
    } catch (e) {
      if (e instanceof FhevmAbortError) {
        console.log("[useFhevm] Instance creation aborted");
        return;
      }

      console.error("[useFhevm] Failed to create instance:", e);
      setError(e instanceof Error ? e : new Error(String(e)));
      setStatus("error");
    } finally {
      setIsLoading(false);
    }
  }, [provider, mockChains]);

  useEffect(() => {
    createInstance();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [createInstance]);

  return {
    instance,
    isLoading,
    error,
    status,
  };
}

