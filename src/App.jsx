import { useState } from "react";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  async function askClaude() {
    if (!prompt.trim()) return;

    setLoading(true);
    setResponse("");

    try {
      const r = await fetch("/api/claude", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
        }),
      });

      const data = await r.json();

      if (data.error) {
        setResponse("Erreur : " + data.error);
      } else {
        setResponse(data.text);
      }
    } catch (error) {
      setResponse("Erreur réseau.");
    }

    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111827",
        color: "white",
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <h1 style={{ fontSize: "32px", marginBottom: "20px" }}>
        Sanctuaire App ✨
      </h1>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Écris ta prière ou ta question..."
        style={{
          width: "100%",
          height: "120px",
          padding: "15px",
          borderRadius: "10px",
          border: "none",
          marginBottom: "20px",
          fontSize: "16px",
        }}
      />

      <button
        onClick={askClaude}
        style={{
          padding: "15px 25px",
          borderRadius: "10px",
          border: "none",
          background: "#7c3aed",
          color: "white",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        {loading ? "Chargement..." : "Envoyer"}
      </button>

      <div
        style={{
          marginTop: "30px",
          background: "#1f2937",
          padding: "20px",
          borderRadius: "10px",
          whiteSpace: "pre-wrap",
          lineHeight: "1.7",
        }}
      >
        {response}
      </div>
    </div>
  );
}