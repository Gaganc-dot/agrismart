/**
 * useSSE — subscribe to a Server-Sent Events endpoint.
 *
 * Usage:
 *   const { connected } = useSSE("/api/notifications/stream", {
 *     notification: (data) => handleNotification(data),
 *     connected:    (data) => console.log("SSE connected"),
 *   });
 *
 *   // or for auction rooms:
 *   const { connected } = useSSE(`/api/auction/${productId}/stream`, {
 *     new_bid:       (data) => updateBids(data),
 *     auction_closed:(data) => handleClose(data),
 *   });
 */

import { useEffect, useRef, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function useSSE(path, handlers = {}) {
  const [connected, setConnected] = useState(false);
  const esRef      = useRef(null);
  const handlerRef = useRef(handlers);

  // Keep latest handlers without re-subscribing
  useEffect(() => { handlerRef.current = handlers; });

  useEffect(() => {
    if (!path) return;

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    // EventSource doesn't support custom headers — pass token as query param
    const url = `${API}${path}?token=${encodeURIComponent(token)}`;
    const es  = new EventSource(url);
    esRef.current = es;

    es.onopen  = () => setConnected(true);
    es.onerror = () => setConnected(false);

    // Attach named event listeners dynamically
    const attachListeners = () => {
      const evts = [
        "connected", "notification",
        "new_bid", "auction_closed",
        "bid_accepted", "outbid",
      ];
      evts.forEach((evt) => {
        es.addEventListener(evt, (e) => {
          try {
            const data = JSON.parse(e.data);
            handlerRef.current?.[evt]?.(data);
          } catch (_) {}
        });
      });
    };
    attachListeners();

    return () => {
      es.close();
      setConnected(false);
    };
  }, [path]);   // only re-connect if path changes

  return { connected, close: () => esRef.current?.close() };
}
