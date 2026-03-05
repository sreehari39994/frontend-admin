import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import Swal from "sweetalert2";
import { fetchFaceStats, setFaceRecognitionActive } from "../api/ElectionApi";
import "../styles/FaceSettings.css";

/* ── tiny count-up hook ── */
const useCountUp = (target, duration = 1000) => {
  const [count, setCount] = React.useState(0);
  useEffect(() => {
    if (typeof target !== "number" || target === 0) { setCount(0); return; }
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

const AdminFaceSettings = () => {
  const [faceData, setFaceData] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [toggling, setToggling] = useState(false);

  /* ── Load stats from API ── */
  const loadStats = async () => {
    try {
      const data = await fetchFaceStats();
      setFaceData(data);
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to load face recognition stats";
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  /* ── Derived values using exact serializer field names ── */
  const total_kyc  = faceData?.total_kyc_in_database ?? 0;
  const verified   = faceData?.successful_kyc        ?? 0;
  const failed     = faceData?.failed_kycs           ?? 0;
  const enabled    = faceData?.is_active             ?? false;

  const animTotal    = useCountUp(total_kyc);
  const animVerified = useCountUp(verified);
  const animFailed   = useCountUp(failed);

  const successRate = total_kyc > 0 ? Math.round((verified / total_kyc) * 100) : 0;

  /* ── Toggle handler ── */
  const handleToggle = async () => {
    const action = enabled ? "disable" : "enable";
    const result = await Swal.fire({
      title: `${enabled ? "Disable" : "Enable"} Face Recognition?`,
      text: `This will ${action} face recognition for all voters.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${action} it`,
      cancelButtonText: "Cancel",
      confirmButtonColor: enabled ? "#ef4444" : "#10b981",
    });

    if (!result.isConfirmed) return;

    setToggling(true);
    try {
      const updated = await setFaceRecognitionActive(!enabled);
      setFaceData(updated); // backend returns updated FaceVerificationStatsSerializer
      Swal.fire({
        toast: true,
        position: "top",
        icon: "success",
        title: `Face Recognition ${!enabled ? "Enabled" : "Disabled"}`,
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to update face recognition";
      Swal.fire("Error", msg, "error");
    } finally {
      setToggling(false);
    }
  };

  return (
    <>
      <AdminSidebar />
      <div className="page-container face-container">

        {/* ── Page Header ── */}
        <div className="face-header">
          <div>
            <h2 className="face-title">Face Recognition</h2>
            <p className="face-subtitle">Manage biometric verification and monitor KYC activity.</p>
          </div>

          {/* Status pill */}
          <div className={`face-status-pill ${enabled ? "active" : "inactive"}`}>
            <span className="status-dot" />
            {loading ? "Loading…" : enabled ? "System Active" : "System Inactive"}
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="face-stats-grid">
          <div className="face-stat-card" style={{ "--accent": "#3b82f6" }}>
            <div className="face-stat-icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="face-stat-body">
              <span className="face-stat-label">Total KYC Records</span>
              <span className="face-stat-value">{loading ? <span className="dash-skeleton" /> : animTotal}</span>
              <span className="face-stat-sub">All registered entries</span>
            </div>
          </div>

          <div className="face-stat-card" style={{ "--accent": "#10b981" }}>
            <div className="face-stat-icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div className="face-stat-body">
              <span className="face-stat-label">Verified</span>
              <span className="face-stat-value">{loading ? <span className="dash-skeleton" /> : animVerified}</span>
              <span className="face-stat-sub success">Identity confirmed</span>
            </div>
          </div>

          <div className="face-stat-card" style={{ "--accent": "#ef4444" }}>
            <div className="face-stat-icon red">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <div className="face-stat-body">
              <span className="face-stat-label">Failed Attempts</span>
              <span className="face-stat-value">{loading ? <span className="dash-skeleton" /> : animFailed}</span>
              <span className="face-stat-sub danger">Verification rejected</span>
            </div>
          </div>
        </div>

        {/* ── Success Rate Bar ── */}
        <div className="face-rate-panel">
          <div className="face-rate-header">
            <div>
              <h3 className="face-rate-title">Verification Success Rate</h3>
              <p className="face-rate-sub">Based on total KYC records processed</p>
            </div>
            <span className="face-rate-pct">{successRate}%</span>
          </div>
          <div className="face-rate-track">
            <div className="face-rate-fill" style={{ width: `${successRate}%` }} />
          </div>
          <div className="face-rate-legend">
            <span className="legend-dot green" /> Verified ({verified})
            <span className="legend-dot red" style={{ marginLeft: 20 }} /> Failed ({failed})
          </div>
        </div>

        {/* ── Control Panel ── */}
        <div className="face-control-panel">
          <div className="face-control-info">
            <div className={`control-indicator ${enabled ? "on" : "off"}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Z"/>
                <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/>
              </svg>
            </div>
            <div>
              <h3 className="control-title">Face Recognition Engine</h3>
              <p className="control-desc">
                {enabled
                  ? "Biometric verification is currently active. Voters must pass face scan to proceed."
                  : "Biometric verification is disabled. Voters can bypass face scan."}
              </p>
            </div>
          </div>

          <button
            className={`face-toggle-btn ${enabled ? "btn-disable" : "btn-enable"} ${toggling ? "loading" : ""}`}
            onClick={handleToggle}
            disabled={toggling || loading}
          >
            {toggling ? (
              <span className="btn-spinner" />
            ) : enabled ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Disable Face Recognition
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                </svg>
                Enable Face Recognition
              </>
            )}
          </button>
        </div>

      </div>
    </>
  );
};

export default AdminFaceSettings;