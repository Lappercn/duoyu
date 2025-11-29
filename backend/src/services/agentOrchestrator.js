const AnalysisRecord = require('../models/AnalysisRecord');
const llmService = require('./llmService');

class AgentOrchestrator {
  async startAnalysis(recordId) {
    console.log(`Starting analysis for record: ${recordId}`);
    const record = await AnalysisRecord.findById(recordId);
    if (!record) return;

    try {
      record.status = 'processing';
      await record.save();

      // --- Phase 1: Consultant (Data Mining) ---
      console.log('Phase 1: Consultant Agent working...');
      const consultantSystemPrompt = process.env.PROMPT_CONSULTANT || "You are a professional financial consultant. Summarize the latest market data.";
      const userQuery = `请检索股票代码 ${record.stockCode} 的最新信息。`;
      
      record.consultantOutput = {
          marketInfoSummary: '',
          scores: { sentiment: 50, risk: 50, fundamental: 50 }
      };
      await record.save();

      let lastSave = Date.now();
      const consultantOutputRaw = await llmService.call(
        [
            { role: 'system', content: consultantSystemPrompt },
            { role: 'user', content: userQuery }
        ], 
        [{ type: 'web_search' }],
        async (chunk) => {
            record.consultantOutput.marketInfoSummary += chunk;
            if (Date.now() - lastSave > 500) {
                lastSave = Date.now();
                await record.save().catch(err => console.error('Stream save error:', err.message));
            }
        }
      );
      
      record.consultantOutput.marketInfoSummary = consultantOutputRaw; 
      try {
          const jsonMatch = consultantOutputRaw.match(/```json\s*(\{[\s\S]*?\})\s*```/) || consultantOutputRaw.match(/(\{[\s\S]*"scores"[\s\S]*\})/);
          if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[1]);
              if (parsed.scores) record.consultantOutput.scores = parsed.scores;
          }
      } catch (e) {
        console.warn('Failed to parse JSON scores:', e.message);
      }
      await record.save();

      // --- Phase 1.5: Host Planning (Define Dimensions) ---
      console.log('Phase 1.5: Host Planning...');
      const marketInfo = record.consultantOutput.marketInfoSummary;
      
      const planPrompt = `
      你是一场金融辩论赛的主持人。基于以下市场情报，请提炼出 3 个最具争议或关键的探讨维度（例如：估值逻辑、业绩增长、市场情绪、潜在风险等）。
      
      要求：
      1. 维度名称要简洁有力（4字以内）。
      2. 必须返回纯 JSON 数组格式，不要Markdown，不要其他废话。
      3. 示例：["估值水平", "业绩增长", "风险因素"]
      
      市场情报：
      ${marketInfo.slice(0, 2000)}
      `;

      const planOutput = await llmService.call([
          { role: 'system', content: 'You are a JSON generator.' },
          { role: 'user', content: planPrompt }
      ]);

      let debateTopics = ["估值分析", "增长潜力", "风险因素"];
      try {
          const match = planOutput.match(/\[.*\]/s);
          if (match) {
              debateTopics = JSON.parse(match[0]);
          }
      } catch (e) {
          console.error('Failed to parse debate plan, using defaults:', e.message);
      }
      
      record.debatePlan = debateTopics;
      await record.save();

      // --- Helper for Stream Updates ---
      const createStreamHandler = (index) => {
          let buffer = '';
          let lastSave = Date.now();
          return {
              onChunk: async (chunk) => {
                  buffer += chunk;
                  if (Date.now() - lastSave > 500) {
                      lastSave = Date.now();
                      await AnalysisRecord.updateOne(
                          { _id: record._id },
                          { $set: { [`debateTranscript.${index}.content`]: buffer } }
                      );
                  }
              },
              getBuffer: () => buffer
          };
      };

      const finalUpdate = async (index, content) => {
          await AnalysisRecord.updateOne(
              { _id: record._id },
              { $set: { [`debateTranscript.${index}.content`]: content } }
          );
      };

      // --- Phase 2: Topic-based Debate Loop ---
      console.log('Phase 2: Debate Loop Starting...');
      
      let fullTranscriptContext = "";

