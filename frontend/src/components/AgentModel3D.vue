<template>
  <div class="model-container" ref="container">
      <!-- Loading Overlay -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <div class="loading-text">{{ loadingProgress }}%</div>
      </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch, onUnmounted } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'

const props = defineProps({
  modelPath: String,
  status: String // idle, speaking, hidden
})

const container = ref(null)
const isLoading = ref(true)
const loadingProgress = ref(0)
let scene, camera, renderer, model, mixer, clock
let actions = {} // store animations
let activeAction = null
let basePosition = new THREE.Vector3() // Store initial position
const speakingStartTime = ref(0)

const initScene = () => {
    if (!container.value) return

    scene = new THREE.Scene()
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5) // Increased intensity
    scene.add(ambientLight)
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 2) // Stronger directional
    dirLight.position.set(2, 5, 5)
    scene.add(dirLight)

    // Camera
    camera = new THREE.PerspectiveCamera(40, container.value.clientWidth / container.value.clientHeight, 0.1, 100)
    camera.position.set(0, 0.2, 3) // Positioned at center X=0
    camera.lookAt(0, 0, 0) // Look directly at center
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(container.value.clientWidth, container.value.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    container.value.appendChild(renderer.domElement)
    
    // Clock
    clock = new THREE.Clock()
    
    loadModel()
}

const loadModel = () => {
    isLoading.value = true
    const loader = new GLTFLoader()
    
    // Configure Draco Loader for compressed models
    const dracoLoader = new DRACOLoader()
    // Use local decoder files from public/draco/
    // Ensure path ends with /
    const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/'
    dracoLoader.setDecoderPath(`${base}draco/`)
    dracoLoader.setDecoderConfig({ type: 'js' })
    loader.setDRACOLoader(dracoLoader)

    loader.load(props.modelPath, (gltf) => {
        isLoading.value = false
        model = gltf.scene
        
        // Center and Scale
        const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = 1.3 / maxDim // Reduced from 1.5 to 1.3
    model.scale.set(scale, scale, scale)
    
    model.position.x = -center.x * scale
    model.position.y = -center.y * scale - 0.8 // Adjusted down even more
    model.position.z = -center.z * scale
    
    // Store base position for animation offsets
    basePosition.copy(model.position)
    
    // Fix Rotation (Rotate -90 degrees to face front if model is side-facing)
    model.rotation.y = -Math.PI / 2;

    scene.add(model)
        
        // Animations
        mixer = new THREE.AnimationMixer(model)
        if (gltf.animations.length > 0) {
            // Log animations to debug
            // console.log(props.modelPath, gltf.animations.map(a => a.name))
            
            // Try to find standard animations or fallback to first
            // Common names: "Idle", "Talking", "Speaking", "Walk"
            // Mixamo names often: "mixamo.com"
            
            // We'll map status to animation index or name search
            gltf.animations.forEach((clip) => {
                actions[clip.name] = mixer.clipAction(clip)
            })
            
            updateAnimation()
        }
    }, (xhr) => {
        if (xhr.total > 0) {
            loadingProgress.value = Math.round((xhr.loaded / xhr.total) * 100)
        }
    }, (error) => {
        console.error('Model Load Error:', error)
        isLoading.value = false
    })
}

const updateAnimation = () => {
    if (!mixer || !model) return
    
    // Logic to choose animation based on status
    // For now, we just play the first available animation if idle
    // If speaking, we look for a 'talk' or 'speak' animation, else speed up idle?
    
    let targetActionName = null
    const clipNames = Object.keys(actions)
    
    if (clipNames.length === 0) return
    
    if (props.status === 'speaking') {
        // Try to find talking animation
        targetActionName = clipNames.find(n => n.toLowerCase().includes('talk') || n.toLowerCase().includes('speak'))
    }
    
    // Fallback to Idle or first
    if (!targetActionName) {
        targetActionName = clipNames.find(n => n.toLowerCase().includes('idle')) || clipNames[0]
    }
    
    const newAction = actions[targetActionName]
    
    if (activeAction !== newAction) {
        if (activeAction) activeAction.fadeOut(0.5)
        if (newAction) {
            newAction.reset().fadeIn(0.5).play()
            
            // If speaking, maybe speed it up slightly?
            if (props.status === 'speaking') {
                newAction.timeScale = 1.2
            } else {
                newAction.timeScale = 1.0
            }
            
            activeAction = newAction
        }
    }
}

const animate = () => {
    requestAnimationFrame(animate)
    if (mixer) mixer.update(clock.getDelta())
    
    // Add Procedural Animation (Sway/Breathing)
    if (model) {
        const time = clock.getElapsedTime();
        
        // 1. Breathing (Up/Down) - Always active but subtle
        // Use basePosition.y to prevent drift
        model.position.y = basePosition.y + Math.sin(time * 1.5) * 0.02;
        
        if (props.status === 'speaking') {
            const speakTime = clock.getElapsedTime() - speakingStartTime.value;
            
            // 2. Speaking Sway (Left/Right Rotation)
            // Damped sine wave: fades out after ~2 seconds
            // e^(-t*1.5) makes it decay quickly
            const dampFactor = Math.max(0, Math.exp(-speakTime * 1.5));
            // Sway: Speed 5, Amp 0.25 (initial) -> 0
            const sway = Math.sin(speakTime * 5) * 0.25 * dampFactor;
            
            model.rotation.y = -Math.PI / 2 + sway;
            
            // 3. Forward Tilt (Z axis)
            // Static lean offset + slight oscillation
            // Increased lean offset to 0.15 (was ~0.05 oscillation only)
            // Keep breathing oscillation but smaller
            const leanOffset = 0.15; 
            const leanBreath = Math.sin(time * 2.5) * 0.03;
            model.rotation.z = leanOffset + leanBreath;
            
        } else {
            // 3. Idle Sway (Very subtle)
            model.rotation.y = -Math.PI / 2 + Math.sin(time * 0.5) * 0.05;
            model.rotation.z = 0; // Reset lean
        }
    }

    if (renderer && scene && camera) renderer.render(scene, camera)
}

watch(() => props.status, (newVal) => {
    updateAnimation()
    if (newVal === 'speaking') {
        speakingStartTime.value = clock.getElapsedTime()
    }
})

onMounted(() => {
    initScene()
    animate()
})

onUnmounted(() => {
    // Cleanup
    if (renderer) {
        renderer.dispose()
    }
})
</script>

<style scoped>
.model-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  z-index: 10;
  backdrop-filter: blur(2px);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

.loading-text {
  color: white;
  font-size: 14px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
