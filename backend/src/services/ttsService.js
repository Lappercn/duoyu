const axios = require('axios');
const crypto = require('crypto');

// Helper for delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class TTSService {
  constructor() {
    this.appId = process.env.TTS_APPID || '6806274217';
    this.accessToken = process.env.TTS_ACCESS_TOKEN || 'iKGzuw81fnOBOjkAqh7hh3i6YJ7QJqav';
    this.secretKey = process.env.TTS_SECRET_KEY || 'i7N-dDnXTdwzg-SsgR_TGSWLm3nksgq1'; // New Secret Key
    this.apiUrl = 'https://openspeech.bytedance.com/api/v1/tts';
    this.cluster = process.env.TTS_CLUSTER || 'volcano_tts'; 
  }

  async generateAudio(text, voiceType, retryCount = 0) {
    try {
      const reqId = crypto.randomUUID();
      
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

      // Use Authorization header: Bearer;access_token
      // If using API Key/Secret Key, it usually requires signature, but volcanic TTS often uses just Bearer token in header.
      // The screenshot shows Access Token and Secret Key. 
      // For simple API usage, 'Authorization': `Bearer;${this.accessToken}` is correct for Access Token auth.
      // If Secret Key is needed for signature auth (HMAC), that's a different flow.
      // Usually for Volcano TTS, Bearer token is enough.
      // However, if 429 persists, it might be quota related, not auth.
      // But let's double check if we need to update the header format.
      // Standard Volcano TTS Header: 'Authorization': `Bearer;${accessToken}`
      
      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer;${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Check for API specific error codes in response body if status is 200 but logic failed
      // Volcengine sometimes returns 200 with error info in body
      if (response.data && response.data.code !== 3000 && response.data.code !== undefined) {
           // If code exists and is not 3000 (Success), treat as error
           // Check specifically for rate limit codes if known, otherwise generic retry
           console.warn(`TTS API Logic Error (Attempt ${retryCount + 1}):`, JSON.stringify(response.data));
           throw { response: { status: 400, data: response.data } }; 
      }

      if (response.data && response.data.data) {
        return response.data.data; // Base64 string
      } else {
        console.error('TTS API Error: No data received', JSON.stringify(response.data));
        throw new Error('TTS Generation Failed: No data');
      }
    } catch (error) {
      // Handle Rate Limiting (429) or Concurrency Limits
      if (error.response && (error.response.status === 429 || error.response.status === 503)) {
        if (retryCount < 5) {
          const delay = 1000 * Math.pow(2, retryCount); // Exponential backoff: 1s, 2s, 4s...
          console.warn(`TTS Rate Limit Hit (429). Retrying in ${delay}ms... (Attempt ${retryCount + 1}/5)`);
          await sleep(delay);
          return this.generateAudio(text, voiceType, retryCount + 1);
        } else {
            console.error('TTS Max Retries Exceeded for Rate Limit.');
            throw error;
        }
      }

      console.error('TTS Service Error Details:', {
        message: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
        stack: error.stack
      });
      throw error;
    }
  }
}

module.exports = new TTSService();