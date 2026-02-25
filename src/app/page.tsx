"use client";

import { useState } from "react";
import {
  vigenere,
  affine,
  playfair,
  hill,
  enigma,
  DEFAULT_ROTORS,
  VALID_A,
  type Mode,
  type Result,
  type Matrix3,
} from "@/lib/ciphers";

// Types & Constants //
type CipherTab = "vigenere" | "affine" | "playfair" | "hill" | "enigma";

const TABS: { id: CipherTab; label: string }[] = [
  { id: "vigenere", label: "Vigenere" },
  { id: "affine", label: "Affine" },
  { id: "playfair", label: "Playfair" },
  { id: "hill", label: "Hill" },
  { id: "enigma", label: "Enigma" },
];

const DEFAULT_K: Matrix3 = [
  [17, 17, 5],
  [21, 18, 21],
  [2, 2, 19],
];

// Shared style objects //
const S = {
  input: {
    width: "100%",
    background: "#111",
    border: "1px solid #2a2a2a",
    color: "#f0f0f0",
    fontSize: 13,
    padding: "10px 12px",
  } as React.CSSProperties,

  textarea: {
    width: "100%",
    background: "#111",
    border: "1px solid #2a2a2a",
    color: "#f0f0f0",
    fontSize: 13,
    padding: "10px 12px",
    resize: "vertical" as const,
    minHeight: 120,
    lineHeight: 1.6,
  } as React.CSSProperties,

  label: {
    display: "block",
    fontSize: 10,
    color: "#888",
    letterSpacing: "1.5px",
    textTransform: "uppercase" as const,
    marginBottom: 8,
  } as React.CSSProperties,
};

// Shared sub-components // 
function Info({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 12,
        color: "#aaa",
        lineHeight: 1.7,
        borderLeft: "2px solid #2a2a2a",
        paddingLeft: 12,
        marginBottom: 16,
      }}
    >
      {children}
    </p>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  return (
    <div style={{ display: "flex", border: "1px solid #2a2a2a" }}>
      {(["encrypt", "decrypt"] as Mode[]).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          style={{
            background: mode === m ? "#fff" : "transparent",
            color: mode === m ? "#000" : "#aaa",
            border: "none",
            borderRight: m === "encrypt" ? "1px solid #2a2a2a" : "none",
            fontFamily: "Courier New, monospace",
            fontSize: 11,
            padding: "8px 16px",
            cursor: "pointer",
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          {m === "encrypt" ? "Enkripsi" : "Dekripsi"}
        </button>
      ))}
    </div>
  );
}

function SplitPanel({
  mode,
  input,
  onInput,
  result,
  onCopy,
}: {
  mode: Mode;
  input: string;
  onInput: (v: string) => void;
  result: Result;
  onCopy: () => void;
}) {
  const inLabel = mode === "encrypt" ? "Plaintext" : "Ciphertext";
  const outLabel = mode === "encrypt" ? "Ciphertext" : "Plaintext";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
        marginBottom: 16,
      }}
    >
      {/* Input */}
      <div>
        <label style={S.label}>{inLabel}</label>
        <textarea
          style={S.textarea}
          placeholder="masukkan teks..."
          value={input}
          onChange={(e) => onInput(e.target.value)}
        />
      </div>

      {/* Output */}
      <div>
        <div
          style={{
            ...S.label,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{outLabel}</span>
          <span
            onClick={onCopy}
            style={{ cursor: "pointer", color: "#888", letterSpacing: "1px" }}
          >
            [ copy ]
          </span>
        </div>
        <div
          style={{
            ...S.textarea,
            color: result.error
              ? "#e74c3c"
              : result.output
                ? "#f0f0f0"
                : "#555",
            overflow: "auto",
            wordBreak: "break-all",
            whiteSpace: "pre-wrap",
          }}
        >
          {result.error || result.output || "—"}
        </div>
      </div>
    </div>
  );
}

function Steps({ steps }: { steps: { d: string; v: string }[] }) {
  if (steps.length === 0) return null;
  return (
    <div style={{ marginTop: 24 }}>
      <div
        style={{
          fontSize: 10,
          color: "#888",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: "1px solid #222",
        }}
      >
        Langkah
      </div>
      {steps.map((s, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 16,
            padding: "8px 0",
            borderBottom: i < steps.length - 1 ? "1px solid #1a1a1a" : "none",
            fontSize: 12,
            alignItems: "baseline",
          }}
        >
          <span style={{ color: "#555", width: 20, flexShrink: 0 }}>
            {String(i + 1).padStart(2, "0")}
          </span>
          <span style={{ flex: 1, color: "#d0d0d0" }}>{s.d}</span>
          <span style={{ color: "#f0f0f0", flexShrink: 0 }}>{s.v}</span>
        </div>
      ))}
    </div>
  );
}

