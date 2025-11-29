const OpenAI = require('openai');

class LLMService {
  constructor() {
  }

  async call(messages, tools = [], onChunk = null) {
    try {
      const apiKey = process.env.DOUBAO_API_KEY;
      const baseURL = 'https://ark.cn-beijing.volces.com/api/v3';
      const modelVersion = process.env.DOUBAO_MODEL_VERSION;

      const client = new OpenAI({
        apiKey: apiKey,
        baseURL: baseURL
      });

      const requestOptions = {
        model: modelVersion,
        messages: messages,
        stream: !!onChunk // Enable stream if callback provided
      };

      if (tools.length > 0) {
        const validTools = tools.filter(t => t.type !== 'web_search');
        if (validTools.length > 0) {
            requestOptions.tools = validTools;
        } else {
            console.log('Web Search requested: relying on Endpoint Plugin configuration.');
        }
      }

      console.log('Calling LLM (OpenAI SDK) with options:', JSON.stringify({
        model: requestOptions.model,
        tools: requestOptions.tools,
        stream: requestOptions.stream
      }, null, 2));

      const response = await client.chat.completions.create(requestOptions);

      if (requestOptions.stream) {
        let fullContent = '';
        for await (const chunk of response) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                  fullContent += content;
                  if (onChunk) await onChunk(content);
                }
              }
        return fullContent;
      } else {
        if (response && response.choices && response.choices.length > 0) {
          return response.choices[0].message.content;
        } else {
          console.error('Unexpected LLM response format:', response);
          throw new Error('Invalid LLM response');
        }
      }

    } catch (error) {
      console.error('LLM Call Error Details:', error);
      throw error;
    }
  }
}

module.exports = new LLMService();
