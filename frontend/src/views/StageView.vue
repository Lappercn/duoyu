<template>
  <div class="stage-container">
    <!-- Left Panel: Dashboard -->
    <div class="dashboard-panel" :class="{ visible: store.consultantOutput }">
      <MarketDashboard :data="store.consultantOutput" />
    </div>

    <!-- Main Stage -->
    <div class="stage-area">
      
      <!-- Debate Timeline Panel -->
      <div class="timeline-panel" :class="{ visible: store.revealedTranscript.length > 0 }">
          <div class="timeline-header">
              <h3>辩论实录</h3>
          </div>
          <div class="timeline-content" ref="timelineContent">
              <div 
                v-for="(item, index) in store.revealedTranscript" 
                :key="index" 
                class="timeline-item" 
                :class="[item.speaker, { 'latest': index === store.revealedTranscript.length - 1 }]"
              >
                  <div class="timeline-avatar">
                      <div class="avatar-icon">{{ getRoleInitial(item.speaker) }}</div>
                  </div>
                  <div class="timeline-bubble">
                      <div class="bubble-header">{{ getRoleName(item.speaker) }}</div>
                      <div class="bubble-text" v-html="renderMarkdown(item.content)"></div>
                  </div>
              </div>
          </div>
      </div>

      <!-- Debate Agenda -->
      <div class="debate-agenda" v-if="store.debatePlan && store.debatePlan.length > 0" :class="{ visible: store.userConfirmed }">
        <h3><i class="el-icon-s-order"></i> 辩论核心议题</h3>
        <ul>
          <li v-for="(topic, index) in store.debatePlan" :key="index" :class="{ active: store.currentTopic === topic }">
            <div class="topic-marker"></div>
            <span class="round-num">R{{ index + 1 }}</span>
            <span class="topic-text">{{ topic }}</span>
          </li>
        </ul>
      </div>

      <!-- Interaction Overlay: Consultant Done -->
      <div class="interaction-overlay" v-if="store.waitingForUser">
          <div class="interaction-card">
              <h3>情报收集完成</h3>
              <p>顾问已完成市场扫描，准备开启多轮辩论。</p>
              <el-button type="primary" size="large" @click="handleUserConfirm">我已了解，开始辩论</el-button>
          </div>
      </div>

      <div class="agents-circle" :class="{ 'timeline-active': store.revealedTranscript.length > 0 }">
        <!-- Consultant (Top Left) -->
        <div class="agent-position pos-consultant" ref="agentConsultant" :class="{ active: store.activeSpeaker === 'consultant' }">
          <div class="agent-inner-wrapper">
            <AgentAvatar role="consultant" :status="getAgentStatus('consultant')" />
          </div>
        </div>

        <!-- Bull (Left) -->
        <div class="agent-position pos-bull" ref="agentBull" :class="{ active: store.activeSpeaker === 'bull' }">
          <div class="agent-inner-wrapper">
            <AgentAvatar role="bull" :status="getAgentStatus('bull')" />
          </div>
        </div>

        <!-- Host (Center Top) -->
        <div class="agent-position pos-host" ref="agentHost" :class="{ active: store.activeSpeaker === 'host' }">
          <div class="agent-inner-wrapper">
            <AgentAvatar role="host" :status="getAgentStatus('host')" />
          </div>
        </div>

        <!-- Bear (Right) -->
        <div class="agent-position pos-bear" ref="agentBear" :class="{ active: store.activeSpeaker === 'bear' }">
          <div class="agent-inner-wrapper">
            <AgentAvatar role="bear" :status="getAgentStatus('bear')" />
          </div>
        </div>

      </div>

      <!-- Final Verdict Overlay -->
      <div class="verdict-overlay" v-if="store.showVerdictModal && store.finalResult">
        <div class="verdict-card">
          <h2>最终建议: <span :class="verdictClass">{{ store.finalResult.decision }}</span></h2>
          <!-- Render markdown for verdict reasoning too -->
          <div class="reasoning markdown-body" v-html="renderMarkdown(store.finalResult.reasoning)"></div>
          <div class="btn-group">
             <el-button type="success" @click="showReport = true">生成投资报告</el-button>
             <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
          </div>
        </div>
      </div>
      
      <!-- Final Report Modal -->
      <FinalReport v-if="showReport" :data="store.finalResult" @close="showReport = false" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useAnalysisStore } from '../stores/analysis'
