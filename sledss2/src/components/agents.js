import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const CloneAgentInterface = () => {
  const [step, setStep] = useState("describeFeelings");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [feelingsText, setFeelingsText] = useState("");
  const [memoryText, setMemoryText] = useState("");
  const [story, setStory] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const chunksRef = useRef([]);

  const navigate = useNavigate();
  const userID = localStorage.getItem("userID");

  useEffect(() => {
    if (!userID) {
      alert("Please log in to access the agent.");
      navigate("/login");
    }
  }, [navigate, userID]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setIsRecording(true);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedAudioUrl(URL.createObjectURL(blob));
      };

      recorder.start();
      setMediaRecorder(recorder);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const submitRecordedAudio = async () => {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audio", blob, "voice.webm");

    try {
      const res = await axios.post("http://localhost:5009/api/transcribe", formData);
      const transcript = res.data.text.trim();

      if (step === "describeFeelings") {
        setFeelingsText(transcript);
        setStep("describeMemory");
      } else if (step === "describeMemory") {
        setMemoryText(transcript);
        setStep("done");
      }

      setRecordedAudioUrl(null);
    } catch (err) {
      console.error("Transcription error:", err);
    }
  };

  const handleGenerateStory = async () => {
    const res = await axios.post("http://localhost:5009/api/generate-story", {
      message: `${feelingsText} ${memoryText}`,
      userID,
    });
    setStory(res.data.story);
  };

  const handleSpeakStory = async () => {
    const res = await axios.post(
      "http://localhost:5009/api/speak-story",
      { story, userID },
      { responseType: "blob" }
    );
    const blob = new Blob([res.data], { type: "audio/mpeg" });
    setAudioUrl(URL.createObjectURL(blob));
  };

  const handleGenerateImage = async () => {
    try {
      const res = await axios.post("http://localhost:5009/api/generate-image", {
        memory: memoryText,
        userID,
      });
      setImageUrl(res.data.imageUrl);
    } catch (err) {
      console.error("Image generation error:", err);
    }
  };

  const handleGeneratePlaylist = async () => {
    if (!userID || !feelingsText) return;

    try {
      const res = await axios.post("http://localhost:5009/api/generate-playlist", {
        message: `${feelingsText}`,
        userID,
      });
      setPlaylists(res.data.playlists);
    } catch (err) {
      console.error("Playlist error:", err.response?.data || err.message);
    }
  };

  const promptText =
    step === "describeFeelings"
      ? "🎤 Please describe how you're feeling today..."
      : step === "describeMemory"
      ? "📖 Please share a memory that comes to mind..."
      : "✅ All inputs captured. Ready to generate!";

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>🧠 My Voice Agent</h2>
      <p style={promptStyle}><strong>{promptText}</strong></p>

      {step !== "done" && (
        <div style={sectionStyle}>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            style={recordButtonStyle(isRecording)}
          >
            {isRecording ? "⏹️ Stop Recording" : "🎙️ Start Recording"}
          </button>

          {recordedAudioUrl && (
            <div style={audioSectionStyle}>
              <audio controls src={recordedAudioUrl}></audio>
              <button onClick={submitRecordedAudio} style={buttonStyle("#673ab7")}>
                Submit Voice
              </button>
            </div>
          )}
        </div>
      )}

      {step === "done" && (
        <div style={sectionStyle}>
          <div style={buttonGroupStyle}>
            <button onClick={handleGenerateStory} style={buttonStyle("#795548")}>Generate Story</button>
            <button onClick={handleSpeakStory} style={buttonStyle("#3f51b5")}>Narrate Story</button>
            <button onClick={handleGenerateImage} style={buttonStyle("#9c27b0")}>Generate Image</button>
            <button onClick={handleGeneratePlaylist} style={buttonStyle("#e91e63")}>Get Music Playlist</button>
          </div>

          {story && <p style={storyStyle}><strong>📝 Story:</strong> {story}</p>}
          {audioUrl && <audio controls src={audioUrl} style={mediaStyle}></audio>}
          {imageUrl && <img src={imageUrl} alt="Generated memory" style={mediaStyle} />}

          <div style={playlistContainerStyle}>
            {playlists.map((playlist, i) => (
              <a
                key={i}
                href={playlist.url}
                target="_blank"
                rel="noopener noreferrer"
                style={playlistLinkStyle}
              >
                <img src={playlist.thumbnail} alt={playlist.title} style={thumbnailStyle} />
                {playlist.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const containerStyle = {
  padding: "2rem",
  maxWidth: 800,
  margin: "40px auto",
  backgroundColor: "#ffffff",
  borderRadius: "20px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
};

const titleStyle = {
  textAlign: "center",
  marginBottom: 24,
  fontSize: "2rem",
  color: "#222",
};

const promptStyle = {
  fontSize: "1.1rem",
  marginBottom: 24,
  color: "#555",
  textAlign: "center",
};

const sectionStyle = {
  marginTop: 24,
  textAlign: "center",
};

const recordButtonStyle = (isRecording) => ({
  padding: "12px 28px",
  fontSize: "1rem",
  backgroundColor: isRecording ? "#f44336" : "#2196F3",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  transition: "background-color 0.3s",
});

const buttonStyle = (color) => ({
  margin: "10px",
  padding: "10px 22px",
  fontSize: "1rem",
  backgroundColor: color,
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "0.3s",
});

const audioSectionStyle = {
  marginTop: 16,
  textAlign: "center",
};

const mediaStyle = {
  marginTop: 20,
  width: "100%",
  borderRadius: "12px",
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
};

const storyStyle = {
  marginTop: 20,
  padding: "16px",
  backgroundColor: "#f9f9f9",
  borderRadius: "10px",
  lineHeight: 1.6,
  color: "#333",
};

const playlistContainerStyle = {
  marginTop: 24,
  display: "flex",
  flexWrap: "wrap",
  gap: 16,
  justifyContent: "center",
};

const playlistLinkStyle = {
  display: "flex",
  alignItems: "center",
  backgroundColor: "#f0f0f0",
  borderRadius: "10px",
  padding: "12px",
  textDecoration: "none",
  color: "#333",
  width: 250,
  boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  transition: "transform 0.2s",
};

const thumbnailStyle = {
  width: 64,
  height: 64,
  borderRadius: "6px",
  marginRight: 12,
  objectFit: "cover",
};

const buttonGroupStyle = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "12px",
  marginTop: "20px",
};

export default CloneAgentInterface;
