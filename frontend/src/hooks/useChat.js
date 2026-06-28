/**
 * useChat — Socket.io chat hook with graceful fallback
 *
 * Works in two modes:
 *   1. socket.io-client installed → full real-time WebSocket chat
 *   2. socket.io-client missing   → no-op (chat UI still works via HTTP polling)
 *
 * To enable real-time: run `npm install` in the frontend folder.
 */
import { useEffect, useRef, useCallback, useState } from "react";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

let sharedSocket   = null;
let socketioFailed = false;   // set to true if import fails; never retry

// ── Lazy-load socket.io-client ────────────────────────────────
async function loadSocketIO() {
  if (socketioFailed) return null;
  if (sharedSocket && !sharedSocket.disconnected) return sharedSocket;

  try {
    const { io } = await import("socket.io-client");
    return io;
  } catch {
    socketioFailed = true;
    console.warn("⚠️  socket.io-client not installed. Run: npm install in /frontend");
    return null;
  }
}

function getOrCreateSocket(io, token) {
  if (!sharedSocket || sharedSocket.disconnected) {
    sharedSocket = io(SOCKET_URL, {
      auth:                { token },
      transports:          ["websocket", "polling"],
      autoConnect:         true,
      reconnection:        true,
      reconnectionDelay:   1000,
      reconnectionAttempts: 10,
    });
  }
  return sharedSocket;
}

// ── Hook ──────────────────────────────────────────────────────
export default function useChat({ conversationId, onNewMessage, onTyping } = {}) {
  const token     = localStorage.getItem("token") || sessionStorage.getItem("token");
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  // Connect socket on mount
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    let socket    = null;

    (async () => {
      const io = await loadSocketIO();
      if (!io || cancelled) return;

      socket = getOrCreateSocket(io, token);
      socketRef.current = socket;

      const onConnect    = () => { if (!cancelled) setConnected(true);  };
      const onDisconnect = () => { if (!cancelled) setConnected(false); };

      socket.on("connect",    onConnect);
      socket.on("disconnect", onDisconnect);

      // Already connected
      if (socket.connected) setConnected(true);
    })();

    return () => {
      cancelled = true;
      if (socket) {
        socket.off("connect");
        socket.off("disconnect");
      }
    };
  }, [token]);

  // Join / leave conversation room + message listeners
  useEffect(() => {
    const socket = socketRef.current;
    if (!conversationId || !socket) return;

    socket.emit("join_conversation", conversationId);

    const handleMsg = (data) => {
      if (data.conversationId === conversationId && onNewMessage) {
        onNewMessage(data.message);
      }
    };
    const handleTyping = (data) => {
      if (onTyping) onTyping(data);
    };

    socket.on("new_message", handleMsg);
    socket.on("user_typing", handleTyping);

    return () => {
      socket.emit("leave_conversation", conversationId);
      socket.off("new_message", handleMsg);
      socket.off("user_typing", handleTyping);
    };
  }, [conversationId, onNewMessage, onTyping]);

  const emitTyping = useCallback((isTyping) => {
    const socket = socketRef.current;
    if (!conversationId || !socket?.connected) return;
    socket.emit("typing", { conversationId, isTyping });
  }, [conversationId]);

  const onChatNotification = useCallback((handler) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on("chat_notification", handler);
    return () => socket.off("chat_notification", handler);
  }, []);

  return {
    connected,
    emitTyping,
    onChatNotification,
    socket: socketRef.current,
  };
}
