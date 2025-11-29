import axios from 'axios';

class AudioService {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.isPlaying = false;
  }

  async speak(text, role, onStart, onEnd) {
    if (!text) {
        if (onEnd) onEnd();
        return;
    }

    // Clean Markdown
    const cleanText = text.replace(/[*#`]/g, '').replace(/\[.*?\]\(.*?\)/g, '');

    try {
        // Call backend to get audio
        // We use a baseUrl from env or default
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
        const response = await axios.post(`${baseUrl}/tts`, {
            text: cleanText,
            role
        });

        if (response.data.code === 200 && response.data.data.audio) {
            const audioData = this.base64ToArrayBuffer(response.data.data.audio);
            const audioBuffer = await this.audioContext.decodeAudioData(audioData);
            
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext.destination);
            
            source.onended = () => {
                this.isPlaying = false;
                if (onEnd) onEnd();
            };

            if (onStart) onStart();
            this.isPlaying = true;
            source.start(0);
        } else {
            throw new Error('Invalid TTS response');
        }

    } catch (e) {
        console.error('TTS Playback Error:', e);
        this.isPlaying = false;
        if (onEnd) onEnd();
    }
  }

  base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  stop() {
    if (this.audioContext) {
        this.audioContext.close().then(() => {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        });
    }
    this.isPlaying = false;
  }
}

export default new AudioService();
