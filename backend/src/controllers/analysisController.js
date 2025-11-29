const express = require('express');
const router = express.Router();
const AnalysisRecord = require('../models/AnalysisRecord');
const agentOrchestrator = require('../services/agentOrchestrator');

// POST /api/analysis
router.post('/', async (req, res) => {
  try {
    const { stockCode, riskProfile, marketSentiment } = req.body;

    if (!stockCode) {
      return res.status(400).json({ msg: 'Stock Code is required' });
    }

    const newRecord = new AnalysisRecord({
      stockCode,
      riskProfile: riskProfile || 'steady',
      marketSentiment: marketSentiment || ''
    });

    const savedRecord = await newRecord.save();

    // Trigger async analysis
    agentOrchestrator.startAnalysis(savedRecord._id);

    res.json({ 
      msg: 'Analysis started', 
      data: { analysisId: savedRecord._id } 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/analysis/:id
router.get('/:id', async (req, res) => {
  try {
    const record = await AnalysisRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ msg: 'Analysis not found' });
    }
    res.json({ data: record });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Analysis not found' });
    }
    res.status(500).send('Server Error');
  }
});

const tts = async (req, res) => {
  try {
    const { text, role } = req.body;
    
    // Map role to specific Doubao voice types
    // Reference: https://www.volcengine.com/docs/6561/97465
    let voiceType = 'BV001_streaming'; // Default female
    const normalizedRole = role ? role.toLowerCase() : 'consultant';
    
    if (normalizedRole === 'consultant') voiceType = 'BV001_streaming'; // Professional Female
    if (normalizedRole === 'bull') voiceType = 'BV056_streaming'; // Confident Male (Opportunity Hunter)
    
    // Bear: Strict/Sassy Female
    if (normalizedRole === 'bear') voiceType = 'BV002_streaming'; 
    
    // Host: MUST match Consultant (Chief Intelligence Officer)
    // User requirement: "Chief Intelligence Officer and Host must use the same voice"
    if (normalizedRole === 'host') voiceType = 'BV001_streaming'; // Same as Consultant
    
    const audioData = await ttsService.generateAudio(text, voiceType);
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        audio: audioData
      }
    });
  } catch (error) {
    console.error('TTS Controller Error:', error);
    res.status(500).json({ code: 500, message: 'TTS failed' });
  }
};

// Define routes properly
router.post('/tts', tts);

module.exports = router;
