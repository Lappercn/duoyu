<template>
  <div class="entry-container">
    <div class="content-wrapper">
      <h1 class="title">多鱼理财 · 多智能体投顾</h1>
      <p class="subtitle">AI Agent Investment Advisor</p>
      
      <div class="form-card">
        <el-form :model="form" label-width="0">
          <el-form-item>
            <el-input 
              v-model="form.stockCode" 
              placeholder="请输入股票代码 (如: 600519)" 
              class="input-large"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item>
            <el-select v-model="form.riskProfile" placeholder="选择您的风险偏好" class="select-large">
              <el-option label="稳健型 (Steady)" value="steady" />
              <el-option label="激进型 (Aggressive)" value="aggressive" />
              <el-option label="保守型 (Conservative)" value="conservative" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-input 
              v-model="form.marketSentiment" 
              type="textarea" 
              placeholder="补充线索 (可选): 您关注的新闻或市场传闻..."
              rows="3"
            />
          </el-form-item>
          
          <el-button 
            type="primary" 
            class="submit-btn" 
            :loading="loading"
            @click="handleSubmit"
          >
            召唤投研团队
          </el-button>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAnalysisStore } from '../stores/analysis'
import { Search } from '@element-plus/icons-vue'

const router = useRouter()
const store = useAnalysisStore()
const loading = ref(false)

const form = ref({
  stockCode: '',
  riskProfile: 'steady',
  marketSentiment: ''
})

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
  background: linear-gradient(135deg, #1a1c2c 0%, #4a192c 100%);
  color: white;
}

.content-wrapper {
  text-align: center;
  width: 100%;
  max-width: 480px;
  padding: 20px;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(to right, #fff, #ccc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.8;
  margin-bottom: 3rem;
}

.form-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.input-large :deep(.el-input__wrapper),
.select-large :deep(.el-input__wrapper) {
  background-color: rgba(0, 0, 0, 0.2);
  box-shadow: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
  height: 50px;
}

.input-large :deep(.el-input__inner) {
  color: white;
  font-size: 1.1rem;
}

.submit-btn {
  width: 100%;
  height: 50px;
  font-size: 1.1rem;
  margin-top: 1rem;
  background: linear-gradient(45deg, #ff6b6b, #ff8e53);
  border: none;
}

.submit-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
</style>
