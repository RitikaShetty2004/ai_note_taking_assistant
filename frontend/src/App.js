import React, { useState, useEffect, useCallback } from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import axios from "axios";
import { jsPDF } from "jspdf";
import "./styles.css";

function App() {
  const [transcription, setTranscription] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // To prevent multiple uploads

  const {
    startRecording,
    stopRecording,
    mediaBlobUrl,
  } = useReactMediaRecorder({
    audio: true,
    video: false,
    onStop: (blobUrl, blob) => {
      setAudioBlob(blob);
      setIsRecordingActive(false);
    },
  });

  const handleStartStopRecording = () => {
    if (isRecordingActive) {
      stopRecording();
    } else {
      startRecording();
      setIsRecordingActive(true);
    }
  };

  const uploadAudio = useCallback(async () => {
    if (!audioBlob || isProcessing) return; // Prevent uploads if processing is ongoing

    setIsProcessing(true); // Start processing

    const formData = new FormData();
    formData.append("file", audioBlob, "audio.wav");

    try {
      setLoading(true);
      const response = await axios.post("http://127.0.0.1:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Transcription Response:", response.data);
      setTranscription(response.data.transcription);
      generateSummary(response.data.transcription);
    } catch (error) {
      console.error("Error uploading audio:", error);
    } finally {
      setLoading(false);
      setIsProcessing(false); // Reset processing state
    }
  }, [audioBlob, isProcessing]);

  useEffect(() => {
    if (audioBlob) {
      uploadAudio();
    }
  }, [audioBlob, uploadAudio]);

  const generateSummary = async (transcriptionText) => {
    try {
      const response = await axios.post("http://127.0.0.1:5000/summarize", {
        text: transcriptionText,
      });
      console.log("Summary Response:", response.data);
      setSummary(response.data.summary);
    } catch (error) {
      console.error("Error generating summary:", error);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Transcription and Summary", 20, 20);

    doc.setFontSize(12);
    doc.text("Transcription:", 20, 30);
    const wrappedTranscription = doc.splitTextToSize(transcription, 170);
    doc.text(wrappedTranscription, 20, 40);

    const summaryStartY = 40 + wrappedTranscription.length * 10;
    doc.text("Summary:", 20, summaryStartY);
    const wrappedSummary = doc.splitTextToSize(summary, 170);
    doc.text(wrappedSummary, 20, summaryStartY + 10);

    doc.save("transcription-summary.pdf");
  };

  return (
    <div className="container">
      <h1>AI Note-Taking Assistant</h1>

      <button
        className={`record-btn ${isRecordingActive ? "stop" : "start"}`}
        onClick={handleStartStopRecording}
        disabled={isProcessing} // Disable button during processing
      >
        {isRecordingActive ? "Stop Recording" : "Start Recording"}
      </button>

      {mediaBlobUrl && (
        <div className="audio-section">
          <h3>Playback:</h3>
          <audio controls src={mediaBlobUrl}></audio>
        </div>
      )}

      {loading && <p className="loading-text">Processing audio...</p>}

      {transcription && (
        <div className="transcription-box">
          <h3>Transcription:</h3>
          <p>{transcription}</p>
        </div>
      )}

      {summary && (
        <div className="summary-box">
          <h3>Summary:</h3>
          <p>{summary}</p>
        </div>
      )}

      {transcription && summary && (
        <button className="export-btn" onClick={handleExportPDF}>
          Export PDF
        </button>
      )}
    </div>
  );
}

export default App;
