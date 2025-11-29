<template>
  <div class="model-container" ref="container">
      <!-- Model loaded by Three.js -->
  </div>
</template>

<script setup>
import { onMounted, ref, watch, onUnmounted } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const props = defineProps({
  modelPath: String,
  status: String // idle, speaking, hidden
})

const container = ref(null)
let scene, camera, renderer, model, mixer, clock
let actions = {} // store animations
let activeAction = null

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
    const loader = new GLTFLoader()
    loader.load(props.modelPath, (gltf) => {
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
    if (renderer && scene && camera) renderer.render(scene, camera)
}

watch(() => props.status, (newVal) => {
    updateAnimation()
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
}
</style>
