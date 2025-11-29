<template>
  <div class="entry-container">
    <!-- Image Background -->
    <div class="image-bg"></div>
    <!-- Overlay for better text readability -->
    <div class="bg-overlay"></div>

    <div class="content-wrapper">
      <h1 class="title">多鱼理财 · 多智能体投顾</h1>
      <p class="subtitle">AI Agent Investment Advisor</p>
      
      <div class="search-bar-container">
        <div class="search-box">
          <input 
            v-model="form.stockCode" 
            type="text" 
            placeholder="输入股票名称或代码 (如: 茅台 / 600519)" 
            class="search-input"
            @keyup.enter="handleSubmit"
          />
          <button class="search-btn" @click="handleSubmit" :disabled="loading">
            <el-icon v-if="!loading"><Search /></el-icon>
            <el-icon v-else class="is-loading"><Loading /></el-icon>
          </button>
        </div>
        
        <div class="options-row">
          <div class="option-group">
            <span class="option-label">风险偏好:</span>
            <div class="radio-group">
              <label v-for="opt in riskOptions" :key="opt.value" class="radio-label" :class="{ active: form.riskProfile === opt.value }">
                <input type="radio" :value="opt.value" v-model="form.riskProfile">
                {{ opt.label }}
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAnalysisStore } from '../stores/analysis'
import { Search, Loading } from '@element-plus/icons-vue'

const router = useRouter()
const store = useAnalysisStore()
const loading = ref(false)

const form = ref({
  stockCode: '',
  riskProfile: 'steady',
  marketSentiment: ''
})

const riskOptions = [
  { label: '稳健型', value: 'steady' },
  { label: '激进型', value: 'aggressive' },
  { label: '保守型', value: 'conservative' }
]

const handleSubmit = async () => {
  if (!form.value.stockCode) return
  
  loading.value = true
  try {
    await store.startAnalysis(
      form.value.stockCode,
      form.value.riskProfile,
      form.value.marketSentiment
    )
    router.push('/stage')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.entry-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1c2c;
  color: white;
  position: relative;
  overflow: hidden;
}

.image-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('https://plus.unsplash.com/premium_photo-1679923813998-6603ee2466c5?q=80&w=1770&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
}

.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(3px);
  z-index: 1;
}

.content-wrapper {
  text-align: center;
  width: 100%;
  max-width: 800px;
  padding: 20px;
  position: relative;
  z-index: 2;
}

.title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  letter-spacing: 2px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 4rem;
  font-weight: 300;
  letter-spacing: 1px;
}

.search-bar-container {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(15px);
  padding: 10px;
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 15px 35px rgba(0,0,0,0.2);
  transition: transform 0.3s, box-shadow 0.3s;
  max-width: 700px;
  margin: 0 auto;
}

.search-bar-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  background: rgba(255, 255, 255, 0.2);
}

.search-box {
  display: flex;
  align-items: center;
  height: 60px;
  padding: 0 10px;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  height: 100%;
  font-size: 1.5rem;
  color: white;
  padding: 0 20px;
  outline: none;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.2rem;
}

.search-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background: #FFD700;
  color: #1a1c2c;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.search-btn:hover {
  transform: scale(1.1);
  background: #fff;
}

.options-row {
  display: flex;
  justify-content: center;
  padding: 10px 20px;
  border-top: 1px solid rgba(255,255,255,0.1);
  margin-top: 5px;
}

.option-group {
  display: flex;
  align-items: center;
  gap: 15px;
}

.option-label {
  font-size: 0.9rem;
  color: rgba(255,255,255,0.8);
}

.radio-group {
  display: flex;
  gap: 15px;
}

.radio-label {
  cursor: pointer;
  font-size: 0.9rem;
  color: rgba(255,255,255,0.6);
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 5px;
}

.radio-label input {
  display: none;
}

.radio-label.active {
  color: #FFD700;
  font-weight: bold;
}

.is-loading {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
