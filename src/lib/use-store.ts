"use client";
import { useEffect, useState } from "react";
import { initialState, fullStateSchema, type AppState } from "./state";
export const STORAGE_KEY = "science-camp-lab:v1";
export function useStore() {
  const [state, setState] = useState<AppState>(initialState);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  useEffect(() => {
    // Hydrate browser-only storage after SSR; doing this in an initializer would mismatch server markup.
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        let data: unknown;
        try {
          data = JSON.parse(raw);
        } catch {
          data = null;
        }
        const r = fullStateSchema.safeParse(data);
        if (r.success) setState(r.data);
        else {
          localStorage.setItem(`${STORAGE_KEY}:recovery`, raw);
          setStorageError(
            "原有資料格式不符，已保留 recovery 備份並載入預設值。",
          );
        }
      }
    } catch {
      setStorageError("無法讀取瀏覽器儲存空間。請使用 JSON 備份保存資料。");
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  useEffect(() => {
    if (!ready) return;
    const save = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        setStorageError("自動儲存失敗，可能是儲存空間不足。請匯出 JSON 備份。");
      }
    };
    const timer = setTimeout(save, 250);
    window.addEventListener("pagehide", save);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pagehide", save);
    };
  }, [state, ready]);
  return { state, setState, ready, storageError };
}