import AgentAvatar from '../components/AgentAvatar.vue'
import MarketDashboard from '../components/MarketDashboard.vue'
import FinalReport from '../components/FinalReport.vue'
import gsap from 'gsap'
import { marked } from 'marked'

const store = useAnalysisStore()
const showReport = ref(false)
const timelineContent = ref(null)

const renderMarkdown = (text) => {
    return marked(text || '')
}

const getRoleInitial = (role) => {
    if (!role) return '?'
    const map = {
        consultant: '顾',
        bull: '牛',
        bear: '熊',
        host: '主'
    }
    return map[role] || role[0].toUpperCase()
}

const getRoleName = (role) => {
    const map = {
        consultant: '首席情报官',
        bull: '机会挖掘官',
        bear: '风险预警官',
        host: '主持人'
    }
    return map[role] || role
}

// Auto-scroll timeline
watch(() => store.revealedTranscript.length, () => {
    nextTick(() => {
        if (timelineContent.value) {
            timelineContent.value.scrollTop = timelineContent.value.scrollHeight
        }
    })
})

// Separate speech computed properties to maintain state during transitions
const consultantSpeech = computed(() => {
    if (store.status === 'processing' && !store.consultantOutput) return '正在全网检索最新数据...'
    if (store.consultantOutput) return '数据检索完成，已生成情报报告。'
    return ''
})

const getDebateText = (role) => {
    // Get the latest message for the role
    const logs = store.visibleTranscript.filter(l => l.speaker.toLowerCase() === role)
    if (logs.length === 0) return ''
    return logs[logs.length - 1].content
}

const bullSpeech = computed(() => getDebateText('bull'))
const bearSpeech = computed(() => getDebateText('bear'))

const hostSpeech = computed(() => {
    if (store.finalResult) return store.finalResult.reasoning
    return getDebateText('host')
})

const showVerdict = ref(false)

// Animation Refs
const agentConsultant = ref(null)
const agentBull = ref(null)
const agentBear = ref(null)
const agentHost = ref(null)

const getAgentStatus = (role) => {
  // Active speaker is always speaking
  if (store.activeSpeaker === role) return 'speaking'
  
  // If user confirmed (debate started), everyone stays idle (visible)
  if (store.userConfirmed) {
      if (role === 'bull' || role === 'bear' || role === 'host') {
          return 'idle'
      }
  }

  // If it's visible in transcript but not active speaker, it's idle
  if (role === 'bull' || role === 'bear' || role === 'host') {
      if (store.visibleTranscript.some(l => l.speaker === role)) return 'idle'
  }
  
  // Consultant Logic
  if (role === 'consultant') {
      // If debate started, consultant should leave
      if (store.userConfirmed) return 'hidden'
      
      if (store.consultantOutput) return 'idle'
      if (store.status === 'processing') return 'speaking' 
  }
  
  return 'hidden'
}

const verdictClass = computed(() => {
  const d = store.finalResult?.decision
  if (d === 'BUY') return 'text-red'
  if (d === 'SELL') return 'text-green'
  return 'text-yellow'
})

const handleUserConfirm = () => {
    // Trigger Consultant Exit - Speed up to 0.2s
    if (agentConsultant.value) {
         gsap.to(agentConsultant.value, { y: 100, opacity: 0, duration: 0.2, onComplete: () => {
             // Resume store flow
             store.confirmConsultant()
         }})
    } else {
        store.confirmConsultant()
    }
}

