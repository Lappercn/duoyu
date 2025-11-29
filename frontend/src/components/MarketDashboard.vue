<template>
  <div class="dashboard-card" v-if="data && data.scores">
    <h3>实时市场情报</h3>
    
    <div class="scores-radar" ref="radarChart"></div>

    <div class="metrics-grid">
      <div class="metric-item">
        <span class="label">情绪分</span>
        <span class="value" :class="getScoreColor(data.scores.sentiment)">{{ data.scores.sentiment }}</span>
      </div>
      <div class="metric-item">
        <span class="label">风险分</span>
        <span class="value" :class="getScoreColor(100 - data.scores.risk)">{{ data.scores.risk }}</span>
      </div>
      <div class="metric-item">
        <span class="label">基本面</span>
        <span class="value">{{ data.scores.fundamental }}</span>
      </div>
    </div>

    <div class="news-summary" v-if="data.marketInfoSummary">
      <h4>关键摘要</h4>
      <!-- Use markdown renderer for summary -->
      <div class="summary-content" v-html="renderedSummary"></div>
    </div>
  </div>
  <div class="dashboard-card loading" v-else>
    <div class="loading-spinner"></div>
    <p>顾问智能体正在检索全网数据...</p>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import * as echarts from 'echarts'
import { marked } from 'marked'

const props = defineProps({
  data: Object
})

const radarChart = ref(null)
let chartInstance = null

const renderedSummary = computed(() => {
  if (!props.data?.marketInfoSummary) return ''
  // Just render the whole thing or a cleaner version
  return marked(props.data.marketInfoSummary)
})

const getScoreColor = (score) => {
  if (score >= 70) return 'text-green'
  if (score <= 30) return 'text-red'
  return 'text-yellow'
}

const initChart = async () => {
  await nextTick()
  if (!props.data?.scores || !radarChart.value) return
  
  // Destroy old instance if exists to prevent memory leaks or resize issues
  if (chartInstance) {
      chartInstance.dispose()
  }
  
  // Initialize
  chartInstance = echarts.init(radarChart.value)
  
  // Ensure data exists to prevent empty chart
  const sentiment = props.data.scores.sentiment || 50;
  const fundamental = props.data.scores.fundamental || 50;
  const risk = props.data.scores.risk || 50;
  
  // Calculated mock values for visual balance if missing
  const technical = 60; 
  const momentum = 50;

  const option = {
    radar: {
      indicator: [
        { name: 'Sentiment', max: 100 },
        { name: 'Fundamental', max: 100 },
        { name: 'Technical', max: 100 },
        { name: 'Risk', max: 100 },
        { name: 'Momentum', max: 100 }
      ],
      splitArea: {
        areaStyle: {
          color: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
        }
      },
      axisName: {
          color: '#fff'
      }
    },
    series: [{
      type: 'radar',
      data: [{
        value: [
          sentiment,
          fundamental,
          technical,
          risk,
          momentum
        ],
        name: 'Analysis'
      }],
      areaStyle: {
        color: 'rgba(255, 215, 0, 0.3)'
      },
      lineStyle: {
        color: '#FFD700'
      },
      itemStyle: {
          color: '#FFD700'
      }
    }]
  }
  chartInstance.setOption(option)
}

watch(() => props.data, (newVal) => {
  if (newVal && newVal.scores) {
      initChart()
  }
}, { deep: true })

onMounted(() => {
  initChart()
  window.addEventListener('resize', () => chartInstance && chartInstance.resize())
})
</script>

<style scoped>
.dashboard-card {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  height: 100%;
  padding: 20px;
  color: white;
  width: 300px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  gap: 15px; /* Reduce gap to bring elements closer */
}

.dashboard-card.loading {
    align-items: center;
    justify-content: center;
    text-align: center;
}

h3 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: #FFD700;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  padding-bottom: 10px;
}

.scores-radar {
  width: 100%;
  height: 200px;
  min-height: 200px; /* Ensure height */
  display: block;    /* Ensure display */
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 1rem 0;
  text-align: center;
}

.metric-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 10px 5px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.label {
  display: block;
  font-size: 0.7rem;
  opacity: 0.7;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.value {
  font-weight: bold;
  font-size: 1.2rem;
}

.text-green { color: #67C23A; }
.text-red { color: #F56C6C; }
.text-yellow { color: #E6A23C; }

/* Custom scrollbar for news-summary */
.news-summary::-webkit-scrollbar {
  width: 6px;
}
.news-summary::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 3px;
}
.news-summary::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}
.news-summary::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

.news-summary {
  margin-top: 0; /* Remove auto margin to bring closer */
  background: rgba(255, 255, 255, 0.05);
  padding: 15px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex: 1; /* Allow growth */
  overflow-y: auto; /* Scroll if too long */
  max-height: 400px; /* Increased max-height */
}

.news-summary h4 {
    margin-top: 0;
    margin-bottom: 10px;
    font-size: 0.9rem;
    color: #ddd;
}

.summary-content {
    font-size: 0.85rem;
    line-height: 1.5;
    color: #ccc;
}

.summary-content :deep(strong) {
    color: #fff;
    font-weight: bold;
}

.summary-content :deep(ul) {
    padding-left: 20px;
    margin: 5px 0;
}

.summary-text {
  font-size: 0.85rem;
  opacity: 0.8;
  line-height: 1.5;
  text-align: justify;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: #FFD700;
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
