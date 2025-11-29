const axios = require('axios');

const API_KEY = 'sk-f0c3e69b3420499b82ef2cff6eb64587';
const URL = 'https://api.bochaai.com/v1/web-search';

async function testWebSearch() {
    try {
        const today = new Date();
        const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
        const queryStr = `${dateStr} 600519 贵州茅台 最新股价`;
        console.log('Testing Web Search query:', queryStr);

        const response = await axios.post(URL, {
            query: queryStr,
            freshness: 'oneMonth', // 可选：noLimit, oneDay, oneWeek, oneMonth, oneYear
            summary: true,
            count: 10
        }, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testWebSearch();