const axios = require('axios');

class BochaService {
  constructor() {
    this.apiKey = 'sk-f0c3e69b3420499b82ef2cff6eb64587'; // 实际项目中建议放入 .env
    // Switch to Web Search API which is more reliable for specific stock queries
    this.apiUrl = 'https://api.bochaai.com/v1/web-search'; 
  }

  async searchStockInfo(query) {
    try {
      console.log(`[BochaService] Searching for: ${query}`);
      // Web Search API uses different parameters
      const response = await axios.post(this.apiUrl, {
        query: query,
        freshness: 'oneDay', // Prioritize fresh content
        summary: true,
        count: 10
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return this.parseWebSearchResponse(response.data);
    } catch (error) {
      console.error('[BochaService] API Error:', error.message);
      // ... error handling
      return {
        summary: '无法获取实时数据，请稍后再试。',
        stockData: null,
        webPages: []
      };
    }
  }

  parseWebSearchResponse(data) {
      let summary = '';
      let stockData = null;
      let webPages = [];

      if (data && data.data && data.data.webPages && data.data.webPages.value) {
          const pages = data.data.webPages.value;
          
          // Extract web pages
          webPages = pages.map(p => ({
              title: p.name,
              url: p.url,
              snippet: p.snippet || p.summary,
              date: p.datePublished
          }));

          // Try to find stock info from the first few results (often EastMoney or Sina)
          // Example Snippet: "当前: 贵州茅台 (600519) ... 1447.30 -0.13%"
          for (const p of pages) {
              const text = (p.name + " " + p.snippet).replace(/\s+/g, ' ');
              // Simple Regex to extract price if possible (heuristic)
              // Look for patterns like "1447.30" followed by percentage
              const priceMatch = text.match(/(\d+\.\d+)\s*[\-+]?\d+\.\d+%?/);
              if (priceMatch && !stockData) {
                  stockData = {
                      name: 'Search Result', // We don't have exact name structure here, use generic or infer from query
                      price: priceMatch[1],
                      snippet_source: p.snippet
                  };
              }
          }
      }
      
      return { summary, stockData, webPages };
  }

  // Keep old parser just in case we revert
  parseResponse(data) {
    // ... (Old AI Search Parser - unused now)
    return { summary: '', stockData: null, webPages: [] };
  }
  
  // Helper to format stock data into a readable string for LLM
  formatForLLM(data) {
      let text = '';
      
      if (data.stockData) {
          text += `【参考行情】(来自搜索结果摘要)\n`;
          text += `参考价格: ${data.stockData.price}\n`;
          text += `来源信息: ${data.stockData.snippet_source}\n\n`;
      } else {
          text += `【提示】未在搜索摘要中直接提取到结构化股价，请参考下方新闻内容。\n\n`;
      }

      if (data.webPages && data.webPages.length > 0) {
          text += `【相关新闻与网页】\n`;
          data.webPages.slice(0, 8).forEach((p, i) => {
              text += `${i+1}. ${p.title} (${p.date || '未知日期'})\n   摘要: ${p.snippet}\n   URL: ${p.url}\n\n`;
          });
      }

      return text;
  }
}

module.exports = new BochaService();