// Cipher Workspaces // 
function VigenereWS({ onCopy }: { onCopy: (t: string) => void }) {
  const [mode, setMode] = useState<Mode>("encrypt");
  const [key, setKey] = useState("SONY");
  const [input, setInput] = useState("");
  const result = vigenere(input, key, mode);
  return (
    <div>
      <Info>
        C = (P + K) mod 26 &nbsp;|&nbsp; Kunci diulang sepanjang plaintext
        &nbsp;|&nbsp; Dekripsi: P = (C − K + 26) mod 26
      </Info>
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 16,
          alignItems: "flex-end",
        }}
      >
        <div style={{ flex: 1 }}>
          <label style={S.label}>Kunci</label>
          <input
            style={S.input}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="contoh: SONY"
          />
        </div>
        <ModeToggle mode={mode} onChange={setMode} />
      </div>
      <SplitPanel
        mode={mode}
        input={input}
        onInput={setInput}
        result={result}
        onCopy={() => onCopy(result.output)}
      />
      <Steps steps={result.steps} />
    </div>
  );
}

function AffineWS({ onCopy }: { onCopy: (t: string) => void }) {
  const [mode, setMode] = useState<Mode>("encrypt");
  const [a, setA] = useState(7);
  const [b, setB] = useState(10);
  const [input, setInput] = useState("");
  const result = affine(input, a, b, mode);
  return (
    <div>
      <Info>
        C = (a·P + b) mod 26 &nbsp;|&nbsp; a harus relatif prima dengan 26
        &nbsp;|&nbsp; Valid a: {VALID_A.join(", ")}
      </Info>
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 16,
          alignItems: "flex-end",
        }}
      >
        <div style={{ flex: 1 }}>
          <label style={S.label}>Nilai a</label>
          <input
            style={S.input}
            type="number"
            value={a}
            onChange={(e) => setA(parseInt(e.target.value) || 0)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={S.label}>Nilai b</label>
          <input
            style={S.input}
            type="number"
            value={b}
            onChange={(e) => setB(parseInt(e.target.value) || 0)}
          />
        </div>
        <ModeToggle mode={mode} onChange={setMode} />
      </div>
      <SplitPanel
        mode={mode}
        input={input}
        onInput={setInput}
        result={result}
        onCopy={() => onCopy(result.output)}
      />
      <Steps steps={result.steps} />
    </div>
  );
}

function PlayfairWS({ onCopy }: { onCopy: (t: string) => void }) {
  const [mode, setMode] = useState<Mode>("encrypt");
  const [key, setKey] = useState("GADJAH");
  const [input, setInput] = useState("");
  const result = playfair(input, key, mode);
  return (
    <div>
      <Info>
        Enkripsi pasangan huruf (bigram) dalam matriks 5×5 &nbsp;|&nbsp; J → I
        &nbsp;|&nbsp; Pasangan ganjil + X
      </Info>
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 16,
          alignItems: "flex-end",
        }}
      >
        <div style={{ flex: 1 }}>
          <label style={S.label}>Kunci</label>
          <input
            style={S.input}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="contoh: GADJAH"
          />
        </div>
        <ModeToggle mode={mode} onChange={setMode} />
      </div>
      <SplitPanel
        mode={mode}
        input={input}
        onInput={setInput}
        result={result}
        onCopy={() => onCopy(result.output)}
      />
      <Steps steps={result.steps} />
    </div>
  );
}

function HillWS({ onCopy }: { onCopy: (t: string) => void }) {
  const [mode, setMode] = useState<Mode>("encrypt");
  const [input, setInput] = useState("");
  const [K, setK] = useState<Matrix3>(DEFAULT_K);

  const setCell = (r: number, c: number, val: number) =>
    setK(
      (prev) =>
        prev.map((row, ri) =>
          row.map((v, ci) => (ri === r && ci === c ? val : v)),
        ) as Matrix3,
    );

  const result = hill(input, K, mode);
  return (
    <div>
      <Info>
        Enkripsi 3 huruf dengan perkalian matriks 3×3 (mod 26) &nbsp;|&nbsp;
        Matriks harus invertible mod 26
      </Info>
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 16,
          alignItems: "flex-end",
        }}
      >
        <div>
          <label style={S.label}>Matriks Kunci 3×3</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 56px)",
              gap: 4,
            }}
          >
            {K.map((row, r) =>
              row.map((v, c) => (
                <input
                  key={`${r}${c}`}
                  type="number"
                  style={{
                    ...S.input,
                    width: 56,
                    textAlign: "center",
                    padding: "8px 4px",
                  }}
                  value={v}
                  onChange={(e) => setCell(r, c, parseInt(e.target.value) || 0)}
                />
              )),
            )}
          </div>
        </div>
        <ModeToggle mode={mode} onChange={setMode} />
      </div>
      <SplitPanel
        mode={mode}
        input={input}
        onInput={setInput}
        result={result}
        onCopy={() => onCopy(result.output)}
      />
      <Steps steps={result.steps} />
    </div>
  );
}