// Watchers for Sequential Animations
watch(() => store.userConfirmed, (newVal) => {
    if (newVal) {
        // Trigger Entrances immediately when user confirms
        
        // Host Entrance
        nextTick(() => {
            gsap.fromTo(agentHost.value, 
                { y: -50, opacity: 0, scale: 0.8, xPercent: -50 },
                { y: 0, opacity: 1, scale: 1, xPercent: -50, duration: 1, ease: 'elastic.out(1, 0.5)' } 
            )
        })

        // Bull Entrance
        nextTick(() => {
            gsap.fromTo(agentBull.value, 
                { x: -300, opacity: 0, scale: 0.5, rotation: -20, xPercent: -50 },
                { x: 0, opacity: 1, scale: 1, rotation: 0, xPercent: -50, duration: 1.2, ease: 'elastic.out(1, 0.6)', delay: 0.3 }
            )
        })

        // Bear Entrance
        nextTick(() => {
            gsap.fromTo(agentBear.value, 
                { x: 300, opacity: 0, scale: 0.5, rotation: 20, xPercent: -50 },
                { x: 0, opacity: 1, scale: 1, rotation: 0, xPercent: -50, duration: 1.2, ease: 'elastic.out(1, 0.6)', delay: 0.6 }
            )
        })
    }
})

// Watch for Final Result to trigger Verdict
watch(() => store.isFinalStage, (newVal) => {
    if (newVal) {
        nextTick(() => {
             // Bull and Bear Exit
             gsap.to(agentBull.value, { x: -800, opacity: 0, duration: 1.5, ease: 'power2.in' })
             gsap.to(agentBear.value, { x: 800, opacity: 0, duration: 1.5, ease: 'power2.in' })
             
             // Host moves to center focus
             gsap.to(agentHost.value, { scale: 1.2, y: -20, duration: 1, xPercent: -50 })
        })
    }
})

onMounted(() => {
  // Initial Consultant Entrance
  gsap.fromTo(agentConsultant.value,
    { y: 50, opacity: 0 },
    { y: 0, opacity: 1, duration: 1, ease: 'power2.out' }
  )
})
</script>

<style scoped>
.interaction-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
}

.interaction-card {
  background: rgba(20, 24, 36, 0.9);
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 50px rgba(0,0,0,0.5);
}

.interaction-card h3 {
  font-size: 24px;
  color: #FFD700;
  margin-bottom: 15px;
}

.interaction-card p {
  color: #ccc;
  margin-bottom: 30px;
  font-size: 16px;
}

.stage-container {
  height: 100vh;
  width: 100vw;
  background-image: url('https://plus.unsplash.com/premium_photo-1681487769650-a0c3fbaed85a?q=80&w=2155&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  overflow: hidden;
  position: relative;
}

/* Add a dark overlay to ensure content visibility */
.stage-container::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(26, 28, 44, 0.85); /* Dark blue-ish overlay */
    z-index: 0;
}

/* Ensure content sits above the overlay */
.dashboard-panel, .stage-area {
    z-index: 1;
}

.dashboard-panel {
  width: 320px;
  height: 100%;
  position: absolute;
  left: -320px;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 20;
  border-right: 1px solid rgba(255,255,255,0.1);
  background: rgba(0,0,0,0.8);
}

.dashboard-panel.visible {
  transform: translateX(320px);
}

.stage-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-left: 0; /* Start centered */
  transition: margin-left 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
}

/* Responsive adjustments for mobile */
@media (min-width: 768px) {
    .dashboard-panel.visible + .stage-area {
        margin-left: 320px;
    }
}

.agents-circle {
  position: relative;
  width: 100%;
  max-width: 800px;
  height: 600px;
}

/* Active Speaker Highlight - Floating Effect */
.agent-position.active {
  z-index: 100;
  filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.5));
}

/* Specific override for Bull/Bear who might have different base transforms */
/* But we defined their base pos as transform: translateX(-50%); so this keyframe works for all centered agents. */

.agent-position.active .agent-inner-wrapper {
    /* Removed CSS sway as we are moving to internal 3D model animation */
}



/* Inactive Speaker Dimming */
.agent-position:not(.active) {
  filter: grayscale(0.8) brightness(0.6);
  /* transform: scale(0.9); Removed scaling to prevent movement */
}

.agent-position {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: filter 0.5s cubic-bezier(0.4, 0, 0.2, 1); /* Only animate filter, not transform */
  opacity: 0; /* Default hidden for GSAP control */
  /* transform: scale(0.9); Removed default scale */
}

