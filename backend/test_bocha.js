const axios = require('axios');

const API_KEY = 'sk-f0c3e69b3420499b82ef2cff6eb64587';
const URL = 'https://api.bochaai.com/v1/ai-search';

async function test() {
    try {
        const today = new Date();
        const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
        // Test only stock name
        const queryStr = `${dateStr} 宁德时代 股票最新实时价格`;
        console.log('Testing query:', queryStr);

        // Try 'query' parameter instead of messages, based on error 'Missing parameter query'
        const response = await axios.post(URL, {
            query: queryStr, 
            stream: false
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

test();