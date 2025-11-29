<template>
  <div class="agent-avatar" :class="[status, role]">
    <div class="avatar-wrapper" :class="{ 'is-3d': use3D }">
      <!-- 3D Model for specific roles -->
      <AgentModel3D 
        v-if="use3D" 
        :modelPath="modelPath" 
        :status="status"
        class="model-3d"
      />
      
      <!-- Use placeholders if actual assets are missing or not 3D -->
      <div v-else class="placeholder-img" :style="{ backgroundColor: roleColor }">
        {{ role[0].toUpperCase() }}
      </div>
    </div>
    <div class="role-badge">{{ roleName }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AgentModel3D from './AgentModel3D.vue'

const props = defineProps({
  role: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'idle' // idle, speaking, hidden
  }
})

const use3D = computed(() => {
  // All roles now have models
  return ['consultant', 'bull', 'bear', 'host'].includes(props.role)
})

const modelPath = computed(() => {
  if (props.role === 'consultant') {
    return '/agents/consultant/金融分析师.glb'
  }
  if (props.role === 'bull') {
    return '/agents/bull/牛市 激进决策者.glb'
  }
  if (props.role === 'bear') {
    return '/agents/bear/熊市 稳健风险管控者.glb'
  }
  if (props.role === 'host') {
    return '/agents/host/主持人 最终决策者.glb'
  }
  return ''
})

const roleColor = computed(() => {
  const map = {
    consultant: '#909399',
    bull: '#F56C6C',
    bear: '#67C23A',
    host: '#E6A23C'
  }
  return map[props.role] || '#ccc'
})

const roleName = computed(() => {
  const map = {
    consultant: '首席情报官',
    bull: '机会挖掘官',
    bear: '风险预警官',
    host: '主持人'
  }
  return map[props.role] || props.role
})

// Future implementation for loading actual assets
// const currentSrc = computed(() => `/agents/${props.role}/${props.status}.webp`)
</script>

<style scoped>
.agent-avatar {
  position: relative;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.6;
  transform: scale(0.9);
}

.agent-avatar.speaking {
  opacity: 1;
  transform: scale(1.1) translateY(-10px);
  z-index: 10;
}

.agent-avatar.speaking .avatar-wrapper {
  box-shadow: 0 0 30px currentColor;
  border: 2px solid white;
}

.avatar-wrapper {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.placeholder-img {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: bold;
  color: white;
}

.role-badge {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  white-space: nowrap;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Role specific glow colors */
.agent-avatar.bull { color: #F56C6C; }
.agent-avatar.bear { color: #67C23A; }
.agent-avatar.host { color: #E6A23C; }
.agent-avatar.consultant { color: #909399; }

.model-3d {
  width: 100%;
  height: 100%;
  display: block;
}

.avatar-wrapper.is-3d {
  background: transparent;
  border: none;
  border-radius: 0;
  overflow: visible;
  box-shadow: none !important;
  width: 300px; /* Increased from 240px */
  height: 400px; /* Increased from 320px */
  transform: translateY(0); /* Removed offset */
}

/* Hide speaking glow/border for 3D model since it has its own animation */
.agent-avatar.speaking .avatar-wrapper.is-3d {
  box-shadow: none;
  border: none;
}
</style>
