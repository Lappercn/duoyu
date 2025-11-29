const axios = require('axios');
const fs = require('fs');
const path = require('path');

class TTSService {
  constructor() {
    this.appId = '6806274217';
    this.accessToken = 'iKGzuw81fnOBOjkAqh7hh3i6YJ7QJqav'; // User provided
    // Secret key is usually for signing, but simplified API might just use Bearer token.
    // We will try standard API first.
    this.apiUrl = 'https://openspeech.bytedance.com/api/v1/tts';
    this.cluster = 'volcano_tts'; // Common cluster for these voices
  }

  async generateAudio(text, voiceType) {
    try {
      const reqId =  crypto.randomUUID();
      
      const payload = {
        app: {
          appid: this.appId,
          token: this.accessToken,
          cluster: this.cluster
        },
        user: {
          uid: "user_1"
        },
        audio: {
          voice_type: voiceType,
          encoding: "mp3",
          speed_ratio: 1.0,
          volume_ratio: 1.0,
          pitch_ratio: 1.0,
        },
        request: {
          reqid: reqId,
          text: text,
          operation: "query",
          with_frontend: 1,
          frontend_type: "unitTson"
        }
      };

      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer;${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.data) {
        return response.data.data; // Base64 string
      } else {
        console.error('TTS API Error:', response.data);
        throw new Error('TTS Generation Failed');
      }
    } catch (error) {
      console.error('TTS Service Error:', error.message);
      throw error;
    }
  }
}

module.exports = new TTSService();
