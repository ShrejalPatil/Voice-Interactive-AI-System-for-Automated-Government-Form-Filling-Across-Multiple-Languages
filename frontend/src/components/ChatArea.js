// src/components/ChatArea.js
import React, { useRef, useEffect, useState } from "react";
import "./ChatArea.css";

export default function ChatArea({
  chatMessages,
  userResponse,
  setUserResponse,
  sendConversationResponse,
}) {
  const chatRef = useRef(null);
  const recognitionRef = useRef(null);
  const [autoListening, setAutoListening] = useState(false);

  // 🔹 Auto-scroll chat when new messages appear
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // 🔹 Wait for bot to finish speaking before starting mic
  useEffect(() => {
    const handleBotAudioEnd = () => {
      console.log("🤖 Bot finished speaking → starting mic...");
      startAutoVoiceRecognition();
    };

    window.addEventListener("botAudioEnded", handleBotAudioEnd);

    return () => {
      window.removeEventListener("botAudioEnded", handleBotAudioEnd);
    };
  }, []);

  // 🎧 Start browser speech recognition
  const startAutoVoiceRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser.");
      return;
    }

    // ✅ Prevent mic from starting if bot is still speaking
    if (window.speechSynthesis.speaking) {
      console.log("⏸️ Bot still talking... will start mic after speech ends.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN"; // change dynamically if needed
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      console.log("🎤 Listening...");
      setAutoListening(true);
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript.trim();
      console.log("🗣️ User said:", transcript);
      setUserResponse("");
      await sendConversationResponse(transcript);
      stopAutoVoiceRecognition();
    };

    recognition.onerror = (event) => {
      console.error("Voice recognition error:", event.error);
      stopAutoVoiceRecognition();
    };

    recognition.onend = () => {
      console.log("🎙️ Mic stopped listening.");
      setAutoListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  // 🎧 Stop recognition
  const stopAutoVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setAutoListening(false);
    }
  };

  return (
    <div className="chat-wrapper">
      <header className="chat-header">
        <div className="logo-row">
          <img
                className="avatar"
                alt="Bot Avatar"
                src="https://cdn-icons-png.flaticon.com/512/4712/4712100.png"
              />
          <h1 className="app-title" style={{ color: '#4a4a4a', fontSize: '1.5rem', fontWeight: 'bold' }}>SAKHI</h1>
        </div>
        <div className="header-avatar" title="Profile">
          {/* simple person circle */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="8" r="3.2" stroke="#6B7280" strokeWidth="1.2" />
            <path d="M4 20c0-3.3 4-6 8-6s8 2.7 8 6" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
      </header>

      <div className="chat-area" ref={chatRef}>

        {chatMessages.map((m, i) => (
          <div
            key={i}
            className={`message-row ${m.isBot ? "bot-row" : "user-row"}`}
          >
            {m.isBot && (
              <img
                className="avatar"
                alt="Bot Avatar"
                src="https://cdn-icons-png.flaticon.com/512/4712/4712100.png"
              />
            )}

            <div className={`message-content ${m.isBot ? "left" : "right"}`}>
              <div className="message-meta">
                <span className="sender">{m.isBot ? "AI Assistant" : "You"}</span>
                <span className="dot">•</span>
                <span className="time">
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className={`bubble ${m.isBot ? "bot-bubble" : "user-bubble"}`}>
                {m.text}
              </div>
            </div>

            {!m.isBot && (
              <img
                className="avatar"
                alt="User Avatar"
                src="https://cdn-icons-png.flaticon.com/512/4140/4140048.png"
              />
            )}
          </div>
        ))}

      </div>

      <footer className="chat-footer">
        <div className="input-wrap">
          <input
            value={userResponse}
            onChange={(e) => setUserResponse(e.target.value)}
            placeholder={
              autoListening
                ? "🎤 Listening... please speak"
                : "Type a message or use the microphone..."
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && userResponse.trim()) {
                sendConversationResponse(userResponse.trim());
                setUserResponse("");
                stopAutoVoiceRecognition();
              }
            }}
            className="chat-input"
          />

          <button
            type="button"
            onClick={() =>
              autoListening ? stopAutoVoiceRecognition() : startAutoVoiceRecognition()
            }
            className={`icon-button mic-button ${autoListening ? "listening" : ""}`}
            aria-label={autoListening ? "Stop listening" : "Start microphone"}
            title={autoListening ? "Stop listening" : "Start microphone"}
          >
            {/* mic SVG */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 14a3.5 3.5 0 0 0 3.5-3.5V6.5A3.5 3.5 0 0 0 12 3a3.5 3.5 0 0 0-3.5 3.5v4A3.5 3.5 0 0 0 12 14z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19 11.5v.5a7 7 0 0 1-14 0v-.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 21v-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <button
            type="button"
            onClick={() => {
              if (userResponse.trim()) {
                sendConversationResponse(userResponse.trim());
                setUserResponse("");
                stopAutoVoiceRecognition();
              }
            }}
            className="icon-button send-button"
            aria-label="Send message"
            title="Send"
          >
            {/* send SVG */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M22 2L11 13" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" fill="currentColor" stroke="currentColor" strokeWidth="0.6" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
}
