import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import './CommunityAgent.css';
import config from './config';
function CommunityAgent() {
  const { state } = useLocation();
  const [step, setStep] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [conversation, setConversation] = useState([]);
  const [waiting, setWaiting] = useState(false);

  const userID = localStorage.getItem("userID");

  useEffect(() => {
    if (step === 0) {
      addMessage("agent", "👋 Hi there! How do you feel today?");
      setStep(1);
    }
  }, [step]);

  const addMessage = (sender, text) => {
    // If text includes group listings, format it differently
    if (sender === "agent" && text.match(/^\d+\.\s/gm)) {
      const groups = text.split(/\d+\.\s/).filter(Boolean).map(entry => entry.trim());
      const formatted = (
        <div className="group-list">
          {groups.map((group, i) => (
            <div key={i} className="group-entry">
              {group.split('\n').map((line, j) => (
                <div key={j} className="group-line">👉 {line.trim()}</div>
              ))}
            </div>
          ))}
        </div>
      );
      setConversation(prev => [...prev, { sender, text: formatted }]);
    } else {
      setConversation(prev => [...prev, { sender, text }]);
    }
  };

  const handleUserInput = async () => {
    if (!userInput.trim()) return;
    addMessage("user", userInput);

    if (step === 1) {
      const negativeWords = ["sad", "lonely", "bad", "tired", "depressed", "unhappy"];
      const isNegative = negativeWords.some(word => userInput.toLowerCase().includes(word));
      if (isNegative) {
        addMessage("agent", "😔 Sorry about that. Would you like to join some community groups?");
        setStep(2);
      } else {
        addMessage("agent", "😊 That’s great to hear! Would you like an uplifting message?");
        setStep(4);
      }
    } else if (step === 2) {
      const answer = userInput.toLowerCase();
      if (answer.includes("yes")) {
        addMessage("agent", "Would you like this information in your spoken language?");
        setStep(3);
      } else {
        addMessage("agent", "Alright! Sending an uplifting message.");
        sendToOpenAI("uplifting-message");
        setStep(99);
      }
    } else if (step === 3) {
      const useTranslation = userInput.toLowerCase().includes("yes");
      const mode = useTranslation ? "translated-community-groups" : "english-community-groups";
      addMessage("agent", "📡 Fetching suggestions just for you...");
      sendToOpenAI(mode);
      setStep(99);
    } else if (step === 4) {
      const yes = userInput.toLowerCase().includes("yes");
      if (yes) {
        addMessage("agent", "Sending something nice your way...");
        sendToOpenAI("uplifting-message");
      } else {
        addMessage("agent", "Okay! I'm here if you need me.");
      }
      setStep(99);
    }

    setUserInput("");
  };

  const sendToOpenAI = async (mode) => {
    setWaiting(true);
    try {
      const res = await fetch(` ${config.backendUrl}5009/api/openai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID, mode })
      });
      const data = await res.json();
      if (res.ok && data.response) {
        addMessage("agent", data.response);
      } else {
        addMessage("agent", "❌ Sorry, something went wrong.");
      }
    } catch (err) {
      console.error(err);
      addMessage("agent", "❌ Error contacting AI service.");
    }
    setWaiting(false);
  };

  return (
    <div className="community-agent-container">
      <div className="chat-header">🤖 Carol – Your Community Companion</div>
      <div className="chat-box">
        {conversation.map((msg, index) => (
          <div key={index} className={`chat-bubble ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        {waiting && <div className="chat-bubble agent">⏳ Thinking...</div>}
      </div>

      <div className="chat-input-area">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your answer here..."
          className="chat-input"
        />
        <button onClick={handleUserInput} className="chat-send">Send</button>
      </div>
    </div>
  );
}

export default CommunityAgent;


