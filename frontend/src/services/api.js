import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default {
  startAnalysis(payload) {
    return apiClient.post('/analysis', payload);
  },
  getAnalysisStatus(id) {
    return apiClient.get(`/analysis/${id}`);
  },
};
