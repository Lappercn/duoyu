<template>
  <div class="speech-bubble" :class="role">
    <div class="content" v-html="renderedContent"></div>
    <span class="cursor" v-if="typing">|</span>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed, onUnmounted } from 'vue'
import { marked } from 'marked'

const props = defineProps({
  text: String,
  role: String
})

const displayedText = ref('')
const typing = ref(false)
let typeInterval = null

const renderedContent = computed(() => {
  return marked(displayedText.value)
})

watch(() => props.text, (newText) => {
  if (!newText) return
  
  // If new text is an extension of current text (streaming)
  if (newText.startsWith(displayedText.value) || (displayedText.value.length > 0 && newText.startsWith(displayedText.value.slice(0, -1)))) {
     // Continue typing from where we are
     if (!typing.value) {
         startTyping()
     }
  } else {
    // Completely new text
    displayedText.value = ''
    startTyping()
  }
})

const startTyping = () => {
  if (typeInterval) clearInterval(typeInterval)
  typing.value = true
  
  typeInterval = setInterval(() => {
    const target = props.text || ''
    const current = displayedText.value
    
    if (current.length < target.length) {
      // Type next character
      // Speed up if behind by a lot
      const diff = target.length - current.length
      const step = diff > 50 ? 5 : (diff > 10 ? 2 : 1)
      
      displayedText.value = target.slice(0, current.length + step)
    } else {
      clearInterval(typeInterval)
      typeInterval = null
      typing.value = false
    }
  }, 20)
}

onMounted(() => {
  if (props.text) startTyping()
})

onUnmounted(() => {
  if (typeInterval) clearInterval(typeInterval)
})
</script>

<style scoped>
.speech-bubble {
  position: absolute;
  top: -220px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(20, 24, 36, 0.85); /* Dark business glass */
  backdrop-filter: blur(12px);
  color: #eee;
  padding: 20px;
  border-radius: 16px;
  width: 380px;
  max-height: 250px;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  z-index: 100;
  font-size: 0.95rem;
  line-height: 1.8;
  border: 1px solid rgba(255, 255, 255, 0.1);
  pointer-events: auto;
  transition: all 0.3s ease;
}

/* Role specific styling */
.bull { border-top: 3px solid #F56C6C; box-shadow: 0 10px 40px rgba(245, 108, 108, 0.15); }
.bear { border-top: 3px solid #67C23A; box-shadow: 0 10px 40px rgba(103, 194, 58, 0.15); }
.host { border-top: 3px solid #E6A23C; box-shadow: 0 10px 40px rgba(230, 162, 60, 0.15); }
.consultant { border-top: 3px solid #909399; box-shadow: 0 10px 40px rgba(144, 147, 153, 0.15); }

/* Positioning overrides */
.bubble-left {
  left: 120% !important;
  transform: none !important;
  top: -100px !important;
}

.bubble-left::after {
    left: -10px;
    bottom: 50%;
    transform: translateY(50%) rotate(90deg); /* Point left */
    border-color: transparent transparent rgba(20, 24, 36, 0.85) transparent;
}

.bubble-right {
  left: auto !important;
  right: 120% !important;
  transform: none !important;
  top: -100px !important;
}

.bubble-right::after {
    left: auto;
    right: -10px;
    bottom: 50%;
    transform: translateY(50%) rotate(-90deg); /* Point right */
    border-color: transparent transparent rgba(20, 24, 36, 0.85) transparent;
}

.speech-bubble::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 10px 10px 0;
  border-style: solid;
  border-color: rgba(20, 24, 36, 0.85) transparent transparent transparent;
}

.content :deep(p) {
  margin: 0 0 10px 0;
}
.content :deep(strong) {
  color: #fff;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(255,255,255,0.3);
}
.content :deep(ul) {
  padding-left: 20px;
  margin: 5px 0;
}

.cursor {
  animation: blink 1s infinite;
  color: #000;
  font-weight: bold;
}

@keyframes blink {
  50% { opacity: 0; }
}

/* Role specific bubble borders */
.bull { border-top: 4px solid #F56C6C; }
.bear { border-top: 4px solid #67C23A; }
.host { border-top: 4px solid #E6A23C; }
.consultant { border-top: 4px solid #909399; }
</style>
