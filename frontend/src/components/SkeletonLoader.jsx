/**
 * SkeletonLoader — Global shimmer skeleton system
 * Variants: card, stat, list, table, product, chat, full-page
 * Usage:
 *   <SkeletonLoader variant="card" count={4} />
 *   <SkeletonLoader variant="stat" count={4} />
 *   <SkeletonLoader variant="product" count={8} />
 *   <SkeletonLoader variant="list" count={5} />
 *   <SkeletonLoader variant="chat" count={6} />
 *   <PageSkeleton />
 */

// ── Shimmer Base ──────────────────────────────────────────────
const shimmerStyle = {
  background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
  backgroundSize: "200% 100%",
  animation: "skeletonShimmer 1.6s ease-in-out infinite",
  borderRadius: 8,
};

const pulse = `
  @keyframes skeletonShimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

function Bone({ w = "100%", h = 14, r = 8, delay = 0, mb = 0 }) {
  return (
    <div style={{
      ...shimmerStyle,
      width: w,
      height: h,
      borderRadius: r,
      animationDelay: `${delay}s`,
      marginBottom: mb,
      flexShrink: 0,
    }} />
  );
}

// ── Variants ──────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 20,
      border: "1px solid #f1f5f9",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Bone w={80} h={10} />
        <Bone w={36} h={36} r={12} />
      </div>
      <Bone w={100} h={28} r={6} />
      <Bone w={60} h={10} />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 24,
      border: "1px solid #f1f5f9",
      overflow: "hidden",
    }}>
      <Bone w="100%" h={180} r={0} />
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
        <Bone w="75%" h={14} />
        <Bone w="45%" h={22} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <Bone w={24} h={24} r={50} />
          <Bone w="55%" h={11} />
        </div>
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 24,
      border: "1px solid #f1f5f9",
      overflow: "hidden",
    }}>
      <Bone w="100%" h={200} r={0} />
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Bone w="60%" h={13} />
          <Bone w={48} h={13} />
        </div>
        <Bone w="40%" h={26} />
        <Bone w="35%" h={10} />
        <div style={{ borderTop: "1px solid #f8fafc", paddingTop: 10, display: "flex", gap: 8 }}>
          <Bone w={28} h={28} r={50} />
          <Bone w="55%" h={12} style={{ alignSelf: "center" }} />
        </div>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      border: "1px solid #f1f5f9",
      padding: "14px 16px",
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}>
      <Bone w={44} h={44} r={12} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <Bone w="65%" h={13} />
        <Bone w="40%" h={10} />
      </div>
      <Bone w={60} h={22} r={20} />
    </div>
  );
}

function TableSkeleton({ rows = 5 }) {
  return (
    <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 1fr",
        gap: 12,
        padding: "14px 20px",
        borderBottom: "1px solid #f8fafc",
        background: "#fafafa",
      }}>
        {[100, 70, 60, 80].map((w, i) => (
          <Bone key={i} w={`${w}%`} h={11} delay={i * 0.05} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr",
          gap: 12,
          padding: "14px 20px",
          borderBottom: r < rows - 1 ? "1px solid #f8fafc" : "none",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Bone w={32} h={32} r={10} delay={r * 0.05} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <Bone w="80%" h={12} delay={r * 0.05} />
              <Bone w="50%" h={9} delay={r * 0.05 + 0.05} />
            </div>
          </div>
          <Bone w="70%" h={12} delay={r * 0.05 + 0.1} />
          <Bone w="60%" h={12} delay={r * 0.05 + 0.15} />
          <Bone w={64} h={24} r={20} delay={r * 0.05 + 0.2} />
        </div>
      ))}
    </div>
  );
}

function ChatSkeleton() {
  // alternates sent/received
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "16px" }}>
      {[false, true, false, false, true, false].map((isMine, i) => (
        <div key={i} style={{
          display: "flex",
          justifyContent: isMine ? "flex-end" : "flex-start",
          alignItems: "flex-end",
          gap: 8,
        }}>
          {!isMine && <Bone w={32} h={32} r={50} delay={i * 0.08} />}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: "65%" }}>
            <Bone
              w={`${55 + Math.floor(i * 7) % 35}%`}
              h={36 + (i % 2) * 12}
              r={isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px"}
              delay={i * 0.08}
            />
            <Bone w={40} h={9} delay={i * 0.08 + 0.05} />
          </div>
          {isMine && <Bone w={32} h={32} r={50} delay={i * 0.08} />}
        </div>
      ))}
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div style={{
      borderRadius: 28,
      background: "linear-gradient(135deg, #dcfce7, #d1fae5, #e0f2fe)",
      padding: "32px",
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>
      <Bone w={200} h={13} r={20} />
      <Bone w="50%" h={36} r={8} />
      <Bone w="70%" h={14} />
      <Bone w="55%" h={14} />
      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <Bone w={140} h={44} r={14} />
        <Bone w={120} h={44} r={14} />
      </div>
    </div>
  );
}

// ── Grid + List wrappers ──────────────────────────────────────
function GridSkeleton({ count = 4, cols = "repeat(auto-fill,minmax(220px,1fr))", children: Child }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: cols, gap: 20 }}>
      {Array.from({ length: count }).map((_, i) => <Child key={i} />)}
    </div>
  );
}

// ── Full Dashboard Skeleton ───────────────────────────────────
export function DashboardSkeleton({ role = "farmer" }) {
  const accentGrad = role === "buyer"
    ? "linear-gradient(135deg, #fef3c7, #fde68a, #fbbf24)"
    : "linear-gradient(135deg, #dcfce7, #bbf7d0, #86efac)";

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 0 40px" }}>
      <style>{pulse}</style>

      {/* Hero */}
      <div style={{
        borderRadius: 28,
        background: accentGrad,
        padding: "32px",
        marginBottom: 24,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 24,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
          <Bone w={160} h={12} r={20} />
          <Bone w="45%" h={38} r={8} />
          <Bone w="65%" h={14} />
          <Bone w={160} h={44} r={14} />
        </div>
        <div style={{
          background: "rgba(255,255,255,0.4)",
          borderRadius: 20,
          padding: "24px",
          width: 180,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          alignItems: "center",
        }}>
          <Bone w={80} h={11} />
          <Bone w={120} h={34} r={6} />
          <Bone w={100} h={11} />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
        {[0, 1, 2, 3].map(i => <StatSkeleton key={i} />)}
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
        {/* Wide card */}
        <div style={{
          gridColumn: "span 2",
          background: "#fff",
          borderRadius: 20,
          border: "1px solid #f1f5f9",
          overflow: "hidden",
        }}>
          <div style={{ padding: "20px", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between" }}>
            <Bone w={160} h={14} />
            <Bone w={60} h={12} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 20px",
                borderBottom: i < 4 ? "1px solid #f8fafc" : "none",
              }}>
                <Bone w={36} h={36} r={10} delay={i * 0.06} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <Bone w="60%" h={12} delay={i * 0.06} />
                  <Bone w="35%" h={10} delay={i * 0.06 + 0.04} />
                </div>
                <Bone w={72} h={24} r={20} delay={i * 0.06 + 0.08} />
              </div>
            ))}
          </div>
        </div>

        {/* Side panel */}
        <div style={{
          background: "#fff",
          borderRadius: 20,
          border: "1px solid #f1f5f9",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}>
          <Bone w={140} h={14} />
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Bone w={32} h={32} r={10} delay={i * 0.06} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                <Bone w="75%" h={12} delay={i * 0.06} />
                <Bone w="50%" h={9} delay={i * 0.06 + 0.04} />
              </div>
              <Bone w={48} h={18} r={20} delay={i * 0.06 + 0.08} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Marketplace Skeleton ──────────────────────────────────────
export function MarketplaceSkeleton() {
  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 0 40px" }}>
      <style>{pulse}</style>
      <HeroSkeleton />
      <div style={{ marginTop: 24, marginBottom: 16, display: "flex", gap: 8 }}>
        {[0, 1, 2, 3, 4].map(i => <Bone key={i} w={80 + i * 12} h={36} r={20} delay={i * 0.05} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 20 }}>
        {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
      </div>
    </div>
  );
}

// ── Chat Skeleton ─────────────────────────────────────────────
export function ChatPageSkeleton() {
  return (
    <div style={{ display: "flex", height: "calc(100vh - 80px)", gap: 0, background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", overflow: "hidden" }}>
      <style>{pulse}</style>
      {/* Sidebar */}
      <div style={{ width: 320, borderRight: "1px solid #f1f5f9", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px", borderBottom: "1px solid #f1f5f9" }}>
          <Bone w="100%" h={40} r={12} />
        </div>
        <div style={{ flex: 1, overflow: "hidden", padding: "12px" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "12px 8px", borderBottom: "1px solid #f8fafc" }}>
              <Bone w={44} h={44} r={50} delay={i * 0.06} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Bone w="55%" h={12} delay={i * 0.06} />
                  <Bone w={35} h={10} delay={i * 0.06} />
                </div>
                <Bone w="80%" h={10} delay={i * 0.06 + 0.05} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 12, alignItems: "center" }}>
          <Bone w={40} h={40} r={50} />
          <div style={{ flex: 1 }}>
            <Bone w={140} h={14} mb={6} />
            <Bone w={90} h={10} />
          </div>
        </div>
        <ChatSkeleton />
        <div style={{ padding: "16px 20px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10 }}>
          <Bone w="100%" h={48} r={14} />
          <Bone w={48} h={48} r={14} />
        </div>
      </div>
    </div>
  );
}

// ── Generic export ────────────────────────────────────────────
export default function SkeletonLoader({ variant = "card", count = 4, rows = 5 }) {
  return (
    <>
      <style>{pulse}</style>
      {variant === "stat"    && <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16 }}>{Array.from({length:count}).map((_,i)=><StatSkeleton key={i}/>)}</div>}
      {variant === "card"    && <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:20 }}>{Array.from({length:count}).map((_,i)=><CardSkeleton key={i}/>)}</div>}
      {variant === "product" && <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:20 }}>{Array.from({length:count}).map((_,i)=><ProductSkeleton key={i}/>)}</div>}
      {variant === "list"    && <div style={{ display:"flex", flexDirection:"column", gap:10 }}>{Array.from({length:count}).map((_,i)=><ListSkeleton key={i}/>)}</div>}
      {variant === "table"   && <TableSkeleton rows={rows} />}
      {variant === "chat"    && <ChatSkeleton />}
    </>
  );
}