/* Visible state helper for non-GSAP managed visibility if needed, 
   but we use GSAP fromTo, so opacity 0 start is good. 
   However, 'getAgentStatus' returns 'hidden' which we can use to force hide if logic dictates.
*/
.agent-position:has(.hidden) {
    opacity: 0 !important;
    pointer-events: none;
}
.agent-position:has(.idle), .agent-position:has(.speaking) {
    opacity: 1 !important;
}

/* Desktop Positioning - Centered Stage */
.pos-host { top: 50px; left: 40%; transform: translateX(-50%); }
.pos-bull { top: 250px; left: 15%; transform: translateX(-50%); }
.pos-bear { top: 250px; left: 65%; transform: translateX(-50%); }
.pos-consultant { bottom: 150px; left: 40%; transform: translateX(-50%); }

/* Mobile Positioning */
@media (max-width: 768px) {
    .dashboard-panel {
        width: 100%;
        height: 40%;
        bottom: -40%;
        top: auto;
        left: 0;
        transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .dashboard-panel.visible {
        transform: translateY(-100%);
    }

    .stage-area {
        height: 100%;
        align-items: flex-start;
        padding-top: 20px;
    }

    /* Mobile adjustment for timeline overlaying agents */
    .timeline-panel.visible ~ .agents-circle {
        /* We can't use sibling selector here because timeline-panel is inside stage-area and agents-circle is also inside */
        /* Wait, they are siblings. */
    }
    
    .agents-circle {
        height: 60%; /* Leave space for dashboard */
        width: 100%;
        transition: all 0.5s ease;
    }

    .agents-circle.timeline-active {
        height: 45%; /* Shrink when timeline is visible */
    }

    .pos-host { top: 10px; left: 50%; transform: translateX(-50%) scale(0.8); }
    .pos-bull { top: 150px; left: 20px; transform: scale(0.8); }
    .pos-bear { top: 150px; right: 20px; transform: scale(0.8); }
    .pos-consultant { top: 280px; left: 50%; transform: translateX(-50%) scale(0.8); }
    
    /* Adjust bubbles for mobile */
    /* :deep(.speech-bubble) {
        width: 200px !important;
        font-size: 0.8rem !important;
        padding: 10px !important;
        top: -150px !important;
    } */
}

/* Timeline Panel Styles */
.timeline-panel {
    position: absolute;
    top: 0;
    right: -400px; /* Hidden initially */
    width: 400px;
    height: 100%;
    background: rgba(20, 24, 36, 0.95);
    border-left: 1px solid rgba(255, 215, 0, 0.2);
    z-index: 50;
    display: flex;
    flex-direction: column;
    transition: right 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: -5px 0 30px rgba(0,0,0,0.5);
}

.timeline-panel.visible {
    right: 0;
}

.timeline-header {
    padding: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.3);
}

.timeline-header h3 {
    color: #FFD700;
    margin: 0;
    font-size: 18px;
    letter-spacing: 1px;
}

.timeline-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.timeline-item {
    display: flex;
    gap: 15px;
    opacity: 0;
    animation: slideIn 0.5s forwards;
}

@keyframes slideIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.timeline-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: white;
    flex-shrink: 0;
    border: 2px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.timeline-bubble {
    background: rgba(255, 255, 255, 0.05);
    padding: 12px 16px;
    border-radius: 12px;
    color: #eee;
    font-size: 14px;
    line-height: 1.6;
    border: 1px solid rgba(255, 255, 255, 0.05);
    max-width: 100%;
}

.bubble-header {
    font-size: 12px;
    color: #888;
    margin-bottom: 5px;
    font-weight: bold;
}

