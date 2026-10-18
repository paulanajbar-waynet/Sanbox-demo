"use client";

import { useCallback, useEffect, useState } from "react";

import { apiCall } from "./apiCall";
import type { ApiResult } from "./types";

interface Settled<T> {
  path: string;
  reloadKey: number;
  result: ApiResult<T>;
}

export interface ApiQuery<T> {
  /** Latest successful data; kept while the next request is loading (e.g. when paging). */
  data: T | undefined;
  error: string | null;
  isLoading: boolean;
  reload: () => void;
}

/** Loads `path` through apiCall, refetches when it changes, and cancels stale requests. */
export function useApiQuery<T>(path: string): ApiQuery<T> {
  const [reloadKey, setReloadKey] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const [lastData, setLastData] = useState<T>();

  useEffect(() => {
    const controller = new AbortController();
    apiCall<T>(path, { signal: controller.signal }).then(
      (result) => {
        setSettled({ path, reloadKey, result });
        if (result.ok) setLastData(result.data);
      },
      (reason: unknown) => {
        if (!controller.signal.aborted) throw reason;
      },
    );
    return () => controller.abort();
  }, [path, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);
  const current = settled?.path === path && settled.reloadKey === reloadKey ? settled.result : undefined;

  return {
    data: lastData,
    error: current && !current.ok ? current.error.message : null,
    isLoading: current === undefined,
    reload,
  };
}