function EnigmaWS({ onCopy }: { onCopy: (t: string) => void }) {
  const [mode, setMode] = useState<Mode>("encrypt");
  const [input, setInput] = useState("");
  const [rotors, setRotors] = useState(DEFAULT_ROTORS);

  const setRotor = (i: number, v: string) =>
    setRotors((prev) => prev.map((r, ri) => (ri === i ? v.toUpperCase() : r)));

  const result = enigma(input, rotors, mode);
  return (
    <div>
      <Info>
        Mesin rotor 3 posisi &nbsp;|&nbsp; Setiap karakter pakai rotor berbeda:
        K0→K1→K2→K0→... &nbsp;|&nbsp; Tiap rotor = 26 huruf (mapping A–Z)
      </Info>
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 16,
          alignItems: "flex-end",
        }}
      >
        <div style={{ flex: 1 }}>
          <label style={S.label}>Rotor K0</label>
          <input
            style={S.input}
            value={rotors[0]}
            onChange={(e) => setRotor(0, e.target.value)}
            maxLength={26}
          />
        </div>
        <ModeToggle mode={mode} onChange={setMode} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={S.label}>Rotor K1</label>
        <input
          style={S.input}
          value={rotors[1]}
          onChange={(e) => setRotor(1, e.target.value)}
          maxLength={26}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={S.label}>Rotor K2</label>
        <input
          style={S.input}
          value={rotors[2]}
          onChange={(e) => setRotor(2, e.target.value)}
          maxLength={26}
        />
      </div>
      <SplitPanel
        mode={mode}
        input={input}
        onInput={setInput}
        result={result}
        onCopy={() => onCopy(result.output)}
      />
      <Steps steps={result.steps} />
    </div>
  );
}


// Main Page //
export default function Page() {
  const [tab, setTab] = useState<CipherTab>("vigenere");
  const [toast, setToast] = useState(false);

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setToast(true);
      setTimeout(() => setToast(false), 1800);
    });
  };

  return (
    <>
      {/* Header */}
      <header
        style={{
          padding: "20px 32px",
          borderBottom: "1px solid #2a2a2a",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ color: "#fff", fontSize: 13, letterSpacing: 2 }}>
          TUGAS KRIPTOGRAFI <span style={{ color: "#555" }}>/</span> KLASIK
        </span>
        <span style={{ color: "#ffffff", fontSize: 11 }}>
          Nandito Adi Syahputra — 21120123120023
        </span>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 32px" }}>
        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #2a2a2a",
            marginBottom: 32,
            overflowX: "auto",
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: "none",
                border: "none",
                borderBottom:
                  tab === t.id ? "2px solid #fff" : "2px solid transparent",
                color: tab === t.id ? "#fff" : "#888",
                fontFamily: "Courier New, monospace",
                fontSize: 12,
                padding: "10px 18px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                letterSpacing: "1px",
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Workspaces */}
        {tab === "vigenere" && <VigenereWS onCopy={handleCopy} />}
        {tab === "affine" && <AffineWS onCopy={handleCopy} />}
        {tab === "playfair" && <PlayfairWS onCopy={handleCopy} />}
        {tab === "hill" && <HillWS onCopy={handleCopy} />}
        {tab === "enigma" && <EnigmaWS onCopy={handleCopy} />}
      </main>

      {/* Toast */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          background: "#fff",
          color: "#000",
          fontFamily: "Courier New, monospace",
          fontSize: 11,
          letterSpacing: "1px",
          padding: "10px 16px",
          opacity: toast ? 1 : 0,
          transform: toast ? "translateY(0)" : "translateY(8px)",
          transition: "all 0.2s",
          pointerEvents: "none",
        }}
      >
        disalin
      </div>
    </>
  );
}
