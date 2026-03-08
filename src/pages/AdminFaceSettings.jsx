import React, { useState, useEffect, useRef } from "react";
import AdminSidebar from "../components/AdminSidebar";
import Swal from "sweetalert2";
import { fetchFaceStats, setFaceRecognitionActive, registerFace } from "../api/ElectionApi";
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

/* ── Status constants ── */
const STATUS = { IDLE: "idle", SUBMITTING: "submitting", SUCCESS: "success", ERROR: "error" };

const AdminFaceSettings = () => {
  const [faceData, setFaceData]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [toggling, setToggling]       = useState(false);

  /* ── Register Face state ── */
  const [faceImages, setFaceImages]   = useState([]);   // { id, file, preview, name, status }
  const [submitting, setSubmitting]   = useState(false);
  const [lightbox, setLightbox]       = useState(null); // preview URL

  const fileInputRef  = useRef(null);
  const cardsRef      = useRef(null);

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

  /* ── Derived values ── */
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
      setFaceData(updated);
      Swal.fire({
        toast: true, position: "top", icon: "success",
        title: `Face Recognition ${!enabled ? "Enabled" : "Disabled"}`,
        showConfirmButton: false, timer: 2000,
      });
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to update face recognition";
      Swal.fire("Error", msg, "error");
    } finally {
      setToggling(false);
    }
  };

  /* ── Image selection ── */
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newImages = files.map((file) => ({
      id:      Math.random().toString(36).slice(2),
      file,
      preview: URL.createObjectURL(file),
      name:    file.name.replace(/\.[^.]+$/, ""),
      status:  STATUS.IDLE,
    }));

    setFaceImages((prev) => [...prev, ...newImages]);

    // Scroll to cards after short delay
    setTimeout(() => {
      cardsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);

    // Reset input so same files can be re-added
    e.target.value = "";
  };

  const handleNameChange = (id, value) => {
    setFaceImages((prev) =>
      prev.map((img) => img.id === id ? { ...img, name: value } : img)
    );
  };

  const handleRemoveImage = (id) => {
    setFaceImages((prev) => prev.filter((img) => img.id !== id));
  };

  /* ── Sequential submit ── */
  const handleSubmitAll = async () => {
    if (!faceImages.length) return;

    const confirm = await Swal.fire({
      title: "Submit Faces?",
      text: `Register ${faceImages.length} face(s) to the system?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, register",
      confirmButtonColor: "#3b82f6",
    });
    if (!confirm.isConfirmed) return;

    setSubmitting(true);
    let successCount = 0;
    let errorCount   = 0;

    for (const img of faceImages) {
      // Mark as submitting
      setFaceImages((prev) =>
        prev.map((i) => i.id === img.id ? { ...i, status: STATUS.SUBMITTING } : i)
      );

      try {
        const formData = new FormData();
        formData.append("image", img.file);
        if (img.name.trim()) formData.append("name", img.name.trim());

        await registerFace(formData);
        successCount++;
        setFaceImages((prev) =>
          prev.map((i) => i.id === img.id ? { ...i, status: STATUS.SUCCESS } : i)
        );
      } catch {
        errorCount++;
        setFaceImages((prev) =>
          prev.map((i) => i.id === img.id ? { ...i, status: STATUS.ERROR } : i)
        );
      }

      // Small delay between requests
      await new Promise((r) => setTimeout(r, 200));
    }

    setSubmitting(false);

    await Swal.fire({
      title: "Registration Complete",
      html: `
        <div style="display:flex;gap:24px;justify-content:center;margin-top:8px">
          <div style="text-align:center">
            <div style="font-size:2rem;font-weight:700;color:#10b981">${successCount}</div>
            <div style="color:#6b7280;font-size:0.85rem">Registered</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:2rem;font-weight:700;color:#ef4444">${errorCount}</div>
            <div style="color:#6b7280;font-size:0.85rem">Failed</div>
          </div>
        </div>`,
      icon: successCount > 0 && errorCount === 0 ? "success" : errorCount > 0 && successCount === 0 ? "error" : "warning",
      confirmButtonText: "OK",
      confirmButtonColor: "#3b82f6",
    });

    setFaceImages([]);
  };

  /* ── Clear all images ── */
  const handleClearAll = () => { setFaceImages([]); };

  /* ── Lightbox close on Escape ── */
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setLightbox(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

        {/* ════════════════════════════════════════
            ── Register Face Section ──
        ════════════════════════════════════════ */}
        <div className="face-register-panel">
          <div className="face-register-header">
            <div>
              <h3 className="face-register-title">Register Faces</h3>
              <p className="face-register-sub">Upload one or more face images to register them in the biometric database.</p>
            </div>

            <button
              className="face-register-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Add Images
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>

          {/* ── Image Cards Grid ── */}
          {faceImages.length > 0 && (
            <div ref={cardsRef} className="face-cards-section">
              <div className="face-cards-grid">
                {faceImages.map((img) => (
                  <div key={img.id} className={`face-image-card status-${img.status}`}>

                    {/* Image preview */}
                    <div
                      className="face-card-img-wrap"
                      onClick={() => setLightbox(img.preview)}
                      title="Click to view full screen"
                    >
                      <img src={img.preview} alt={img.name} className="face-card-img" />

                      {/* Submitting spinner overlay */}
                      {img.status === STATUS.SUBMITTING && (
                        <div className="face-card-overlay submitting">
                          <span className="card-spinner" />
                        </div>
                      )}

                      {/* Success overlay */}
                      {img.status === STATUS.SUCCESS && (
                        <div className="face-card-overlay success">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </div>
                      )}

                      {/* Error overlay */}
                      {img.status === STATUS.ERROR && (
                        <div className="face-card-overlay error">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </div>
                      )}

                      {/* Zoom hint */}
                      {img.status === STATUS.IDLE && (
                        <div className="face-card-zoom-hint">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                            <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Name input */}
                    <div className="face-card-body">
                      <input
                        className="face-card-name-input"
                        type="text"
                        placeholder="Enter name…"
                        value={img.name}
                        onChange={(e) => handleNameChange(img.id, e.target.value)}
                        disabled={submitting || img.status !== STATUS.IDLE}
                      />

                      {/* Remove button — only when idle */}
                      {img.status === STATUS.IDLE && (
                        <button
                          className="face-card-remove"
                          onClick={() => handleRemoveImage(img.id)}
                          disabled={submitting}
                          title="Remove"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      )}
                    </div>

                  </div>
                ))}

                {/* ── Add More Drop Zone Card ── */}
                {!submitting && (
                  <div
                    className="face-image-card face-add-more-card"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="face-add-more-inner">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="16"/>
                        <line x1="8" y1="12" x2="16" y2="12"/>
                      </svg>
                      <span>Add more</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Submit All Button ── */}
              <div className="face-submit-row">
                <span className="face-submit-count">{faceImages.length} image{faceImages.length !== 1 ? "s" : ""} queued</span>
                <div className="face-submit-actions">
                  <button
                    className="face-clear-all-btn"
                    onClick={handleClearAll}
                    disabled={submitting}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                      <path d="M9 6V4h6v2"/>
                    </svg>
                    Clear All
                  </button>
                  <button
                    className={`face-submit-all-btn ${submitting ? "loading" : ""}`}
                    onClick={handleSubmitAll}
                    disabled={submitting || faceImages.length === 0}
                  >
                    {submitting ? (
                      <>
                        <span className="btn-spinner" />
                        Registering…
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        Register All Faces
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {faceImages.length === 0 && (
            <div className="face-register-empty" onClick={() => fileInputRef.current?.click()}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <p>Click <strong>Add Images</strong> or click here to select face photos</p>
              <span>Supports JPG, PNG, WEBP — multiple files allowed</span>
            </div>
          )}
        </div>

      </div>

      {/* ════════════════════════════════════════
          ── Lightbox ──
      ════════════════════════════════════════ */}
      {lightbox && (
        <div className="face-lightbox" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <img
            src={lightbox}
            alt="Full screen preview"
            className="lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default AdminFaceSettings;