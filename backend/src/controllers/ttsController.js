const express = require('express');
const router = express.Router();
const ttsService = require('../services/ttsService');

// POST /api/tts
router.post('/', async (req, res) => {
  try {
    const { text, role } = req.body;

    if (!text) {
      return res.status(400).json({ msg: 'Text is required' });
    }

    // Map roles to Volcengine Voice Types
    const voiceMap = {
      'consultant': 'zh_male_yuanboxiaoshu_moon_bigtts', // 渊博小叔
      'bull': 'zh_male_yangguangqingnian_moon_bigtts',   // 阳光青年
      'bear': 'zh_female_zhixingnvsheng_mars_bigtts',    // 知性女声
      'host': 'zh_male_yuanboxiaoshu_moon_bigtts'        // 邻家女孩 -> 渊博小叔
    };

    const voiceType = voiceMap[role] || 'zh_female_linjianvhai_moon_bigtts';

    const audioBase64 = await ttsService.generateAudio(text, voiceType);
    
    res.json({ 
      code: 200,
      data: { audio: audioBase64 } 
    });

  } catch (err) {
    console.error('TTS Controller Error:', err);
    const errorMessage = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    res.status(500).json({ 
      code: 500, 
      message: 'TTS Server Error', 
      error: errorMessage 
    });
  }
});

module.exports = router;
