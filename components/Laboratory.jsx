"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Icon from "./Icons";
import HalloweenStage, { Ghost } from "./HalloweenStage";
import AppHaunting from "./AppHaunting";
import KiroBadge from "./KiroBadge";
import NightShiftScene from "./NightShiftScene";
import RecoveryTools from './RecoveryTools';
import NotificationSettings from './NotificationSettings';
import {loadSession,saveSession,clearSession} from '../lib/session-store';
import {savedPush,sendPush} from '../lib/push-client';
import Floppy from "./Floppy";
import EngineNav from "./EngineNav";
import ArtifactView from "./ArtifactView";
import {
  openArchiveInWorker,
  hashBytes,
  decodeInWorker,
  saveBlob,
  modernFile,
  buildRecoveryBundle,
  formatSize,
  hexDump,
  MAX_TOTAL_BYTES,
} from "../lib/recovery";
const fileIcon = (name) =>
  /\.(pcx|bmp|png|jpe?g)$/i.test(name)
    ? "image"
    : /\.dbf$/i.test(name)
      ? "table"
      : /\.(ans|txt)$/i.test(name)
        ? "terminal"
        : "file";
const formatLabel = (name) => name.split(".").at(-1).toUpperCase();
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export default function Laboratory({
  initialView = null,
  initialArtifact = null,
  initialNotes = false,
} = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const [manifest, setManifest] = useState(null),
    [artifacts, setArtifacts] = useState([]),
    [selected, setSelected] = useState(null),
    [results, setResults] = useState({}),
    [digests, setDigests] = useState({}),
    [tab, setTab] = useState("recovered"),
    [busy, setBusy] = useState(false),
    [exporting, setExporting] = useState(false),
    [progress, setProgress] = useState(0),
    [status, setStatus] = useState("Awaiting media"),
    [error, setError] = useState(""),
    [sound, setSound] = useState(true),
    [notes, setNotes] = useState(
      initialNotes || (typeof window !== "undefined" && window.location.pathname === "/notes")
    ),
    [modern, setModern] = useState(false),
    [dragging, setDragging] = useState(false),
    [toast, setToast] = useState("");
  const [showLobby, setShowLobby] = useState(
    initialView === "lobby" || (typeof window !== "undefined" && window.location.pathname === "/lobby")
  );
  const [collectionOpen,setCollectionOpen]=useState(false);
  const collectionRef=useRef(null);
  useEffect(()=>{if(!collectionOpen)return;const prior=document.activeElement;const layout=matchMedia('(max-width:850px)');const resized=e=>{if(!e.matches)setCollectionOpen(false)};layout.addEventListener('change',resized);const panel=collectionRef.current;panel?.querySelector('button')?.focus();const key=e=>{if(e.key==='Escape'){e.preventDefault();setCollectionOpen(false)}if(e.key==='Tab'){const els=[...panel.querySelectorAll('button:not(:disabled),a[href],input,select')].filter(el=>el.getClientRects().length);const first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);layout.removeEventListener('change',resized);prior?.focus()}},[collectionOpen]);
  const [sessionReady,setSessionReady]=useState(false),[storageStatus,setStorageStatus]=useState('Restoring session…'),[storageError,setStorageError]=useState(''),[tools,setTools]=useState(false),[pushSettings,setPushSettings]=useState(false);
  const saveQueue=useRef(Promise.resolve()),hydrating=useRef(true),autosaveAllowed=useRef(false);
  const inputRef = useRef(null),
    request = useRef(0),
    audioRef = useRef(null),
    resultsRef = useRef({}),
    toastTimer = useRef(null),
    notesRef = useRef(null),
    workbenchTopRef = useRef(null);
  const artifact = artifacts.find((a) => a.id === selected),
    result = results[selected];

  const scrollToWorkbench = useCallback(() => {
    setTimeout(() => {
      if (workbenchTopRef.current) {
        const reduced =
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        workbenchTopRef.current.scrollIntoView({
          behavior: reduced ? "auto" : "smooth",
          block: "start",
        });
      }
    }, 60);
  }, []);

  const dismissNotes = useCallback(() => {
    setNotes(false);
    if (pathname === "/notes") {
      if (showLobby) {
        router.push("/lobby", { scroll: false });
      } else if (artifact) {
        router.push(`/archive/${encodeURIComponent(artifact.name)}`, { scroll: false });
      } else {
        router.push("/", { scroll: false });
      }
    }
  }, [pathname, showLobby, artifact, router]);

  const openNotes = useCallback(() => {
    setNotes(true);
    router.push("/notes", { scroll: false });
  }, [router]);

  const ejectDisk = useCallback(async () => {
    beep();
    try {
      await saveQueue.current.catch(() => {});
      await clearSession();
    } catch {
      // ignore
    }
    autosaveAllowed.current = true;
    setStorageError("");
    request.current++;
    resultsRef.current = {};
    setResults({});
    setDigests({});
    setArtifacts([]);
    setSelected(null);
    setBusy(false);
    setError("");
    setStatus("Awaiting media");
    setStorageStatus("Local session ready");
    setShowLobby(true);
    if (pathname !== "/lobby") {
      router.push("/lobby", { scroll: false });
    }
    notify("Drive A: ejected. Media unmounted.");
  }, [pathname, router]);

  useEffect(()=>{
    let live=true;
    (async()=>{try{const saved=await loadSession();if(!live)return;autosaveAllowed.current=true;if(saved&&saved.artifacts&&saved.artifacts.length){setSound(saved.sound);setArtifacts(saved.artifacts);let chosen=null;if(initialArtifact){chosen=saved.artifacts.find(a=>a.name.toLowerCase()===initialArtifact.toLowerCase()||a.id===initialArtifact)}if(!chosen){chosen=saved.artifacts.find(a=>a.id===saved.selectedId)||saved.artifacts[0]}if(chosen){await inspect(chosen,{},true);if(!live)return;setTab(saved.tab);setModern(saved.modern)}setStorageStatus('Saved on this browser')}else setStorageStatus('Local session ready');}
    catch(e){if(live)setStorageError(e.message)}finally{if(live){hydrating.current=false;setSessionReady(true)}}})();
    return()=>{live=false};
  },[initialArtifact]);
  useEffect(()=>{
    if(!sessionReady||hydrating.current||!autosaveAllowed.current)return;
    setStorageStatus('Saving locally…');
    const record={schemaVersion:1,artifacts,selectedId:selected,tab,modern,sound};
    saveQueue.current=saveQueue.current.catch(()=>{}).then(()=>saveSession(record)).then(()=>{setStorageStatus('Saved on this browser');setStorageError('')}).catch(e=>{setStorageStatus('Session not saved');setStorageError(e.message)});
  },[sessionReady,artifacts,selected,tab,modern,sound]);
  async function forgetSession(){if(!window.confirm('Forget the saved files and session in this browser? Downloaded files are unaffected.'))return;try{await saveQueue.current.catch(()=>{});await clearSession();autosaveAllowed.current=true;setStorageError('');request.current++;resultsRef.current={};setResults({});setDigests({});setArtifacts([]);setSelected(null);setBusy(false);setError('');setStatus('Awaiting media');notify('Saved files cleared from this browser.')}catch(e){setStorageError(e.message)}}
  useEffect(() => {
    fetch("/demo/manifest.json")
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then(setManifest)
      .catch(() =>
        setError(
          "The demonstration disk is unavailable. You can still open your own files.",
        ),
      );
    return () => clearTimeout(toastTimer.current);
  }, []);

  useEffect(() => {
    if (initialArtifact && manifest && sessionReady && !artifacts.length && !busy) {
      loadDemo(initialArtifact);
    }
  }, [initialArtifact, manifest, sessionReady, artifacts.length, busy]);

  useEffect(() => {
    if (!pathname) return;
    if (pathname === "/lobby") {
      setShowLobby(true);
      setNotes(false);
    } else if (pathname === "/notes") {
      setNotes(true);
    } else if (pathname.startsWith("/archive/")) {
      setShowLobby(false);
      setNotes(false);
      const targetName = decodeURIComponent(pathname.replace("/archive/", ""));
      if (artifacts.length > 0) {
        const match = artifacts.find(
          (a) =>
            a.name.toLowerCase() === targetName.toLowerCase() ||
            a.id === targetName
        );
        if (match && match.id !== selected) {
          inspect(match, {});
        }
      }
    } else if (pathname === "/") {
      if (initialView !== "lobby") {
        setShowLobby(false);
      }
      setNotes(false);
    }
  }, [pathname, artifacts, selected, initialView]);

  useEffect(() => {
    if (!notes) return;
    const prior = document.activeElement;
    notesRef.current?.focus();
    const key = (e) => {
      if (e.key === "Escape") {
        dismissNotes();
        return;
      }
      if (e.key === "Tab") {
        const els = [
          ...notesRef.current.querySelectorAll('button,a,[tabindex="0"]'),
        ];
        const first = els[0],
          last = els.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      prior?.focus();
    };
  }, [notes]);
  function notify(message) {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4500);
  }
  function beep() {
    if (!sound) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      const context = (audioRef.current ??= new Audio());
      context.resume().catch(()=>{});
      for (let i = 0; i < 4; i++) {
        const o = context.createOscillator(),
          g = context.createGain();
        o.type = "square";
        o.frequency.value = 120 + i * 47;
        g.gain.setValueAtTime(0.014, context.currentTime + i * 0.06);
        g.gain.exponentialRampToValueAtTime(
          0.0001,
          context.currentTime + i * 0.06 + 0.045,
        );
        o.connect(g);
        g.connect(context.destination);
        o.start(context.currentTime + i * 0.06);
        o.stop(context.currentTime + i * 0.06 + 0.05);
      }
    } catch {}
  }
  async function inspect(a, cache = resultsRef.current, silent = false) {
    const token = ++request.current;
    setSelected(a.id);
    setTab("recovered");
    setError("");
    setModern(false);
    if (cache[a.id]) {
      setStatus("Artifact decoded");
      setBusy(false);
      setProgress(100);
      return;
    }
    setBusy(true);
    setProgress(18);
    setStatus("Reading the original bytes");
    if(!silent)beep();
    try {
      const digest = await hashBytes(a.bytes);
      if (token !== request.current) return;
      setDigests((d) => ({ ...d, [a.id]: digest }));
      const decoded = await decodeInWorker(a);
      if (token !== request.current) return;
      setProgress(76);
      setStatus("Mapping the recovered structure");
      await wait(380);
      if (token !== request.current) return;
      resultsRef.current = { ...resultsRef.current, [a.id]: decoded };
      setResults(resultsRef.current);
      setDigests((d) => ({ ...d, [a.id]: digest }));
      setProgress(100);
      setStatus("Artifact decoded • original unchanged");
    } catch (e) {
      if (token === request.current) {
        setError(e.message);
        setStatus("Artifact could not be decoded");
      }
    } finally {
      if (token === request.current) setBusy(false);
    }
  }
  async function installFiles(files, source, targetArtifactName) {
    if (files.length === 0) throw Error("No readable files were found.");
    if (
      files.length > 32 ||
      files.reduce((n, f) => n + f.bytes.length, 0) > MAX_TOTAL_BYTES
    )
      throw Error("A session supports up to 32 files and 16 MiB total.");
    const prepared = files.map((f) => ({
      ...f,
      id: crypto.randomUUID(),
      source,
    }));
    resultsRef.current = {};
    setResults({});
    setDigests({});
    autosaveAllowed.current=true;
    setShowLobby(false);
    setCollectionOpen(false);
    setArtifacts(prepared);
    let chosen = prepared[0];
    if (targetArtifactName) {
      const match = prepared.find(
        (a) =>
          a.name.toLowerCase() === targetArtifactName.toLowerCase() ||
          a.id === targetArtifactName
      );
      if (match) chosen = match;
    }
    setSelected(chosen.id);
    // Persist originals before decoding, including when decoding later rejects the format.
    await saveSession({schemaVersion:1,artifacts:prepared,selectedId:chosen.id,tab:'recovered',modern:false,sound}).catch(e=>setStorageError(e.message));
    await inspect(chosen, {});
    scrollToWorkbench();
  }
  async function loadDemo(targetArtifactName) {
    if (!sessionReady || busy || !manifest) return;
    setBusy(true);
    setError("");
    setStatus("Inserting MIRA / 1996");
    beep();
    try {
      const files = await Promise.all(
        manifest.files.map(async (f) => {
          const r = await fetch(f.url);
          if (!r.ok)
            throw Error("A demonstration artifact could not be loaded.");
          return { name: f.name, bytes: new Uint8Array(await r.arrayBuffer()) };
        }),
      );
      await installFiles(
        files,
        "demo",
        typeof targetArtifactName === "string" ? targetArtifactName : initialArtifact
      );
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }
  async function upload(fileList) {
    if (!sessionReady || busy || exporting) return;
    setError("");
    setBusy(true);
    setStatus("Mounting local media");
    try {
      let files = [];
      for (const f of [...fileList]) {
        if (f.size > 8 * 1024 * 1024)
          throw Error("Keep each upload under 8 MiB.");
        files.push(
          ...(await openArchiveInWorker(
            new Uint8Array(await f.arrayBuffer()),
            f.name,
          )),
        );
      }
      await installFiles(files, "local");
    } catch (e) {
      setError(e.message);
      setBusy(false);
      setStatus("Media was not mounted");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }
  async function exportCurrent() {
    if (!result || !artifact) return;
    try {
      const file = await modernFile(result, artifact.name);
      saveBlob(new Blob([file.bytes], { type: file.type }), file.name);
      notify(`${file.name} exported. Original unchanged.`);
    } catch (e) {
      setError(e.message);
    }
  }
  async function exportAll() {
    if (!artifacts.length || exporting || busy) return;
    setExporting(true);
    setError("");
    try {
      const blob = await buildRecoveryBundle(
        artifacts,
        resultsRef.current,
        (n, total) => setStatus(`Preparing recovery bundle ${n}/${total}`),
      );
      saveBlob(blob, "THE-LAST-SAVE-recovery.zip");
      setStatus("Recovery bundle exported");
      notify("Originals, modern files, and integrity manifest exported.");
      if(savedPush()?.ticket)sendPush('recovery-complete',artifacts.length).catch(e=>notify('Bundle exported. Push: '+e.message));
    } catch (e) {
      setError(e.message);
    } finally {
      setExporting(false);
    }
  }
  return (
    <div
      className={"laboratory"+(collectionOpen?" collection-open":"")}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        upload(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".zip,.pcx,.bmp,.png,.jpg,.jpeg,.dbf,.rtf,.ans,.txt"
        onChange={(e) => upload(e.target.files)}
        className="visually-hidden"
        aria-label="Choose supported image, legacy files or a ZIP archive"
      />
      <header className="site-header">
        <a className="brand" href="/" aria-label="The Last Save home">
          <span className="brand-mark">
            <i />
            <i />
            <i />
            <i />
          </span>
          <strong>
            THE LAST SAVE<span>THE HAUNTED ARCHIVE</span>
          </strong>
        </a>
        <div className="header-center">
          <span className="status-dot" /> GRAVEYARD SHIFT / LOCAL-FIRST
        </div>
        <div className="header-actions">
          <button className="collection-toggle icon-button" aria-label="Open collection" aria-expanded={collectionOpen} aria-controls="archive-collection" onClick={()=>setCollectionOpen(true)}><Icon name="folder"/></button>
          <button className="header-tool-btn" disabled={!sessionReady||busy||exporting} onClick={()=>setTools(true)} title="Recovery tools: Parity capsule protection, reconstruction & disk carving">
            <Icon name="shield" size={13}/>
            <span>Recovery tools</span>
          </button>
          <button className="icon-button" aria-label="Open notifications" title="Push notifications" onClick={()=>setPushSettings(true)}><Icon name="bell"/></button>
          <button
            className="sound-button"
            aria-pressed={sound}
            onClick={() => setSound(!sound)}
            title="Toggle synthesized drive sounds"
          >
            <Icon name={sound ? "sound" : "mute"} />
            <span>SOUND {sound ? "ON" : "OFF"}</span>
          </button>
          <button
            className="icon-button"
            onClick={openNotes}
            aria-label="Open field notes"
          >
            <Icon name="info" />
          </button>
          <span className="edition">KIROWEEN / MIRA</span>
        </div>
      </header>
      <div className="app-body">
        {collectionOpen&&<button className="collection-backdrop" aria-label="Close collection backdrop" onClick={()=>setCollectionOpen(false)}/>}
        <aside className="archive-sidebar" id="archive-collection" ref={collectionRef} role={collectionOpen?'dialog':undefined} aria-modal={collectionOpen?true:undefined} aria-label="The collection">
          <button className="collection-close icon-button" aria-label="Close collection" onClick={()=>setCollectionOpen(false)}><Icon name="close"/></button>
          <div className="sidebar-label">
            THE COLLECTION<span>01</span>
          </div>
          <div className="collection-title">
            <div className="archive-stamp">
              M<span>96</span>
            </div>
            <div>
              <h2>MIRA / 1996</h2>
              <p>The haunted observatory</p>
            </div>
          </div>
          <div className="sidebar-rule" />
          <div className="sidebar-section-label">
            <span>MOUNTED ARTIFACTS</span>
            <div className="sidebar-section-ctrls">
              <span>{String(artifacts.length).padStart(2, "0")}</span>
              {artifacts.length > 0 && (
                <button
                  className="sidebar-eject-btn"
                  onClick={ejectDisk}
                  title="Eject disk and unmount media"
                  aria-label="Eject disk"
                >
                  ⏏ Eject
                </button>
              )}
            </div>
          </div>
          <div className="artifact-list" role="region" aria-label="Archive artifacts">
            {artifacts.length ? (
              artifacts.map((a, i) => (
                <button
                  key={a.id}
                  disabled={busy}
                  className={
                    "artifact-item " + (!showLobby && selected === a.id ? "active" : "")
                  }
                  aria-current={!showLobby && selected === a.id ? "true" : undefined}
                  onClick={() => {
                    inspect(a);
                    setShowLobby(false);
                    setCollectionOpen(false);
                    router.push(`/archive/${encodeURIComponent(a.name)}`, { scroll: false });
                  }}
                >
                  <span className="artifact-index">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Icon name={fileIcon(a.name)} />
                  <span className="artifact-name">
                    {a.name}
                    <small>
                      {formatSize(a.bytes.length)} / {formatLabel(a.name)}
                    </small>
                  </span>
                  {results[a.id] ? (
                    <span className="decoded-dot" title="Decoded" />
                  ) : (
                    <Icon name="arrow" size={13} />
                  )}
                </button>
              ))
            ) : (
              <div className="empty-archive-slot">
                <span className="empty-title">
                  <Icon name="file" size={13} /> NO MEDIA MOUNTED
                </span>
                <p className="empty-text">
                  Drive A: is empty. Insert the demo disk or open your own files to inspect artifacts.
                </p>
                <button
                  className="sidebar-insert-btn"
                  onClick={() => {
                    loadDemo();
                    if (pathname === "/lobby") router.push("/", { scroll: false });
                  }}
                  disabled={busy || !manifest}
                >
                  <Icon name="arrow" size={12} />
                  <span>Insert demo disk</span>
                </button>
              </div>
            )}
          </div>
          <div className="sidebar-rule" />
          <div className="sidebar-section-label">
            HAUNTED LOBBY
            <span>{showLobby || !artifacts.length ? "ACTIVE" : "✦"}</span>
          </div>
          <div className="sidebar-lobby-section">
            <button
              className={"artifact-item lobby-nav-item " + (showLobby || !artifacts.length ? "active" : "")}
              onClick={() => {
                if (artifacts.length > 0) {
                  if (showLobby) {
                    const cur = artifacts.find((a) => a.id === selected);
                    router.push(cur ? `/archive/${encodeURIComponent(cur.name)}` : "/", { scroll: false });
                    setShowLobby(false);
                    scrollToWorkbench();
                  } else {
                    router.push("/lobby", { scroll: false });
                    setShowLobby(true);
                  }
                } else {
                  router.push("/lobby", { scroll: false });
                  setShowLobby(true);
                }
                setCollectionOpen(false);
              }}
              aria-label={
                artifacts.length > 0
                  ? showLobby
                    ? "Back to workbench recovery view"
                    : "Visit haunted lobby scene"
                  : "Haunted observatory scene active"
              }
              aria-pressed={showLobby || !artifacts.length}
            >
              <span className="artifact-index">✦</span>
              <Ghost className="lobby-nav-ghost" />
              <span className="artifact-name">
                {artifacts.length > 0
                  ? showLobby
                    ? "Back to workbench"
                    : "Visit haunted lobby"
                  : "Haunted observatory"}
                <small>
                  {artifacts.length > 0
                    ? showLobby
                      ? "Return to file recovery"
                      : "Floppy scene & creature stage"
                    : "Creature stage & demo disk"}
                </small>
              </span>
              <span className="key-hint" aria-hidden="true">
                {showLobby ? "↩" : "↗"}
              </span>
            </button>
          </div>
          <div className="sidebar-bottom">
            <div className="haunt-dock-slot"/>
            <div className="session-status" role="status">{storageStatus}<button className="text-button" disabled={!sessionReady||busy||exporting} onClick={forgetSession}>Forget session</button></div>
            <div className="privacy-note">
              <Icon name="shield" size={17} />
              <span>
                Your files stay on this device.
              </span>
            </div>
            <button
              className="sidebar-tool-button"
              onClick={() => setTools(true)}
              disabled={!sessionReady || busy || exporting}
            >
              <span><Icon name="shield" size={13} /> Recovery tools</span>
              <span className="key-hint">↗</span>
            </button>
            <button
              className="upload-button"
              onClick={() => inputRef.current?.click()}
              disabled={!sessionReady || busy || exporting}
            >
              <Icon name="upload" size={16} />
              <span>Open your own files</span>
              <span className="key-hint">↗</span>
            </button>
            <p className="supported">PCX · BMP · PNG · JPEG · DBF · RTF · ANSI · ZIP</p>
          </div>
        </aside>
        <main className="main-area" inert={collectionOpen?true:undefined}>
          {storageError&&<div className="global-error" role="alert">{storageError} Your current files remain available in this tab.</div>}
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="tiny-cross">✳</span> A SECOND LIFE FOR
                DEAD FORMATS
              </div>
              <h1>
                The last <em>save.</em>
                <span className="heading-period">®</span>
              </h1>
            </div>
            <KiroBadge/>
          </div>
          <EngineNav active="archive"/>
          <NightShiftScene/>
          <div className="workbench-top" ref={workbenchTopRef}>
            <div>
              <span className="bay-number">A:</span>
              <span>RECOVERY BAY</span>
              <span className="workbench-status">
                <i className={busy ? "blinking" : ""} />
                {artifacts.length ? "MEDIA MOUNTED" : "AWAITING MEDIA"}
              </span>
            </div>
            <div className="workbench-links">
              {artifacts.length > 0 && (
                <>
                  <button className="text-button eject-button" onClick={ejectDisk} title="Eject current disk">
                    ⏏ Eject disk
                  </button>
                  <button
                    className="text-button haunted-lobby-link"
                    onClick={() => {
                      if (showLobby) {
                        const cur = artifacts.find((a) => a.id === selected);
                        router.push(cur ? `/archive/${encodeURIComponent(cur.name)}` : "/", { scroll: false });
                        setShowLobby(false);
                        scrollToWorkbench();
                      } else {
                        router.push("/lobby", { scroll: false });
                        setShowLobby(true);
                      }
                    }}
                  >
                    {showLobby ? "Back to workbench" : "Visit haunted lobby"} <span aria-hidden="true">✦</span>
                  </button>
                </>
              )}
              <button onClick={openNotes} className="text-button">Field notes <Icon name="arrow" size={14} /></button>
            </div>
          </div>
          {!artifacts.length || showLobby ? (
            <section
              className="landing-bay"
              aria-label="Insert a demonstration disk"
            >
              <div className="hero-copy">
                <div className="specimen-label">HALLOWEEN / THE RESURRECTION LAB</div>
                <h2>
                  Dead files.
                  <br />
                  Still <em>haunting.</em>
                </h2>
                <div className="haunt-ribbon"><span aria-hidden="true">✦</span> SOMETHING IN THIS DISK IS STILL ALIVE.</div>
                <p>
                  The machines are dead. The files are restless.
                  <br />
                  Enter the archive. Wake what’s still inside.
                  <br />
                  All file recovery stays on your device.
                </p>
                <button
                  className="primary-button"
                  onClick={() => {
                    if (artifacts.length && showLobby) {
                      const cur = artifacts.find((a) => a.id === selected);
                      router.push(cur ? `/archive/${encodeURIComponent(cur.name)}` : "/", { scroll: false });
                      setShowLobby(false);
                      scrollToWorkbench();
                    } else {
                      loadDemo();
                      if (pathname === "/lobby") router.push("/", { scroll: false });
                    }
                  }}
                  disabled={busy || !manifest}
                >
                  <span>
                    {busy ? "READING THE DISK" : (artifacts.length && showLobby ? "ENTER THE ARCHIVE" : "INSERT DEMO DISK")}
                  </span>
                  <Icon name={busy ? "scan" : "arrow"} size={19} />
                </button>
                <div className="demo-caption">
                  <a
                    href={manifest?.zipUrl || "/demo/MIRA-LAST-SAVE.zip"}
                    download
                  >
                    DOWNLOAD DEMO DISK (.ZIP) ↓
                  </a>
                  <span>1996 MIRA CASE · REAL LEGACY FILES</span>
                </div>
              </div>
              <Floppy
                busy={busy}
                onInsert={() => {
                  if (artifacts.length && showLobby) {
                    const cur = artifacts.find((a) => a.id === selected);
                    router.push(cur ? `/archive/${encodeURIComponent(cur.name)}` : "/", { scroll: false });
                    setShowLobby(false);
                    scrollToWorkbench();
                  } else {
                    loadDemo();
                    if (pathname === "/lobby") router.push("/", { scroll: false });
                  }
                }}
              />
              <HalloweenStage/>
              <div className="lobby-disk-caption"><span aria-hidden="true">＋</span> 1996 DEMO DISK · 5 LEGACY ARTIFACTS</div>
              <div className="bay-bottom">
                <div>
                  <span className="little-square" /> NO FILES WERE HARMED
                </div>
                <span>EST. 1996 → RESTORED TODAY</span>
                <a
                  href="https://yafetport.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bay-creator"
                  aria-label="Created by Japheth — visit portfolio and contact"
                >
                  CREATED BY JAPHETH <span>↗</span>
                </a>
                <span>1.44 MB OF POSSIBILITY</span>
              </div>
            </section>
          ) : (
            <section
              className="active-bay"
              aria-label="Artifact recovery workbench"
            >
              <div className="artifact-toolbar">
                <div className="current-file">
                  <Icon name={fileIcon(artifact?.name || "")} />
                  <strong>{artifact?.name}</strong>
                  <span>
                    {result?.format || formatLabel(artifact?.name || "FILE")}
                  </span>
                </div>
                <div className="artifact-actions">
                  <button
                    className="text-button"
                    onClick={() => setTools(true)}
                    title="Generate parity capsule or reconstruct"
                  >
                    <Icon name="shield" size={14} />
                    <span>Protect</span>
                  </button>
                  <button
                    className="text-button"
                    onClick={exportCurrent}
                    disabled={!result || busy}
                  >
                    <Icon name="download" size={14} />
                    <span>
                      Export{" "}
                      {result?.kind === "image"
                        ? "PNG"
                        : result?.kind === "table"
                          ? "CSV"
                          : "text"}
                    </span>
                  </button>
                  <button
                    className="icon-button"
                    onClick={openNotes}
                    aria-label="Read format limitations"
                  >
                    <Icon name="info" size={16} />
                  </button>
                </div>
              </div>
              <div className="inspector-layout">
                <div className="viewer-column">
                  <div
                    className="viewer-tabs"
                    role="tablist"
                    aria-label="Artifact views"
                    onKeyDown={(e) => {
                      const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
                      if (!keys.includes(e.key)) return;
                      e.preventDefault();
                      const tabs = [
                        ...e.currentTarget.querySelectorAll("[role=tab]"),
                      ];
                      const current = tabs.indexOf(document.activeElement);
                      const index =
                        e.key === "Home"
                          ? 0
                          : e.key === "End"
                            ? tabs.length - 1
                            : (current +
                                (e.key === "ArrowRight" ? 1 : -1) +
                                tabs.length) %
                              tabs.length;
                      tabs[index].focus();
                      setTab(tabs[index].dataset.view);
                    }}
                  >
                    {[
                      ["recovered", "Recovered"],
                      ["bytes", "Source bytes"],
                      ["report", "Recovery report"],
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        role="tab"
                        data-view={key}
                        aria-selected={tab === key}
                        onClick={() => setTab(key)}
                      >
                        {key === "bytes" && <Icon name="hex" size={12} />}{" "}
                        {label}
                        {tab === key && <span />}
                      </button>
                    ))}
                    <div className="view-switch">
                      <button
                        onClick={() => setModern(!modern)}
                        disabled={!result || tab !== "recovered"}
                        aria-pressed={modern}
                        title="Toggle the modern presentation"
                      >
                        {modern ? "MODERN" : artifact.provenance ? "DERIVED" : "ORIGINAL"}
                      </button>
                    </div>
                  </div>
                  <div
                    className={"viewer-surface " + (busy ? "processing" : "")}
                    role="tabpanel"
                    aria-label={
                      tab === "bytes"
                        ? "Source bytes"
                        : tab === "report"
                          ? "Recovery report"
                          : "Recovered artifact"
                    }
                  >
                    {busy ? (
                      <div className="scanning-view">
                        <div className="scanner-orbit">
                          <Icon name="scan" size={39} />
                        </div>
                        <span className="eyebrow">READING THE ORIGINAL</span>
                        <h3>Listening to the past.</h3>
                        <p>{status}</p>
                        <div className="progress-track">
                          <i style={{ width: progress + "%" }} />
                        </div>
                      </div>
                    ) : error && !result && tab === "recovered" ? (
                      <div className="decode-failure">
                        <Icon name="file" size={36} />
                        <h3>This one is still a mystery.</h3>
                        <p>{error}</p>
                        <p>
                          The original file hasn’t been changed. Inspect its
                          bytes or try a supported format.
                        </p>
                      </div>
                    ) : tab === "bytes" ? (
                      <div className="hex-stage">
                        <div className="hex-heading">
                          <span>OFFSET</span>
                          <span>HEX / BASE 16</span>
                          <span>ASCII</span>
                        </div>
                        <pre>{hexDump(artifact.bytes)}</pre>
                        <p>
                          Showing the first{" "}
                          {Math.min(
                            artifact.bytes.length,
                            1024,
                          ).toLocaleString()}{" "}
                          of {artifact.bytes.length.toLocaleString()} bytes.
                          Source is read-only.
                        </p>
                      </div>
                    ) : tab === "report" ? (
                      <div className="report-stage">
                        <div className="report-check">
                          <Icon name="check" size={30} />
                        </div>
                        <div className="eyebrow">CHAIN OF CUSTODY</div>
                        <h3>
                          {result ? "Readable again." : "Not decoded."}
                          <br />
                          <em>{artifact.provenance ? "Its source recorded." : "Still the original."}</em>
                        </h3>
                        <p>
                          {result
                            ? "Deterministic decoding converted this artifact’s existing bytes. "
                            : "This artifact could not be decoded within the supported formats. "}
                          {artifact.provenance?.kind==='parity-repair'?' Damaged blocks were reconstructed using prior parity and verified against its SHA-256. The damaged input is retained separately.':' Original input data was not overwritten.'}
                        </p>
                        <dl>
                          <div>
                            <dt>Method</dt>
                            <dd>
                              {result
                                ? result.format + " decoder"
                                : "Unsupported or invalid structure"}
                            </dd>
                          </div>
                          <div>
                            <dt>Source</dt>
                            <dd>
                              {artifact.source === "demo"
                                ? "Original fictional demo fixture"
                                : "Your local file"}
                            </dd>
                          </div>
                          {artifact.provenance&&<div><dt>Recovery source</dt><dd>{artifact.provenance.sourceName}{artifact.provenance.offset!==undefined?' · byte offset '+artifact.provenance.offset:''}<br/>{artifact.provenance.kind==='parity-repair'?'Parity-verified reconstruction':'Contiguous signature candidate; deletion status unknown'}</dd></div>}
                          <div>
                            <dt>SHA-256</dt>
                            <dd className="hash-value">
                              {digests[selected] ||
                                "Available in exported manifest"}
                            </dd>
                          </div>
                        </dl>
                        {result?.warnings?.length > 0 && (
                          <div className="warnings">
                            <strong>DECODER NOTES</strong>
                            {result.warnings.map((w, i) => (
                              <p key={i}>{w}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <ArtifactView result={result} modern={modern} />
                    )}
                  </div>
                  <div className="viewer-footer">
                    <span className="status-dot" />
                    {busy ? "READING" : result ? "DECODED" : "NOT DECODED"}
                    <span className="viewer-footer-right">
                      {artifact.source === "demo"
                        ? "FICTIONAL ARCHIVE / REAL DECODER"
                        : "LOCAL FILE / PRIVATE SESSION"}
                    </span>
                  </div>
                </div>
                <aside className="evidence-panel">
                  <div className="evidence-heading">
                    ARTIFACT DOSSIER
                    <Icon name="scan" size={14} />
                  </div>
                  <div className="evidence-format">
                    {formatLabel(artifact?.name || "FILE")}
                    <span>{result?.era || "DIGITAL ARTIFACT"}</span>
                  </div>
                  <p className="format-description">
                    {result?.description || "Awaiting format analysis."}
                  </p>
                  <dl className="metadata">
                    <div>
                      <dt>Original size</dt>
                      <dd>{formatSize(artifact.bytes.length)}</dd>
                    </div>
                    {result?.metadata?.map((m, i) => (
                      <div key={i}>
                        <dt>{m.label}</dt>
                        <dd>{String(m.value)}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="integrity-badge">
                    <Icon name="shield" size={19} />
                    <div>
                      {artifact.provenance ? "DERIVED / SOURCE RECORDED" : "ORIGINAL UNTOUCHED"}
                      <small>SHA-256 integrity fingerprint</small>
                    </div>
                  </div>
                  {result?.warnings?.length > 0 && (
                    <button
                      className="decoder-notes"
                      onClick={() => setTab("report")}
                    >
                      {result.warnings.length} decoder note
                      {result.warnings.length !== 1 ? "s" : ""}
                      <Icon name="arrow" size={13} />
                    </button>
                  )}
                  <div className="artifact-evidence-number">
                    {String(artifacts.indexOf(artifact) + 1).padStart(3, "0")}
                    <span>ARCHIVE / MIRA</span>
                  </div>
                </aside>
              </div>
            </section>
          )}
          {error && !busy && (
            <div className="global-error" role="alert">
              <Icon name="info" size={16} />
              {error}
              <button onClick={() => setError("")} aria-label="Dismiss error">
                <Icon name="close" size={14} />
              </button>
            </div>
          )}
          <div className="session-strip">
            <div className="session-caption">
              <span className="status-dot" />
              <span>
                {busy || exporting
                  ? status
                  : artifacts.length
                    ? `${Object.keys(results).length} OF ${artifacts.length} ARTIFACTS DECODED`
                    : "THE DEAD FORMATS ARE WAITING. BRING THEM BACK."}
              </span>
            </div>
            {artifacts.length ? (
              <button
                className="bundle-button"
                onClick={exportAll}
                disabled={!sessionReady || busy || exporting}
              >
                <span>
                  {exporting ? "PREPARING BUNDLE…" : "EXPORT RECOVERY BUNDLE"}
                </span>
                <Icon name="download" size={16} />
              </button>
            ) : (
              <div className="supported-label">
                BUILT FOR CURIOSITY. ENGINEERED FOR EVIDENCE.
              </div>
            )}
          </div>
          <a className="kiro-love-note" href="https://kiro.dev/" target="_blank" rel="noopener noreferrer"><span className="kiro-mini-mark" aria-hidden="true"/><span><strong>For the love of Kiro. For the life of dead files.</strong><small>A Kiroween experiment by Japheth · Kiro enthusiast &amp; aspiring Kiro Ambassador.</small></span><Icon name="arrow" size={18}/></a>
          <footer className="main-footer">
            <span>DEAD FORMATS. UNFINISHED BUSINESS.</span>
            <button onClick={openNotes}>
              What can be recovered? <span>↗</span>
            </button>
            <a
              href="https://yafetport.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="creator-credit"
              aria-label="Crafted by Japheth — visit portfolio and contact"
            >
              CRAFTED BY JAPHETH <span>↗</span>
            </a>
            <span>
              NO CLOUD REQUIRED <Icon name="shield" size={12} />
            </span>
          </footer>
        </main>
      </div>
      <div className="mobile-haunt-slot"/>
      {dragging && (
        <div className="drop-overlay">
          <Icon name="upload" size={48} />
          <h2>Let the past in.</h2>
          <p>Drop legacy files or a ZIP archive.</p>
          <small>8 MiB per file · 16 MiB per session · 32 files</small>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" />
          {toast}
        </div>
      )}
      {notes && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) dismissNotes();
          }}
        >
          <section
            className="field-notes"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notes-title"
            ref={notesRef}
            tabIndex={-1}
          >
            <div className="notes-top">
              <span>THE LAST SAVE / FIELD NOTES</span>
              <button
                className="icon-button"
                onClick={dismissNotes}
                aria-label="Close field notes"
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="eyebrow">FIELD GUIDE TO THE DIGITAL AFTERLIFE</div>
            <h2 id="notes-title">
              The format died.
              <br />
              <em>The file didn’t.</em>
            </h2>
            <p>
              Open old files, inspect their bytes, and export usable copies. File processing happens in your browser; optional push uses this site’s server functions without uploading your files.
            </p>
            <div className="format-guide">
              <div><b>PCX / BMP</b><span>Supported image subsets → PNG</span></div>
              <div><b>PNG / JPEG</b><span>Browser-decoded pixels → PNG</span></div>
              <div><b>dBASE III</b><span>Active records → CSV; deleted rows omitted</span></div>
              <div><b>RTF</b><span>Plain text → UTF-8; styling and embedded objects omitted</span></div>
              <div><b>ANSI / TEXT</b><span>UTF-8 / CP437 preview → text; exported CSI controls omitted</span></div>
              <div><b>ZIP</b><span>Stored / deflate only; no encryption, ZIP64 or data descriptors</span></div>
            </div>
            <section className="notes-detail" aria-label="Session and recovery guide">
              <h3>The haunted observatory</h3>
              <p>Click a pumpkin to toggle the lanterns, click the skeleton to make it dance, or Wake the crew to summon the archive’s ghosts. These decorative interactions never alter your files. Visit haunted lobby lets you return to the scene while keeping your mounted collection; Back to workbench restores the recovery view. The Skeleton Crew companion follows you through the whole app: click it for archive banter, summon ghosts anywhere, and watch it respond to decoding, exports, errors, tabs and dialogs. Haunt: Full / Calm controls the decorative effects and remembers your choice. Reduced-motion settings suppress moving apparitions and cursor embers. The workbench’s persistent Halloween strip has clickable pumpkin lanterns and your pixel bat: Feed the bat sends it on a short flight. Desktop collection controls stay inside a viewport-height rail; long file lists scroll inside it. On mobile, use the folder button to open the collection drawer. The Kiro Afterlife Lab badge is an original Kiroween tribute and links to Kiro.</p>
              <h3>Challenge the engine · Preserve a collection</h3><p>Resurrection proof lets you corrupt a generated image, remove its final block, or exceed the parity limit. It runs the real parity engine in a worker and exports originals, damaged bytes, the earlier capsule and SHA-256 evidence. Preservation desk is a separate local workspace for batch format audits, content search, conversion warnings, duplicate fingerprints and CSV / JSON inventories. Its full bundle retains originals alongside supported modern conversions. Both are available in the application switcher; neither uploads your files.</p>
              <h3>Your saved workspace</h3>
              <p>Original bytes, recovery provenance, selected file, view and sound preference survive reload in this browser. Sessions stay with this browser and site address: localhost and a deployed domain have separate storage. Forget session or clearing site data removes the saved files. Export a bundle for a portable copy; browser storage is not a backup.</p>
              <h3>Sound and exports</h3>
              <p>Sound starts ON for a fresh session and plays after interaction, subject to browser policy. Your preference is saved. Export individual PNG, CSV or UTF-8 files, or a bundle containing imported bytes, supported conversions, SHA-256 fingerprints, warnings and recorded recovery provenance. Derived files are labeled separately from originals.</p>
              <h3>Protect → Reconstruct</h3>
              <p>Recovery tools can export a parity capsule <strong>before damage occurs</strong>. With that earlier capsule, reconstruct at most one damaged or missing 4 KiB block in each eight-block stripe, then verify the complete output against its recorded SHA-256. The damaged input and reconstructed copy are retained separately. More damage, overwritten information or unknown byte shifts may be unrecoverable; this is not arbitrary corruption repair.</p>
              <h3>Disk-image carving</h3>
              <p>Scan up to 64 MiB of raw image bytes for structurally validated, contiguous PNG, BMP and JPEG candidates. Their byte offsets and source hash are recorded. Carving does not restore directories, original names or fragmented files, and cannot determine whether a candidate was deleted. A structural match can still fail pixel decoding.</p>
              <h3>External disks · local Mac only</h3>
              <p>Start the optional read-only Mac companion and pair it in Recovery tools to list external physical disks. A scan reads <strong>only the first 64 MiB</strong> of your selected device. Internal disks are excluded; the helper never writes to the source. Hosted sites can scan uploaded images; the companion requires the local app. Companion safety tests passed using mocks; actual physical-disk recovery remains unverified.</p>
              <h3>Import and processing limits</h3>
              <p>Up to 32 files, 8 MiB per imported file, 16 MiB per session and 4,194,304 image pixels. Decode/archive operations time out after 10 seconds; parity/carving after 30 seconds. Disk-image input has a separate 64 MiB limit; its imported candidates must still fit session limits. Importing files or recovery results replaces the mounted collection—export your current case first if you want a separate copy.</p>
              <h3>Optional VAPID push</h3>
              <p>Use the bell button to enable, test or disable notifications. Vercel needs VAPID environment configuration and browser/OS permission. No account or database is required. Subscription metadata and fixed notification events reach the server; file contents and saved sessions stay local. The browser requests a notification after bundle export. Recovery needs the open tab; closing it stops work. Push-provider acceptance does not guarantee delivery. Live device delivery remains unverified.</p>
              <h3>What the lab can establish</h3>
              <p>Decoders support documented subsets, not every format variant. Unsupported structures are reported, never silently filled with invented content. Hashes establish consistency with the supplied bytes or capsule, not authorship or historical authenticity. Imported scripts are never executed.</p>
            </section>
            <div className="fiction-note">
              <span>ABOUT THE DISK</span>
              <p>
                MIRA and its inhabitants are fictional. Its artifacts are real,
                original binary fixtures generated for this demo. Try your own
                files to test the same decoders.
              </p>
            </div>
            <div className="creator-note">
              <span>ARCHITECT &amp; REPOSITORY KEEPER</span>
              <p>
                Conceived and engineered by <strong>Japheth</strong>. Explore portfolio, other creations, or get in touch at{" "}
                <a
                  href="https://yafetport.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  yafetport.vercel.app <span>↗</span>
                </a>
              </p>
            </div>
            <button className="primary-button" onClick={dismissNotes}>
              BACK TO THE LAB <Icon name="arrow" size={18} />
            </button>
          </section>
        </div>
      )}
      <AppHaunting sessionReady={sessionReady} busy={busy} exporting={exporting} error={error} decodedCount={Object.keys(results).length} selected={showLobby ? null : selected} tab={tab} dialogOpen={notes||tools||pushSettings||collectionOpen}/>
      {tools && (
        <RecoveryTools
          artifact={artifact}
          artifacts={artifacts}
          onSelectArtifact={(a) => inspect(a, {})}
          onRecovered={(files) => installFiles(files, "local")}
          onInsertDemo={loadDemo}
          onClose={() => setTools(false)}
        />
      )}
      {pushSettings&&<NotificationSettings onClose={()=>setPushSettings(false)}/>}
    </div>
  );
}
