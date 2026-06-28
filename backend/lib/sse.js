/**
 * Server-Sent Events (SSE) Manager
 * Manages real-time push connections to browsers with zero external dependencies.
 *
 * Channels:
 *   auction:<productId>   — all watchers of a specific auction
 *   user:<userId>         — personal notifications for a user
 *   global                — site-wide broadcasts
 */

const clients = new Map(); // channel → Set<res>

/** Register an SSE response object under one or more channels */
function subscribe(res, channels = []) {
  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
  res.flushHeaders();

  // Send a heartbeat comment every 25 s to keep the connection alive
  const heartbeat = setInterval(() => {
    try { res.write(": heartbeat\n\n"); } catch (_) { /* client gone */ }
  }, 25_000);

  channels.forEach((ch) => {
    if (!clients.has(ch)) clients.set(ch, new Set());
    clients.get(ch).add(res);
  });

  // Clean up when the client disconnects
  res.on("close", () => {
    clearInterval(heartbeat);
    channels.forEach((ch) => {
      clients.get(ch)?.delete(res);
      if (clients.get(ch)?.size === 0) clients.delete(ch);
    });
  });

  // Send initial connection event
  send(res, "connected", { ok: true });
}

/** Send a single SSE event to one res object */
function send(res, event, data) {
  try {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  } catch (_) { /* client disconnected */ }
}

/** Broadcast an event to everyone subscribed to a channel */
function broadcast(channel, event, data) {
  const subs = clients.get(channel);
  if (!subs || subs.size === 0) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  subs.forEach((res) => {
    try { res.write(payload); } catch (_) { subs.delete(res); }
  });
}

/** Broadcast to multiple channels at once */
function broadcastMany(channels, event, data) {
  channels.forEach((ch) => broadcast(ch, event, data));
}

/** Number of active connections (for diagnostics) */
function connectionCount() {
  let total = 0;
  clients.forEach((s) => (total += s.size));
  return total;
}

module.exports = { subscribe, broadcast, broadcastMany, connectionCount };
