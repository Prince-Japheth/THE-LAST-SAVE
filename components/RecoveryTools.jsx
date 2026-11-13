'use client';
import { useState, useRef, useEffect } from 'react';
import Icon from './Icons';
import { recoveryOperation } from '../lib/extra-recovery';
import { saveBlob, hashBytes, formatSize } from '../lib/recovery';

export default function RecoveryTools({
  artifact,
  artifacts = [],
  onSelectArtifact,
  onRecovered,
  onInsertDemo,
  onClose,
}) {
  const [mode, setMode] = useState('protect');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [chosenFile, setChosenFile] = useState(artifact || artifacts[0] || null);

  const capsuleRef = useRef(null);
  const damagedRef = useRef(null);
  const imageRef = useRef(null);
  const dialog = useRef(null);

  useEffect(() => {
    if (artifact) setChosenFile(artifact);
  }, [artifact]);

  useEffect(() => {
    const old = document.activeElement;
    dialog.current?.focus();
    const key = (e) => {
      if (e.key === 'Escape' && !busy) onClose();
      if (e.key === 'Tab') {
        const targets = [
          ...dialog.current.querySelectorAll(
            'button:not(:disabled),input,select,a[href],label'
          ),
        ].filter((el) => el.getClientRects().length);
        const first = targets[0],
          last = targets.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('keydown', key);
      old?.focus();
    };
  }, [busy, onClose]);

  async function run(action) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCustomFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      setError('File must be under 8 MiB.');
      return;
    }
    const buf = await f.arrayBuffer();
    const newFile = { name: f.name, bytes: new Uint8Array(buf) };
    setChosenFile(newFile);
    setError('');
    setMessage(`Selected "${f.name}" (${formatSize(f.size)}) for parity protection.`);
  }

  async function protect() {
    if (!chosenFile) throw Error('Choose or upload a file to protect first.');
    const capsule = await recoveryOperation('capsule', {
      bytes: chosenFile.bytes,
      name: chosenFile.name,
    });
    saveBlob(
      new Blob([JSON.stringify(capsule)], { type: 'application/json' }),
      chosenFile.name + '.lastsave.json'
    );
    setMessage(
      `Parity capsule exported for ${chosenFile.name}. Keep it separate from the original. It can repair one damaged 4 KiB block per eight-block stripe, verified against the recorded SHA-256.`
    );
  }

  async function repair() {
    const damaged = damagedRef.current?.files[0],
      capsuleFile = capsuleRef.current?.files[0];
    if (!damaged || !capsuleFile)
      throw Error('Choose both the damaged file and its earlier parity capsule.');
    if (damaged.size > 8 * 1024 * 1024 || capsuleFile.size > 4 * 1024 * 1024)
      throw Error('Damaged files must be under 8 MiB; capsules under 4 MiB.');
    let capsule;
    try {
      capsule = JSON.parse(await capsuleFile.text());
    } catch {
      throw Error('The capsule is not valid JSON.');
    }
    if (capsule.originalSize > 8 * 1024 * 1024)
      throw Error('This lab supports reconstructed files up to 8 MiB.');
    const original = new Uint8Array(await damaged.arrayBuffer());
    const sourceSha256 = await hashBytes(original);
    const repaired = await recoveryOperation('repair', {
      bytes: original,
      capsule,
    });
    const verifiedSha256 = await hashBytes(repaired.bytes);
    const stem = (capsule.name || damaged.name).replace(/\.[^.]+$/, '');
    const ext = (capsule.name || damaged.name).split('.').at(-1);
    await onRecovered([
      { name: damaged.name, bytes: original },
      {
        name: stem + '.repaired.' + ext,
        bytes: new Uint8Array(repaired.bytes),
        provenance: {
          kind: 'parity-repair',
          sourceName: damaged.name,
          sourceSha256,
          verifiedSha256,
          repairedBlocks: repaired.repairedBlocks,
        },
      },
    ]);
    setMessage(
      `Reconstructed ${repaired.repairedBlocks.length} block(s). The complete output matches the capsule’s SHA-256. Both the damaged input and derived output are kept in the session.`
    );
  }

  async function carve(bytes, name) {
    if (bytes.length > 64 * 1024 * 1024)
      throw Error('Image scans are limited to 64 MiB.');
    const sourceSha256 = await hashBytes(bytes);
    const candidates = await recoveryOperation('carve', { bytes, name });
    let total = 0;
    const accepted = candidates.filter(
      (c) =>
        c.bytes.length <= 8 * 1024 * 1024 &&
        (total += c.bytes.length) <= 16 * 1024 * 1024
    );
    if (!accepted.length)
      throw Error(
        'No validated, contiguous PNG, BMP or JPEG candidates fit the session limits. This does not prove no deleted files exist.'
      );
    await onRecovered(
      accepted.map((c) => ({
        name: c.name,
        bytes: c.bytes,
        provenance: {
          kind: 'carved',
          sourceName: name,
          offset: c.offset,
          sourceSha256,
        },
      }))
    );
    setMessage(
      `${accepted.length} candidate(s) imported from ${formatSize(bytes.length)}. Offsets are recorded. Signatures do not prove a file was deleted; overwritten or fragmented data may not be recoverable.`
    );
  }

  async function scanImage() {
    const f = imageRef.current?.files[0];
    if (!f) throw Error('Choose a disk image or raw dump.');
    if (f.size > 64 * 1024 * 1024)
      throw Error('Choose an image or prefix no larger than 64 MiB.');
    await carve(new Uint8Array(await f.arrayBuffer()), f.name);
  }

  return (
    <div className="modal-backdrop">
      <section
        className="field-notes recovery-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recovery-title"
        tabIndex={-1}
        ref={dialog}
      >
        <div className="notes-top">
          <span>THE LAST SAVE / RECOVERY TOOLS</span>
          <button
            className="icon-button"
            disabled={busy}
            onClick={onClose}
            aria-label="Close recovery tools"
          >
            <Icon name="close" />
          </button>
        </div>
        <h2 id="recovery-title">
          Recover what
          <br />
          <em>the evidence allows.</em>
        </h2>
        <p className="notes-small">
          Repair and scan results replace the mounted collection. Export your current bundle first to keep that case separately. Imported results are saved in this browser.
        </p>

        <div className="upgrade-tabs">
          {[
            ['protect', 'Protect (Parity)'],
            ['repair', 'Reconstruct'],
            ['scan', 'Carve Disk Image'],
          ].map(([id, label]) => (
            <button
              key={id}
              disabled={busy}
              aria-pressed={mode === id}
              onClick={() => {
                setMode(id);
                setMessage('');
                setError('');
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'protect' && (
          <div>
            <p>
              Create redundancy <strong>before</strong> a file is damaged. The capsule contains block hashes and XOR parity, allowing exact single-block repair if corruption strikes.
            </p>

            {chosenFile ? (
              <div className="config-note recovery-selected-bar">
                <div>
                  <strong>SELECTED FILE:</strong> {chosenFile.name}{' '}
                  <span className="file-size-tag">
                    ({formatSize(chosenFile.bytes?.length || 0)})
                  </span>
                </div>
                <div className="recovery-bar-actions">
                  {artifacts.length > 1 && (
                    <select
                      className="recovery-switch-select"
                      value={chosenFile.id || chosenFile.name}
                      onChange={(e) => {
                        const found = artifacts.find(
                          (a) => (a.id || a.name) === e.target.value
                        );
                        if (found) {
                          setChosenFile(found);
                          if (onSelectArtifact) onSelectArtifact(found);
                        }
                      }}
                      aria-label="Switch selected file"
                    >
                      {artifacts.map((a) => (
                        <option key={a.id || a.name} value={a.id || a.name}>
                          Switch: {a.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <label className="text-button change-file-label">
                    <Icon name="upload" size={12} /> Choose different file
                    <input
                      type="file"
                      onChange={handleCustomFile}
                      className="visually-hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="recovery-empty-state">
                <div className="recovery-empty-copy">
                  <strong>No file currently selected</strong>
                  <p>
                    Choose any file from your computer or select a mounted artifact to export its parity capsule.
                  </p>
                </div>
                <div className="recovery-cta-row">
                  <label className="primary-button cta-upload-btn">
                    <Icon name="upload" size={14} />
                    <span>CHOOSE FILE FROM COMPUTER</span>
                    <input
                      type="file"
                      onChange={handleCustomFile}
                      className="visually-hidden"
                    />
                  </label>
                  {artifacts.length > 0 ? (
                    <div className="cta-select-wrap">
                      <span>or select mounted:</span>
                      <select
                        className="recovery-switch-select"
                        defaultValue=""
                        onChange={(e) => {
                          const found = artifacts.find(
                            (a) => (a.id || a.name) === e.target.value
                          );
                          if (found) {
                            setChosenFile(found);
                            if (onSelectArtifact) onSelectArtifact(found);
                          }
                        }}
                      >
                        <option value="" disabled>
                          Choose mounted artifact…
                        </option>
                        {artifacts.map((a) => (
                          <option key={a.id || a.name} value={a.id || a.name}>
                            {a.name} ({formatSize(a.bytes.length)})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    onInsertDemo && (
                      <button
                        type="button"
                        className="primary-button"
                        onClick={async () => {
                          await onInsertDemo();
                        }}
                        disabled={busy}
                      >
                        <Icon name="arrow" size={13} />
                        <span>Insert demo disk first</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {chosenFile && (
              <button
                className="primary-button"
                disabled={busy || !chosenFile}
                onClick={() => run(protect)}
              >
                <span>EXPORT PARITY CAPSULE</span>
                <Icon name="download" />
              </button>
            )}
          </div>
        )}

        {mode === 'repair' && (
          <div>
            <p>
              Choose a damaged file and the parity capsule generated while it was intact. One damaged or missing 4 KiB block in each eight-block stripe can be reconstructed exactly.
            </p>
            <label className="upgrade-label">
              Damaged file
              <input ref={damagedRef} type="file" disabled={busy} />
            </label>
            <label className="upgrade-label">
              Earlier parity capsule (.lastsave.json)
              <input
                ref={capsuleRef}
                type="file"
                accept=".json"
                disabled={busy}
              />
            </label>
            <button
              className="primary-button"
              disabled={busy}
              onClick={() => run(repair)}
            >
              <span>RECONSTRUCT & VERIFY</span>
              <Icon name="check" />
            </button>
          </div>
        )}

        {mode === 'scan' && (
          <div>
            <p>
              Carve structurally validated PNG, BMP and JPEG candidates from a raw disk image up to 64 MiB. This locates contiguous file signatures directly in your browser.
            </p>
            <label className="upgrade-label">
              Disk image / raw bytes (.img, .raw, .dd)
              <input ref={imageRef} type="file" disabled={busy} />
            </label>
            <button
              className="primary-button"
              disabled={busy}
              onClick={() => run(scanImage)}
            >
              <span>SCAN IMAGE READ-ONLY</span>
              <Icon name="scan" />
            </button>
          </div>
        )}

        {busy && <p role="status">Processing in a bounded recovery worker…</p>}
        {error && (
          <div className="global-error" role="alert">
            {error}
          </div>
        )}
        {message && (
          <div className="upgrade-success" role="status">
            {message}
          </div>
        )}

        <p className="notes-small">
          No universal repair claim: files without sufficient surviving information cannot always be reconstructed. All processing stays bounded on this device.
        </p>
      </section>
    </div>
  );
}
