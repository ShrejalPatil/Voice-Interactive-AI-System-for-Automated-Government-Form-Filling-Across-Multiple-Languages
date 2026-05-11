// src/App.js
import React, { useState, useRef, useEffect } from "react";
import "./App.css";

// 🔹 Components
import HeaderBar from "./components/HeaderBar";
import StartOverlay from "./components/StartOverlay";
import ChatArea from "./components/ChatArea";
import SchemesPanel from "./components/SchemesPanel";
import ApplicationPreview from "./components/ApplicationPreview";
import ApplicationsModal from "./components/ApplicationsModal";
import SchemesDashboard from "./components/SchemesDashboard";

// 🔹 API & Utils
import {
  startConversation as apiStartConversation,
  sendConversation as apiSendConversation,
  checkEligibilityAPI,
  submitApplicationAPI,
  getSchemeDetails,
} from "./api/botAPI";
import { playBotAudio } from "./utils/playBotAudio";

function App() {
  // 🌐 States
  const [showDashboard, setShowDashboard] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [showApplications, setShowApplications] = useState(false);
  const [started, setStarted] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [userResponse, setUserResponse] = useState("");
  const [recording, setRecording] = useState(false);
  const [eligibleSchemes, setEligibleSchemes] = useState([]);
  const [applicationPreview, setApplicationPreview] = useState(null);
  const [appliedSchemes, setAppliedSchemes] = useState({});
  const [currentStep, setCurrentStep] = useState("ask_name");
  const [userData, setUserData] = useState({});
  const [lastApplicationQA, setLastApplicationQA] = useState([]);
  const [pendingExtraQuestions, setPendingExtraQuestions] = useState([]);
  const [currentExtraAnswers, setCurrentExtraAnswers] = useState({});
  const [currentSchemeApplying, setCurrentSchemeApplying] = useState(null);
  const [editingField, setEditingField] = useState(null); // 🆕 for edit handling
  const [previewOpen, setPreviewOpen] = useState(false);


  // Persisted last application id (so preview button survives refresh)
  const [lastApplicationId, setLastApplicationId] = useState(
    localStorage.getItem("lastApplicationId") || null
  );

  // 🎤 Voice Recording Refs
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  // 🔹 Static Questions per Scheme (kept inline for now)
  const schemeExtraQuestions = {
    "PM Kisan Samman Nidhi": {
      en: [
        "Are you a land-owning farmer? (yes/no)",
        "Do you have a valid Aadhaar card? (yes/no)",
        "Is your annual income below 6 lakhs? (yes/no)",
      ],
      hi: [
        "क्या आप भूमि के मालिक किसान हैं? (हाँ/नहीं)",
        "क्या आपके पास वैध आधार कार्ड है? (हाँ/नहीं)",
        "क्या आपकी वार्षिक आय 6 लाख से कम है? (हाँ/नहीं)",
      ],
      kn: [
        "ನೀವು ಭೂಮಿಯ ಮಾಲೀಕತ್ವದ ರೈತನಾ? (ಹೌದು/ಇಲ್ಲ)",
        "ನಿಮ್ಮ ಬಳಿ ಮಾನ್ಯವಾದ ಆಧಾರ್ ಕಾರ್ಡ್ ಇದೆಯೆ? (ಹೌದು/ಇಲ್ಲ)",
        "ನಿಮ್ಮ ವಾರ್ಷಿಕ ಆದಾಯ 6 ಲಕ್ಷಕ್ಕಿಂತ ಕಡಿಮೆಯೇ? (ಹೌದು/ಇಲ್ಲ)",
      ],
    },
    "OBC Business Loan Subsidy": {
      en: [
        "Do you have a business plan ready? (yes/no)",
        "Are you an OBC category member? (yes/no)",
        "Is your annual income below 8 lakhs? (yes/no)",
      ],
      hi: [
        "क्या आपके पास व्यवसाय योजना तैयार है? (हाँ/नहीं)",
        "क्या आप ओबीसी श्रेणी के सदस्य हैं? (हाँ/नहीं)",
        "क्या आपकी वार्षिक आय 8 लाख से कम है? (हाँ/नहीं)",
      ],
      kn: [
        "ನಿಮ್ಮ ಬಳಿ ವ್ಯವಹಾರ ಯೋಜನೆ ಸಿದ್ಧವಿದೆಯೆ? (ಹೌದು/ಇಲ್ಲ)",
        "ನೀವು OBC ವರ್ಗದ ಸದಸ್ಯರಾ? (ಹೌದು/ಇಲ್ಲ)",
        "ನಿಮ್ಮ ವಾರ್ಷಿಕ ಆದಾಯ 8 ಲಕ್ಷಕ್ಕಿಂತ ಕಡಿಮೆಯೇ? (ಹೌದು/ಇಲ್ಲ)",
      ],
    },
  };

  // 🎧 Start conversation when "Start" clicked
  useEffect(() => {
    if (started) handleStartConversation(selectedLanguage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  // Persist lastApplicationId whenever it changes
  useEffect(() => {
    if (lastApplicationId) {
      localStorage.setItem("lastApplicationId", lastApplicationId);
    } else {
      localStorage.removeItem("lastApplicationId");
    }
  }, [lastApplicationId]);

  // 🔹 Start Conversation
  async function handleStartConversation(lang) {
    try {
      const data = await apiStartConversation(lang);
      if (data.messages) {
        setChatMessages(data.messages);
        setCurrentStep(data.current_step || "ask_name");
        setUserData({});
        setEligibleSchemes([]);

        for (const msg of data.messages) {
          if (msg.isBot) await playBotAudio(msg.text, lang);
          setPreviewOpen(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  // 🔹 Change Language
  async function handleLanguageChange(code) {
    setSelectedLanguage(code);
    setChatMessages([]);
    setUserData({});
    setEligibleSchemes([]);
    setCurrentStep("ask_name");
    setApplicationPreview(null);
    setLastApplicationQA([]);
    setStarted(true);
    await handleStartConversation(code);
  }

  // 🔹 Handle Edit Click — hide preview and ask bot question
  async function handleEditField(questionText, fieldKey) {
    setEditingField({ question: questionText, key: fieldKey });
    setShowPreview(false);

    const botText = `Please provide a new value for "${questionText}"`;
    setChatMessages((prev) => [...prev, { text: botText, isBot: true }]);
    await playBotAudio(botText, selectedLanguage);
  }

  // 🔹 Send Chat Response
  async function sendConversationResponse(responseText) {
    // ✅ If user is editing a field from preview
    if (editingField) {
      const { question } = editingField;
      const updatedQA = lastApplicationQA.map((qa) =>
        qa.question === question ? { ...qa, answer: responseText } : qa
      );
      setLastApplicationQA(updatedQA);
      setEditingField(null);
      setShowPreview(true);

      setChatMessages((prev) => [
        ...prev,
        { text: responseText, isBot: false },
        {
          text: `Got it — I’ve updated your answer for "${question}". ✅`,
          isBot: true,
        },
      ]);

      await playBotAudio(
        `Got it. I’ve updated your answer for ${question}.`,
        selectedLanguage
      );
      return;
    }

    // ✅ Continue normal chat flow
    if (currentSchemeApplying && pendingExtraQuestions.length > 0) {
      setChatMessages((prev) => [...prev, { text: responseText, isBot: false }]);
      await handleExtraAnswer(responseText);
      return;
    }

    setChatMessages((prev) => [...prev, { text: responseText, isBot: false }]);
    try {
      const data = await apiSendConversation(
        currentStep,
        responseText,
        selectedLanguage,
        userData
      );
      setChatMessages((prev) => [...prev, { text: data.message, isBot: true }]);
      setCurrentStep(data.current_step);
      setUserData(data.user_data || {});
      if (data.message) await playBotAudio(data.message, selectedLanguage);

      // After details confirmation, trigger eligibility check
      if (currentStep === "confirm_details") {
        const affirmative = String(responseText).trim().toLowerCase();
        if (["yes", "y", "haan", "ha", "ಹೌದು", "हाँ"].includes(affirmative)) {
          setShowDashboard(false);
          await fetchEligibility(data.user_data || userData);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  // 🔹 Eligibility Check
  async function fetchEligibility(dataForCheck) {
    try {
      const data = await checkEligibilityAPI(dataForCheck, selectedLanguage);
      setEligibleSchemes(data.schemes || []);

      const msg =
        (data.schemes || []).length === 0
          ? {
              en: "No eligible schemes found.",
              hi: "कोई योग्य योजना नहीं मिली।",
              kn: "ಯೋಗ್ಯ ಯೋಜನೆಗಳು ಕಂಡುಬರುವಿಲ್ಲ.",
            }
          : {
              en: `Found ${data.schemes.length} eligible scheme(s).`,
              hi: `कुल ${data.schemes.length} योग्य योजना(एं) मिलीं।`,
              kn: `${data.schemes.length} ಯೋಗ್ಯ ಯೋಜನೆ(ಗಳು) ಕಂಡುಬಂದಿವೆ.`,
            };

      const text = msg[selectedLanguage] || msg.en;
      setChatMessages((prev) => [...prev, { text, isBot: true }]);
      await playBotAudio(text, selectedLanguage);
    } catch (e) {
      console.error(e);
    }
  }

  // 🔹 Voice Recording
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);

      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(audioChunks.current, { type: "audio/wav" });
        const fd = new FormData();
        fd.append("audio", blob, "recording.wav");

        try {
          const res = await fetch("http://localhost:5000/api/process-voice", {
            method: "POST",
            body: fd,
          });
          const j = await res.json();
          if (j.text) {
            setUserResponse("");
            await sendConversationResponse(j.text);
          }
        } catch (e) {
          console.error(e);
        }
      };

      mediaRecorder.current.start();
      setRecording(true);
    } catch (e) {
      console.error("Microphone access denied", e);
    }
  }

  function stopRecording() {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
      setRecording(false);
    }
  }

  // 🔹 Handle Extra Questions
  async function handleExtraAnswer(answer) {
    if (!currentSchemeApplying || pendingExtraQuestions.length === 0) return;
    const schemeName = currentSchemeApplying;
    const qIdx =
      schemeExtraQuestions[schemeName].length - pendingExtraQuestions.length;
    const qKey = `extra_q${qIdx + 1}`;
    const newAnswers = { ...currentExtraAnswers, [qKey]: answer };
    setCurrentExtraAnswers(newAnswers);
    const nextQuestions = [...pendingExtraQuestions];
    nextQuestions.shift();
    setPendingExtraQuestions(nextQuestions);
    if (nextQuestions.length > 0) {
      setChatMessages((prev) => [...prev, { text: nextQuestions[0], isBot: true }]);
      await playBotAudio(nextQuestions[0], selectedLanguage);
    } else {
      setCurrentSchemeApplying(null);
      setPendingExtraQuestions([]);
      setCurrentExtraAnswers({});
      await submitApplication(schemeName, { ...userData, ...newAnswers });
    }
  }

  // 🔹 Submit Application
  async function submitApplication(schemeName, applicationData) {
    try {
      // 🧾 Call backend API once
      const data = await submitApplicationAPI(schemeName, applicationData);

      // 🧠 Store the application data locally by scheme name
      setAppliedSchemes((prev) => ({
        ...prev,
        [schemeName]: data.application_data,
      }));

      // 🧩 Extract Q&A pairs from chat for preview
      const qaPairs = chatMessages
        .map((msg, idx, arr) => {
          if (msg.isBot && arr[idx + 1] && !arr[idx + 1].isBot) {
            return { question: msg.text, answer: arr[idx + 1].text };
          }
          return null;
        })
        .filter(Boolean);

      setLastApplicationQA(qaPairs);

      // 🗂️ Set preview data (so preview panel shows)
      setApplicationPreview({
        scheme: schemeName,
        fields: data.application_data,
        id: data.application_id,
      });

      // Save last application id locally & persist
      if (data.application_id) {
        setLastApplicationId(data.application_id);
      }

      // Hide eligible schemes section
      setEligibleSchemes([]);

      // ✅ Display success message with Application ID
      const appId = data.application_id;
      const successMsg = {
        en: `✅ Application for ${schemeName} submitted successfully!\nPlease note your Application ID: ${appId}`,
        hi: `✅ ${schemeName} के लिए आवेदन सफलतापूर्वक जमा हो गया है!\nकृपया अपना आवेदन आईडी नोट करें: ${appId}`,
        kn: `✅ ${schemeName} ಗೆ ಅರ್ಜಿ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ!\nದಯವಿಟ್ಟು ನಿಮ್ಮ ಅರ್ಜಿ ಐಡಿ ಗಮನಿಸಿ: ${appId}`,
      };

      const finalMsg = successMsg[selectedLanguage] || successMsg.en;

      // 💬 Add success message to chat
      setChatMessages((prev) => [...prev, { text: finalMsg, isBot: true }]);

      // 🔊 Play bot audio response
      await playBotAudio(finalMsg, selectedLanguage);
    } catch (e) {
      console.error("❌ Error submitting application:", e);
      setChatMessages((prev) => [
        ...prev,
        { text: `Failed to submit application for ${schemeName}. Please try again later.`, isBot: true },
      ]);
      await playBotAudio(`Failed to submit application for ${schemeName}. Please try again later.`, selectedLanguage);
    }
  }

  // 🔹 View Scheme Details
  async function viewSchemeDetails(schemeName) {
    try {
      await getSchemeDetails(schemeName, selectedLanguage);
    } catch (e) {
      console.error(e);
    }
  }

  // 🔹 Apply for Scheme
  async function applyForScheme(scheme) {
    if (appliedSchemes[scheme.name]) {
      setApplicationPreview({
        scheme: scheme.name,
        fields: appliedSchemes[scheme.name],
      });
      return;
    }

    const questionsObj = schemeExtraQuestions[scheme.name];
    const questions = questionsObj
      ? questionsObj[selectedLanguage] || questionsObj["en"]
      : null;

    if (questions && questions.length > 0) {
      setCurrentSchemeApplying(scheme.name);
      setPendingExtraQuestions([...questions]);
      setCurrentExtraAnswers({});
      setChatMessages((prev) => [
        ...prev,
        { text: `To apply for ${scheme.name}: ${questions[0]}`, isBot: true },
      ]);
      await playBotAudio(questions[0], selectedLanguage);
      return;
    }

    await submitApplication(scheme.name, userData);
  }

  // 🔹 Open preview handler from HeaderBar
  function handleOpenPreviewModal() {
  if (applicationPreview || lastApplicationId) {
    setShowPreview(true);
    setPreviewOpen(true); // ✅ Open your ApplicationPreview modal again
  } else {
    setShowApplications(true);
  }
}


  // -------------------------------
  // ✅ UI Rendering
  // -------------------------------
  return (
    <div
      className="app"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "90vh",
        background: "#f5f6fa",
      }}
    >
      <HeaderBar
        selectedLanguage={selectedLanguage}
        handleLanguageChange={handleLanguageChange}
        setShowApplications={setShowApplications}
        // show preview button only if we have an application id stored
        hasPreviewButton={!!lastApplicationId}
        onPreviewClick={handleOpenPreviewModal}
      />

      {!started && <StartOverlay setStarted={setStarted} />}

      {started && (
        <div
          style={{
            display: "flex",
            flexDirection: "coloumn",
            justifyContent: "center",
            alignItems: "flex-start",
            gap: 20,
            padding: 20,
            width: "97%",
            background: "#fff",
            boxShadow: "0 2px 16px #0001",
            minHeight: 600,
          }}
        >
          <SchemesDashboard
            eligibleSchemes={eligibleSchemes}
            showEligibleOnly={!showDashboard}
            viewSchemeDetails={viewSchemeDetails}
            applyForScheme={applyForScheme}
            selectedLanguage={selectedLanguage}
          />

          <ChatArea
            chatMessages={chatMessages}
            userResponse={userResponse}
            setUserResponse={setUserResponse}
            sendConversationResponse={sendConversationResponse}
            recording={recording}
            startRecording={startRecording}
            stopRecording={stopRecording}
          />

          {previewOpen && (
  <ApplicationPreview
    applicationPreview={applicationPreview}
    lastApplicationQA={lastApplicationQA}
    setLastApplicationQA={setLastApplicationQA}
    setApplicationPreview={(val) => {
      setApplicationPreview(val);
      if (val === null) setPreviewOpen(false); // Close modal properly
    }}
    handleEditField={handleEditField}
    showPreview={showPreview}
  />
)}

        </div>
      )}

      <ApplicationsModal
        showApplications={showApplications}
        setShowApplications={setShowApplications}
        appliedSchemes={appliedSchemes}
      />
    </div>
  );
}

export default App;
