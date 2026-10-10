import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function QRScannerModal({ records, onCheckIn, onClose }) {
  const [activeTab, setActiveTab] = useState("camera"); // "camera" | "file" | "manual"
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [autoCheckIn, setAutoCheckIn] = useState(true);

  // Scanned state
  const [scanResult, setScanResult] = useState(null); // { status: "success"|"already"|"notfound", record, raw }
  const [manualQuery, setManualQuery] = useState("");

  const scannerRef = useRef(null);
  const isStoppingRef = useRef(false);
  // BUG FIX: use a ref to mirror scanResult so the html5-qrcode callback
  // always reads the latest value and never has a stale closure.
  const scanResultRef = useRef(null);
  // BUG FIX: track scanning status in a ref so stopCamera() is never fooled
  // by stale state (React state updates are async, refs are synchronous).
  const isScanningRef = useRef(false);

  // ── Helper to find registration from decoded text ─────────────────────────
  const resolveRecord = (decodedText) => {
    let searchId = null;
    let searchUsn = null;

    try {
      const parsed = JSON.parse(decodedText);
      if (parsed.id) searchId = String(parsed.id).trim();
      if (parsed.usn) searchUsn = String(parsed.usn).trim().toLowerCase();
    } catch {
      const trimmed = decodedText.trim();
      const ashMatch = trimmed.match(/ASH3-[A-Za-z0-9_-]+/i);
      if (ashMatch) {
        searchId = ashMatch[0];
      } else {
        searchUsn = trimmed.toLowerCase();
      }
    }

    const found = records.find((r) => {
      if (searchId && (r.id === searchId || r.id?.toLowerCase() === searchId.toLowerCase())) return true;
      if (searchUsn && (r.usn ?? "").trim().toLowerCase() === searchUsn) return true;
      if (r.id && decodedText.includes(r.id)) return true;
      if (r.usn && decodedText.toLowerCase().includes((r.usn || "").toLowerCase().trim())) return true;
      return false;
    });

    return { found, searchId, searchUsn };
  };

  const handleDecoded = (decodedText) => {
    // BUG FIX: read from ref (not state) to avoid stale closure inside scanner callback
    if (scanResultRef.current) return; // already showing a result

    const { found } = resolveRecord(decodedText);

    if (!found) {
      const result = { status: "notfound", record: null, raw: decodedText };
      scanResultRef.current = result;
      setScanResult(result);
      return;
    }

    if (found.checkedIn) {
      const result = { status: "already", record: found, raw: decodedText };
      scanResultRef.current = result;
      setScanResult(result);
      return;
    }

    // Found and pending
    if (autoCheckIn) {
      onCheckIn(found, true);
      const result = {
        status: "success",
        record: { ...found, checkedIn: true },
        raw: decodedText,
        autoDone: true,
      };
      scanResultRef.current = result;
      setScanResult(result);
    } else {
      const result = {
        status: "pending_confirm",
        record: found,
        raw: decodedText,
      };
      scanResultRef.current = result;
      setScanResult(result);
    }
  };

  // ── Camera Initialization & Lifecycle ─────────────────────────────────────
  const stopCamera = async () => {
    // BUG FIX: use isScanningRef (not state) — state may be stale when called
    // from a cleanup/unmount context, causing the stream to never be released.
    if (scannerRef.current && isScanningRef.current && !isStoppingRef.current) {
      isStoppingRef.current = true;
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.warn("Error stopping scanner:", err);
      } finally {
        scannerRef.current = null;
        isStoppingRef.current = false;
        isScanningRef.current = false;
      }
    }
  };

  const startCamera = async (deviceId) => {
    await stopCamera();
    setCameraError("");

    try {
      const html5QrCode = new Html5Qrcode("qr-reader-target");
      scannerRef.current = html5QrCode;

      const cameraConfig = deviceId
        ? { deviceId: { exact: deviceId } }
        : { facingMode: "environment" };

      await html5QrCode.start(
        cameraConfig,
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const edge = Math.floor(minEdge * 0.82);
            return { width: edge, height: edge };
          },
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        },
        (decodedText) => {
          handleDecoded(decodedText);
        },
        () => {
          // Frame scan frame attempt
        }
      );
      isScanningRef.current = true;
    } catch (err) {
      console.error("Camera start failed:", err);
      setCameraError(
        err?.message || "Could not access camera. Please check browser permissions."
      );
      isScanningRef.current = false;
    }
  };

  useEffect(() => {
    if (activeTab === "camera") {
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length > 0) {
            setCameras(devices);
            // Default to back camera if available (usually contains 'back' in label)
            const backCam = devices.find((d) =>
              /back|rear|environment/i.test(d.label)
            );
            const chosenId = backCam ? backCam.id : devices[0].id;
            setSelectedCamera(chosenId);
            startCamera(chosenId);
          } else {
            startCamera(null);
          }
        })
        .catch(() => {
          // Camera listing failed or blocked, try generic environment camera
          startCamera(null);
        });
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeTab]);

  const handleCameraChange = (e) => {
    const id = e.target.value;
    setSelectedCamera(id);
    startCamera(id);
  };

  // ── Image File Upload Scanning ────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode("qr-file-scan-sandbox");
      const decodedText = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      handleDecoded(decodedText);
    } catch (err) {
      setScanResult({
        status: "notfound",
        record: null,
        raw: "Could not detect a valid QR code in the uploaded image.",
      });
    }
  };

  // ── Manual Search ─────────────────────────────────────────────────────────
  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;
    handleDecoded(manualQuery.trim());
  };

  const handleResetForNext = () => {
    scanResultRef.current = null;
    setScanResult(null);
    setManualQuery("");
    if (activeTab === "camera" && !isScanningRef.current) {
      startCamera(selectedCamera || null);
    }
  };

  const handleConfirmManualCheckIn = () => {
    if (scanResultRef.current?.record) {
      onCheckIn(scanResultRef.current.record, true);
      const updated = {
        ...scanResultRef.current,
        status: "success",
        record: { ...scanResultRef.current.record, checkedIn: true },
      };
      scanResultRef.current = updated;
      setScanResult(updated);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6"
      style={{ background: "rgba(18,3,32,0.94)", backdropFilter: "blur(14px)" }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[92vh]"
        style={{
          background: "linear-gradient(145deg,#230833 0%,#330d44 60%,#46124e 100%)",
          border: "1px solid rgba(255,215,0,0.35)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 30px rgba(255,215,0,0.15)",
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between border-b"
          style={{ borderColor: "rgba(255,215,0,0.15)", background: "rgba(20,4,36,0.6)" }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📷</span>
            <div>
              <h2 className="font-display font-bold text-cream text-lg leading-tight">
                Ticket Check-In Scanner
              </h2>
              <p className="font-body text-xs text-gold-muted opacity-80">
                Scan participant QR codes at the entry gate
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-cream opacity-50 hover:opacity-100 hover:text-gold text-2xl leading-none transition"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div
          className="flex border-b text-xs font-body font-semibold uppercase tracking-wider"
          style={{ borderColor: "rgba(255,215,0,0.15)", background: "rgba(15,2,26,0.4)" }}
        >
          {[
            { id: "camera", label: "Live Camera", icon: "📹" },
            { id: "file", label: "Upload Image", icon: "🖼️" },
            { id: "manual", label: "Manual USN / ID", icon: "⌨️" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setScanResult(null);
              }}
              className="flex-1 py-3 px-2 text-center transition flex items-center justify-center gap-1.5"
              style={{
                color: activeTab === tab.id ? "#ffd700" : "rgba(253,246,236,0.5)",
                borderBottom: activeTab === tab.id ? "2px solid #ffd700" : "2px solid transparent",
                background: activeTab === tab.id ? "rgba(255,215,0,0.06)" : "transparent",
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Body content */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col">
          {/* ── CASE 1: RESULT SCREEN ───────────────────────────────────── */}
          {scanResult ? (
            <div className="flex-1 flex flex-col justify-center animate-fadeIn">
              {/* SUCCESS CHECK-IN */}
              {scanResult.status === "success" && (
                <div
                  className="rounded-2xl p-6 text-center border"
                  style={{
                    background: "rgba(76,222,155,0.08)",
                    borderColor: "rgba(76,222,155,0.4)",
                  }}
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center text-3xl mx-auto mb-3">
                    ✓
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-body font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 mb-2">
                    Entry Verified · Checked In
                  </span>
                  <h3 className="font-display font-black text-cream text-2xl mb-1">
                    {scanResult.record.name}
                  </h3>
                  <p className="font-mono text-gold text-sm font-semibold mb-3">
                    {scanResult.record.usn}
                  </p>

                  {/* Details */}
                  <div
                    className="rounded-xl p-4 text-left text-xs font-body mb-5 space-y-2"
                    style={{ background: "rgba(0,0,0,0.25)" }}
                  >
                    <div className="flex justify-between">
                      <span className="text-cream opacity-50">Reg ID:</span>
                      <span className="font-mono text-cream font-medium">
                        {scanResult.record.id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cream opacity-50">Year & College:</span>
                      <span className="text-cream font-medium">
                        {scanResult.record.year} · {scanResult.record.institution}
                      </span>
                    </div>
                    {scanResult.record.teamName && (
                      <div className="flex justify-between">
                        <span className="text-cream opacity-50">Team Name:</span>
                        <span className="text-gold font-bold">
                          {scanResult.record.teamName}
                        </span>
                      </div>
                    )}
                    {scanResult.record.members && (
                      <div>
                        <span className="text-cream opacity-50 block mb-1">Members:</span>
                        <span className="text-cream font-medium leading-relaxed block pl-2 border-l border-gold/30">
                          {scanResult.record.members}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-cream opacity-50 block mb-1">Registered Events:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(scanResult.record.events || "").split(",").map((ev, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gold/15 text-gold border border-gold/30"
                          >
                            {ev.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleResetForNext}
                    className="w-full py-3 rounded-full font-body font-bold uppercase tracking-widest text-sm bg-gold text-plum hover:brightness-110 transition shadow-lg"
                  >
                    Scan Next Ticket →
                  </button>
                </div>
              )}

              {/* ALREADY CHECKED IN */}
              {scanResult.status === "already" && (
                <div
                  className="rounded-2xl p-6 text-center border"
                  style={{
                    background: "rgba(255,180,0,0.08)",
                    borderColor: "rgba(255,180,0,0.4)",
                  }}
                >
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-center text-3xl mx-auto mb-3">
                    ⚠️
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-body font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30 mb-2">
                    Already Checked In
                  </span>
                  <p className="font-body text-cream/70 text-xs mb-3">
                    This ticket has already been used for gate entry.
                  </p>
                  <h3 className="font-display font-black text-cream text-2xl mb-1">
                    {scanResult.record.name}
                  </h3>
                  <p className="font-mono text-gold text-sm font-semibold mb-4">
                    {scanResult.record.usn}
                  </p>

                  <div
                    className="rounded-xl p-4 text-left text-xs font-body mb-5 space-y-2"
                    style={{ background: "rgba(0,0,0,0.25)" }}
                  >
                    <div className="flex justify-between">
                      <span className="text-cream opacity-50">Reg ID:</span>
                      <span className="font-mono text-cream">{scanResult.record.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cream opacity-50">Events:</span>
                      <span className="text-gold font-medium">{scanResult.record.events}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleResetForNext}
                      className="flex-1 py-3 rounded-full font-body font-bold uppercase tracking-widest text-sm bg-gold text-plum hover:brightness-110 transition"
                    >
                      Scan Next Ticket
                    </button>
                  </div>
                </div>
              )}

              {/* PENDING CONFIRMATION (WHEN AUTO CHECK-IN IS OFF) */}
              {scanResult.status === "pending_confirm" && (
                <div
                  className="rounded-2xl p-6 text-center border"
                  style={{
                    background: "rgba(255,215,0,0.08)",
                    borderColor: "rgba(255,215,0,0.4)",
                  }}
                >
                  <div className="w-14 h-14 rounded-full bg-gold/20 text-gold border border-gold/40 flex items-center justify-center text-2xl mx-auto mb-3">
                    🎟️
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-body font-bold uppercase tracking-wider bg-gold/20 text-gold border border-gold/30 mb-2">
                    Valid Ticket Found
                  </span>
                  <h3 className="font-display font-black text-cream text-2xl mb-1">
                    {scanResult.record.name}
                  </h3>
                  <p className="font-mono text-gold text-sm font-semibold mb-4">
                    {scanResult.record.usn}
                  </p>

                  <div
                    className="rounded-xl p-4 text-left text-xs font-body mb-5 space-y-2"
                    style={{ background: "rgba(0,0,0,0.25)" }}
                  >
                    <div className="flex justify-between">
                      <span className="text-cream opacity-50">Events:</span>
                      <span className="text-cream font-medium">{scanResult.record.events}</span>
                    </div>
                    {scanResult.record.teamName && (
                      <div className="flex justify-between">
                        <span className="text-cream opacity-50">Team:</span>
                        <span className="text-gold font-bold">{scanResult.record.teamName}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleConfirmManualCheckIn}
                      className="flex-1 py-3 rounded-full font-body font-bold uppercase tracking-widest text-sm bg-emerald-500 text-slate-900 hover:brightness-110 transition shadow-lg"
                    >
                      ✓ Check In Now
                    </button>
                    <button
                      onClick={handleResetForNext}
                      className="px-5 py-3 rounded-full font-body font-semibold uppercase tracking-widest text-xs text-cream/70 border border-gold/30 hover:text-cream transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* NOT FOUND ERROR */}
              {scanResult.status === "notfound" && (
                <div
                  className="rounded-2xl p-6 text-center border"
                  style={{
                    background: "rgba(255,107,138,0.08)",
                    borderColor: "rgba(255,107,138,0.4)",
                  }}
                >
                  <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-400/40 flex items-center justify-center text-3xl mx-auto mb-3">
                    ✕
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-body font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/30 mb-2">
                    Ticket Not Found
                  </span>
                  <p className="font-body text-cream/70 text-xs mb-4">
                    No matching registration was found in the database.
                  </p>
                  <div
                    className="rounded-xl p-3 text-left font-mono text-[11px] text-cream/60 break-all mb-5 max-h-24 overflow-y-auto"
                    style={{ background: "rgba(0,0,0,0.3)" }}
                  >
                    {scanResult.raw}
                  </div>
                  <button
                    onClick={handleResetForNext}
                    className="w-full py-3 rounded-full font-body font-bold uppercase tracking-widest text-sm bg-gold text-plum hover:brightness-110 transition"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── CASE 2: SCANNING INTERFACES ────────────────────────────── */
            <div className="flex-1 flex flex-col">
              {/* Option: Live Camera Tab */}
              {activeTab === "camera" && (
                <div className="flex-1 flex flex-col">
                  {cameraError ? (
                    <div
                      className="rounded-xl p-5 text-center my-auto border"
                      style={{
                        background: "rgba(255,107,138,0.08)",
                        borderColor: "rgba(255,107,138,0.3)",
                      }}
                    >
                      <p className="text-2xl mb-2">📷⚠️</p>
                      <p className="font-display text-cream font-bold mb-1">
                        Camera Access Required
                      </p>
                      <p className="font-body text-xs text-cream/70 mb-4 max-w-xs mx-auto">
                        {cameraError}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <button
                          onClick={() => startCamera(selectedCamera || null)}
                          className="px-4 py-2 rounded-full font-body text-xs font-bold uppercase tracking-widest bg-gold text-plum hover:brightness-105"
                        >
                          Retry Camera
                        </button>
                        <button
                          onClick={() => setActiveTab("manual")}
                          className="px-4 py-2 rounded-full font-body text-xs font-semibold uppercase tracking-widest text-cream border border-gold/30 hover:border-gold"
                        >
                          Use USN Lookup
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center">
                      {/* Camera viewfinder container */}
                      <div
                        className="relative w-full aspect-square max-w-[320px] mx-auto rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center border-2 border-gold/40"
                        style={{ background: "#0c0114" }}
                      >
                        {/* Target DOM element for html5-qrcode */}
                        <div
                          id="qr-reader-target"
                          className="w-full h-full object-cover"
                        />

                        {/* Viewfinder overlay styling */}
                        <div
                          className="pointer-events-none absolute inset-0 flex items-center justify-center"
                          style={{
                            background:
                              "radial-gradient(circle, transparent 55%, rgba(12,1,20,0.65) 100%)",
                          }}
                        >
                          {/* Targeting square */}
                          <div
                            className="relative w-56 h-56 rounded-xl border-2 border-dashed border-gold/70"
                            style={{
                              boxShadow: "0 0 25px rgba(255,215,0,0.25)",
                            }}
                          >
                            {/* Scanning laser line animation */}
                            <div
                              className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent"
                              style={{
                                animation: "scanLine 2s ease-in-out infinite alternate",
                                boxShadow: "0 0 8px #ffd700",
                              }}
                            />
                            {/* 4 Corner brackets */}
                            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-gold" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-gold" />
                            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-gold" />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-gold" />
                          </div>
                        </div>
                      </div>

                      {/* Camera selector if multiple cameras exist */}
                      {cameras.length > 1 && (
                        <div className="w-full max-w-[320px] mt-3">
                          <label className="text-[11px] font-body text-cream/50 block mb-1">
                            Switch Camera:
                          </label>
                          <select
                            value={selectedCamera}
                            onChange={handleCameraChange}
                            className="w-full bg-purple-950/70 border border-gold/30 rounded-lg px-3 py-1.5 text-xs text-cream font-body focus:outline-none focus:border-gold"
                          >
                            {cameras.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.label || `Camera ${c.id.substring(0, 5)}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Option: Upload File Tab */}
              {activeTab === "file" && (
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                  <div
                    className="w-full max-w-sm rounded-2xl p-8 border-2 border-dashed border-gold/40 flex flex-col items-center justify-center cursor-pointer hover:border-gold transition"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                    onClick={() => document.getElementById("qr-file-input").click()}
                  >
                    <span className="text-4xl mb-3">🖼️</span>
                    <p className="font-display text-cream font-bold text-sm mb-1">
                      Choose QR Ticket Screenshot
                    </p>
                    <p className="font-body text-cream/50 text-xs mb-4">
                      PNG, JPEG, WebP or camera photo
                    </p>
                    <span className="px-4 py-2 rounded-full font-body text-xs font-semibold uppercase tracking-wider bg-gold text-plum hover:brightness-105">
                      Select Photo
                    </span>
                    <input
                      id="qr-file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  {/* Invisible container for html5-qrcode scanFile */}
                  <div id="qr-file-scan-sandbox" className="hidden" />
                </div>
              )}

              {/* Option: Manual USN / Reg ID Tab */}
              {activeTab === "manual" && (
                <form
                  onSubmit={handleManualSearch}
                  className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full py-4"
                >
                  <label className="font-body text-xs text-gold uppercase tracking-widest font-semibold block mb-2">
                    Enter USN or Registration ID:
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="e.g. 1MS21CS001 or ASH3-..."
                      value={manualQuery}
                      onChange={(e) => setManualQuery(e.target.value)}
                      className="flex-1 bg-purple-950/80 border border-gold/40 rounded-xl px-4 py-3 text-sm text-cream font-mono focus:outline-none focus:border-gold"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!manualQuery.trim()}
                      className="px-5 py-3 rounded-xl font-body font-bold text-xs uppercase tracking-widest bg-gold text-plum hover:brightness-105 disabled:opacity-40 transition"
                    >
                      Lookup
                    </button>
                  </div>
                  <p className="font-body text-[11px] text-cream/40 leading-relaxed">
                    💡 Helpful if the attendee’s phone screen is dim, broken, or unavailable.
                  </p>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer controls: Auto check-in toggle & instructions */}
        <div
          className="px-6 py-3.5 border-t flex items-center justify-between gap-4 flex-wrap text-xs font-body"
          style={{ borderColor: "rgba(255,215,0,0.15)", background: "rgba(15,2,26,0.6)" }}
        >
          <label className="flex items-center gap-2 cursor-pointer select-none text-cream/80 hover:text-cream">
            <input
              type="checkbox"
              checked={autoCheckIn}
              onChange={(e) => setAutoCheckIn(e.target.checked)}
              className="accent-gold w-4 h-4 rounded cursor-pointer"
            />
            <span className="font-semibold">Auto Check-In on scan</span>
          </label>

          <span className="text-gold-muted opacity-60 text-[11px]">
            {records.filter((r) => r.checkedIn).length} / {records.length} checked in
          </span>
        </div>
      </div>

      {/* Laser line keyframe animation */}
      <style>{`
        @keyframes scanLine {
          0% { top: 10px; opacity: 0.8; }
          50% { opacity: 1; }
          100% { top: calc(100% - 10px); opacity: 0.8; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        #qr-reader-target video {
          border-radius: 1rem;
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
}