      for (let i = 0; i < debateTopics.length; i++) {
          const topic = debateTopics[i];
          console.log(`Debating Topic ${i+1}: ${topic}`);

          // 1. Host Intro
          const hostIndex = record.debateTranscript.length;
          record.debateTranscript.push({ round: i + 1, topic, speaker: 'host', content: '' });
          await record.save();

          const hostHandler = createStreamHandler(hostIndex);
          const hostIntroPrompt = `
          你是一场即兴金融辩论的主持人。
          当前探讨维度：【${topic}】。
          请用一句话引出这个话题，语气要专业且期待，引导【机会挖掘官】和【风险预警官】开始辩论。
          严禁使用“多头”、“空头”、“多空双方”等旧称呼。
          字数限制：30字以内。
          `;
          const hostContent = await llmService.call([{ role: 'user', content: hostIntroPrompt }], [], hostHandler.onChunk);
          await finalUpdate(hostIndex, hostContent);
          fullTranscriptContext += `Host (Intro ${topic}): ${hostContent}\n`;

          // 2. Bull Argument
          const bullIndex = record.debateTranscript.length;
          record.debateTranscript.push({ round: i + 1, topic, speaker: 'bull', content: '' });
          await record.save();

          const bullHandler = createStreamHandler(bullIndex);
          const bullPrompt = `
          身份：【机会挖掘官】（原多头）。
          当前话题：【${topic}】。
          市场情报：${marketInfo.slice(0, 1000)}...
          
          任务：挖掘该维度的投资机会和上涨潜力。
          要求：
          1. 必须自称“我”或“机会挖掘官”，禁止使用“多头”、“多方”等金融术语。
          2. 语气要敏锐、富有洞察力，像一位发现金矿的探险家。
          3. 观点要言之有物，结合数据，不要空喊口号。
          4. 口语化表达，自然流畅。
          5. 字数控制在150-200字，尽可能详细阐述你的观点。
          `;
          const bullContent = await llmService.call([{ role: 'user', content: bullPrompt }], [], bullHandler.onChunk);
          await finalUpdate(bullIndex, bullContent);
          fullTranscriptContext += `Opportunity Hunter (${topic}): ${bullContent}\n`;

          // 3. Bear Argument
          const bearIndex = record.debateTranscript.length;
          record.debateTranscript.push({ round: i + 1, topic, speaker: 'bear', content: '' });
          await record.save();

          const bearHandler = createStreamHandler(bearIndex);
          const bearPrompt = `
          身份：【风险预警官】（原空头）。
          当前话题：【${topic}】。
          【机会挖掘官】观点：${bullContent}
          
          任务：针对该话题进行风险提示，泼一盆冷水。
          要求：
          1. 必须自称“我”或“风险预警官”，禁止使用“空头”、“空方”等金融术语。
          2. 语气要冷静、理智、甚至略带怀疑，像一位严格的审计师。
          3. 指出对方逻辑中的盲点或市场忽视的隐患。
          4. 口语化表达。
          5. 字数控制在150-200字，反驳要犀利且有理有据。
          `;
          const bearContent = await llmService.call([{ role: 'user', content: bearPrompt }], [], bearHandler.onChunk);
          await finalUpdate(bearIndex, bearContent);
          fullTranscriptContext += `Risk Auditor (${topic}): ${bearContent}\n`;

          // 4. Host Summary (New Step)
          const hostSumIndex = record.debateTranscript.length;
          record.debateTranscript.push({ round: i + 1, topic, speaker: 'host', content: '' });
          await record.save();

          const hostSumHandler = createStreamHandler(hostSumIndex);
          const hostSumPrompt = `
          你是一场投资研讨会的主持人。
          当前维度：【${topic}】。
          
          【机会挖掘官】观点：${bullContent}
          【风险预警官】观点：${bearContent}
          
          任务：总结本轮交锋，并推进流程。
          要求：
          1. 称呼双方为“机会挖掘官”和“风险预警官”，严禁使用“多头/空头/多方/空方”。
          2. 总结要点要精辟，客观呈现双方分歧。
          3. 语气专业、从容。
          4. 字数控制在80字左右。
          `;
          const hostSumContent = await llmService.call([{ role: 'user', content: hostSumPrompt }], [], hostSumHandler.onChunk);
          await finalUpdate(hostSumIndex, hostSumContent);
          fullTranscriptContext += `Host (Summary ${topic}): ${hostSumContent}\n`;
      }

      // --- Phase 3: Final Conclusion ---
      console.log('Phase 3: Final Conclusion...');
      
      const finalIndex = record.debateTranscript.length;
      record.debateTranscript.push({ round: 99, speaker: 'host', content: '' }); // Round 99 for final
      await record.save();

      const finalHandler = createStreamHandler(finalIndex);
      const finalPrompt = `
      你是一场金融辩论赛的主持人。
      辩论全程记录：
      ${fullTranscriptContext}
      
      任务：对整场辩论进行总结陈词。
      要求：
      1. 总结双方在各个维度的核心分歧。
      2. 给出最终的投资倾向（买入/卖出/观望）并说明理由。
      3. 语气权威、客观。
      4. 结构清晰，分点论述。
      5. 字数控制在400-600字，提供一份详实的分析报告内容。
      `;
      
      const finalContent = await llmService.call([{ role: 'user', content: finalPrompt }], [], finalHandler.onChunk);
      await finalUpdate(finalIndex, finalContent);

      // Parse final decision
      let decision = 'HOLD';
      if (finalContent.includes('买入') || finalContent.includes('BUY')) decision = 'BUY';
      if (finalContent.includes('卖出') || finalContent.includes('SELL')) decision = 'SELL';

      record.finalResult = {
        decision: decision,
        reasoning: finalContent,
        confidence: 85
      };
      
      record.status = 'completed';
      await record.save();
      console.log('Analysis completed.');

    } catch (error) {
      console.error('Orchestrator Error:', error);
      record.status = 'failed';
      await record.save();
    }
  }
}

module.exports = new AgentOrchestrator();
