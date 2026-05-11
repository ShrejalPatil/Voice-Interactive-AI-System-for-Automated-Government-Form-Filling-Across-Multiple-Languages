// src/utils/playBotAudio.js
export async function playBotAudio(text, language) {
  try {
    const res = await fetch('http://localhost:5000/api/text-to-speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language })
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await new Promise(resolve => {
        audio.onended = resolve;
        audio.play();
      });
    }
  } catch (e) {
    console.error('Audio play failed', e);
  }
}
