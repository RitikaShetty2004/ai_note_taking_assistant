import React, { useState } from "react";
import exportToPDF from "./exportPDF"; // Import the export function

const TranscriptionResult = ({ transcription }) => {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false); // Track export loading state
  const [error, setError] = useState(""); // Track any errors

  const handleSummarize = async () => {
    setLoading(true);
    setError(""); // Reset error state before making the request
    try {
      const response = await fetch("http://127.0.0.1:5000/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: transcription }),
      });

      const data = await response.json();
      if (data.summary) {
        setSummary(data.summary);
      } else {
        setSummary("Error generating summary.");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Error generating summary. Please try again.");
    }
    setLoading(false);
  };

  const handleExportToPDF = async () => {
    setExportLoading(true);
    try {
      await exportToPDF(transcription); // Call the export function
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      setError("Error exporting to PDF. Please try again.");
    }
    setExportLoading(false);
  };

  return (
    <div>
      <h2>Transcription:</h2>
      <p>{transcription}</p>

      <button onClick={handleSummarize} disabled={loading}>
        {loading ? "Summarizing..." : "Summarize Notes"}
      </button>

      <button onClick={handleExportToPDF} disabled={exportLoading}>
        {exportLoading ? "Exporting..." : "Export to PDF"}
      </button>

      {error && (
        <div style={{ color: "red", marginTop: "10px" }}>
          <strong>{error}</strong>
        </div>
      )}

      {summary && (
        <div>
          <h2>Summary:</h2>
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
};

export default TranscriptionResult;
