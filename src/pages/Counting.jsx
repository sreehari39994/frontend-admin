import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import Swal from "sweetalert2";
import { fetchVoteCounts } from "../api/ElectionApi";
import "../styles/Counting.css";

const COLORS = [
  { bar: "#3b82f6", light: "rgba(59,130,246,0.1)",  badge: "#dbeafe", text: "#1d4ed8" },
  { bar: "#8b5cf6", light: "rgba(139,92,246,0.1)",  badge: "#ede9fe", text: "#6d28d9" },
  { bar: "#10b981", light: "rgba(16,185,129,0.1)",  badge: "#d1fae5", text: "#047857" },
  { bar: "#f59e0b", light: "rgba(245,158,11,0.1)",  badge: "#fef3c7", text: "#b45309" },
  { bar: "#ef4444", light: "rgba(239,68,68,0.1)",   badge: "#fee2e2", text: "#b91c1c" },
  { bar: "#06b6d4", light: "rgba(6,182,212,0.1)",   badge: "#cffafe", text: "#0e7490" },
];

const useCountUp = (target, duration = 900) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) { setCount(0); return; }
    let cur = 0;
    const step = Math.max(1, Math.ceil(target / (duration / 16)));
    const t = setInterval(() => {
      cur += step;
      if (cur >= target) { setCount(target); clearInterval(t); }
      else setCount(cur);
    }, 16);
    return () => clearInterval(t);
  }, [target]);
  return count;
};

/* ── Individual animated bar row ── */
const CandidateRow = ({ candidate, rank, color, maxVotes, totalVotes, animate }) => {
  const animVotes = useCountUp(animate ? candidate.total_votes : 0);
  const pct = maxVotes > 0 ? (candidate.total_votes / maxVotes) * 100 : 0;
  const sharePct = totalVotes > 0 ? ((candidate.total_votes / totalVotes) * 100).toFixed(1) : "0.0";
  const isWinner = rank === 1;

  return (
    <div className={`count-row ${isWinner ? "winner" : ""}`} style={{ animationDelay: `${rank * 60}ms` }}>
      {/* Rank badge */}
      <div className="count-rank" style={{ background: color.light, color: color.bar }}>
        {isWinner ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ) : `#${rank}`}
      </div>

      {/* Info */}
      <div className="count-info">
        <div className="count-name-row">
          <span className="count-name">{candidate.name}</span>
          <span className="count-party-badge" style={{ background: color.badge, color: color.text }}>
            {candidate.party}
          </span>
          {isWinner && <span className="winner-tag">Leading</span>}
        </div>

        {/* Bar */}
        <div className="count-bar-track">
          <div
            className="count-bar-fill"
            style={{
              width: animate ? `${pct}%` : "0%",
              background: `linear-gradient(90deg, ${color.bar}, ${color.bar}cc)`,
              transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="count-stats">
        <span className="count-votes" style={{ color: color.bar }}>{animVotes.toLocaleString()}</span>
        <span className="count-share">{sharePct}%</span>
      </div>
    </div>
  );
};

const Counting = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchVoteCounts();
        setResults(data);
        // slight delay so bars animate in after render
        setTimeout(() => setAnimate(true), 100);
      } catch (err) {
        const msg = err?.response?.data?.detail || "Failed to load vote counts";
        Swal.fire("Error", msg, "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalVotes = results.reduce((s, c) => s + c.total_votes, 0);
  const maxVotes   = results.length > 0 ? results[0].total_votes : 1;
  const winner     = results[0];

  return (
    <>
      <AdminSidebar />
      <div className="page-container counting-container">

        {/* ── Header ── */}
        <div className="counting-header">
          <div>
            <h2 className="counting-title">Vote Counting</h2>
            <p className="counting-subtitle">Live results ranked by total votes received.</p>
          </div>
          <div className="total-votes-pill">
            🗳 {totalVotes.toLocaleString()} total votes cast
          </div>
        </div>

        {/* ── Winner Banner ── */}
        {!loading && winner && (
          <div className="winner-banner">
            <div className="winner-banner-left">
              <div className="winner-icon">🏆</div>
              <div>
                <p className="winner-label">Current Leader</p>
                <h3 className="winner-name">{winner.name}</h3>
                <p className="winner-party">{winner.party} · Age {winner.age}</p>
              </div>
            </div>
            <div className="winner-vote-block">
              <span className="winner-vote-count">{winner.total_votes.toLocaleString()}</span>
              <span className="winner-vote-label">votes</span>
            </div>
          </div>
        )}

        {/* ── Results Panel ── */}
        <div className="counting-panel">
          <div className="counting-panel-header">
            <h3>Results Breakdown</h3>
            <span className="candidate-count-badge">{results.length} candidates</span>
          </div>

          {loading ? (
            <div className="counting-loading">
              {[1,2,3].map(i => (
                <div key={i} className="count-row-skeleton" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="skel skel-rank" />
                  <div className="skel-body">
                    <div className="skel skel-name" />
                    <div className="skel skel-bar" />
                  </div>
                  <div className="skel skel-votes" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="counting-empty">
              <span>📊</span>
              <p>No vote data available yet.</p>
            </div>
          ) : (
            <div className="count-rows">
              {results.map((c, i) => (
                <CandidateRow
                  key={c.id}
                  candidate={c}
                  rank={i + 1}
                  color={COLORS[i % COLORS.length]}
                  maxVotes={maxVotes}
                  totalVotes={totalVotes}
                  animate={animate}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Share of votes mini chart ── */}
        {!loading && results.length > 0 && (
          <div className="share-panel">
            <div className="counting-panel-header">
              <h3>Vote Share</h3>
            </div>
            <div className="share-bar-wrap">
              {results.map((c, i) => {
                const pct = totalVotes > 0 ? (c.total_votes / totalVotes) * 100 : 0;
                const color = COLORS[i % COLORS.length];
                return (
                  <div
                    key={c.id}
                    className="share-segment"
                    style={{
                      width: animate ? `${pct}%` : "0%",
                      background: color.bar,
                      transition: `width 1.1s cubic-bezier(0.4,0,0.2,1) ${i * 60}ms`,
                    }}
                    title={`${c.name}: ${pct.toFixed(1)}%`}
                  />
                );
              })}
            </div>
            <div className="share-legend">
              {results.map((c, i) => {
                const color = COLORS[i % COLORS.length];
                const pct = totalVotes > 0 ? ((c.total_votes / totalVotes) * 100).toFixed(1) : "0.0";
                return (
                  <div key={c.id} className="legend-item">
                    <span className="legend-color" style={{ background: color.bar }} />
                    <span className="legend-name">{c.name}</span>
                    <span className="legend-pct">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default Counting;