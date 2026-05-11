// src/hooks/useVoiceRecorder.js
import { useRef, useState } from 'react';

export default function useVoiceRecorder(onStopCallback) {
  const [recording, setRecording] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = e => audioChunks.current.push(e.data);

      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/wav' });
        onStopCallback(blob);
      };

      mediaRecorder.current.start();
      setRecording(true);
    } catch (e) {
      console.error('Microphone access denied', e);
    }
  }

  function stopRecording() {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      setRecording(false);
    }
  }

  return { recording, startRecording, stopRecording };
}