/* Role Specific Styles */
.consultant .timeline-avatar { background: #909399; }
.bull .timeline-avatar { background: #F56C6C; }
.bear .timeline-avatar { background: #67C23A; }
.host .timeline-avatar { background: #E6A23C; }

.consultant .timeline-bubble { border-left: 3px solid #909399; }
.bull .timeline-bubble { border-left: 3px solid #F56C6C; background: rgba(245, 108, 108, 0.05); }
.bear .timeline-bubble { border-left: 3px solid #67C23A; background: rgba(103, 194, 58, 0.05); }
.host .timeline-bubble { border-left: 3px solid #E6A23C; background: rgba(230, 162, 60, 0.05); }

/* Latest Message Highlight */
.timeline-item.latest .timeline-bubble {
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.1);
    border-color: rgba(255, 215, 0, 0.3);
}

.debate-agenda {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 250px;
  background: rgba(20, 24, 36, 0.9);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 15px;
  padding: 20px;
  z-index: 100;
  opacity: 0;
  transform: translateX(50px);
  transition: all 0.5s ease;
  box-shadow: 0 5px 20px rgba(0,0,0,0.5);
}

.debate-agenda.visible {
  opacity: 1;
  transform: translateX(0);
}

/* Shift Agenda Left when Timeline is Visible */
.timeline-panel.visible ~ .debate-agenda {
    right: 420px; /* 400px (timeline) + 20px (gap) */
}

.debate-agenda h3 {
  color: #FFD700;
  font-size: 16px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 10px;
}

.debate-agenda ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.debate-agenda li {
  display: flex;
  align-items: center;
  padding: 10px;
  margin-bottom: 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #888;
  transition: all 0.3s;
  border-left: 3px solid transparent;
}

.debate-agenda li.active {
  background: rgba(255, 215, 0, 0.1);
  color: #fff;
  border-left: 3px solid #FFD700;
  transform: translateX(5px);
}

.debate-agenda li .round-num {
  font-size: 12px;
  font-weight: bold;
  margin-right: 10px;
  background: rgba(0,0,0,0.3);
  padding: 2px 6px;
  border-radius: 4px;
}

.debate-agenda li .topic-text {
  font-size: 14px;
}

/* Mobile Adjustments for Agenda */
@media (max-width: 768px) {
  .debate-agenda {
    top: 60px;
    right: 10px;
    width: 180px;
    padding: 10px;
  }
  
  .debate-agenda h3 {
    font-size: 14px;
    margin-bottom: 10px;
  }
  
  .debate-agenda li {
    padding: 8px;
    font-size: 12px;
  }
}

.btn-group {
  display: flex;
  gap: 15px;
  margin-top: 20px;
  justify-content: center;
}

.verdict-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  animation: fadeIn 0.5s;
  padding: 20px;
}

.verdict-card {
  background: rgba(30, 30, 40, 0.95);
  padding: 40px;
  border-radius: 16px;
  text-align: center;
  max-width: 600px;
  width: 100%;
  border: 1px solid rgba(255, 215, 0, 0.3);
  box-shadow: 0 0 30px rgba(0,0,0,0.5);
  color: white;
}

.verdict-card h2 {
    font-size: 2rem;
    margin-bottom: 1rem;
}

.reasoning {
    font-size: 1.1rem;
    line-height: 1.6;
    opacity: 0.9;
    margin-bottom: 2rem;
    text-align: left; /* Align left for markdown */
    max-height: 50vh; /* Increased height */
    overflow-y: auto;
    padding: 10px; /* Add padding for scrollbar spacing */
}

/* Markdown Styles within Verdict Card */
.reasoning :deep(strong) {
    color: #FFD700;
    font-weight: bold;
}

.reasoning :deep(p) {
    margin-bottom: 10px;
}

.reasoning :deep(ul), .reasoning :deep(ol) {
    padding-left: 20px;
    margin-bottom: 10px;
}

.reasoning :deep(li) {
    margin-bottom: 5px;
}

.text-red { color: #F56C6C; text-shadow: 0 0 10px rgba(245, 108, 108, 0.5); }
.text-green { color: #67C23A; text-shadow: 0 0 10px rgba(103, 194, 58, 0.5); }
.text-yellow { color: #E6A23C; text-shadow: 0 0 10px rgba(230, 162, 60, 0.5); }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
/* Mobile Adjustments for Timeline */
@media (max-width: 768px) {
    .timeline-panel {
        width: 100%;
        height: 50%;
        top: auto;
        bottom: 0;
        right: 0;
        border-left: none;
        border-top: 1px solid rgba(255, 215, 0, 0.2);
        transform: translateY(100%);
        transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .timeline-panel.visible {
        transform: translateY(0);
    }
    
    /* Push agents up on mobile when timeline is visible */
    .agents-circle {
        transition: all 0.5s;
    }
    
    .timeline-panel.visible ~ .agents-circle {
        height: 40%;
    }
}
</style>
