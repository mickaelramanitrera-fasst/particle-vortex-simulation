import React, { useMemo, useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = `
uniform float uTime;
// x, z = center, y = time, w = strength (0.0 = inactive)
uniform vec4 uRipples[20]; 

uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uColorTime;
uniform vec3 uRippleColor;

attribute vec3 aOriginalPos;

varying float vAlpha;
varying vec3 vColor;

void main() {
  vec3 pos = aOriginalPos;
  
  // Base landscape wave
  float wave1 = sin(pos.x * 0.2 + uTime * 0.5) * sin(pos.z * 0.2 + uTime * 0.5) * 2.0;
  float wave2 = sin(pos.x * 1.0 + uTime) * cos(pos.z * 0.8 + uTime) * 0.5;
  float baseHeight = wave1 + wave2;
  
  float totalRipple = 0.0;
  vec3 totalColor = vec3(0.0);
  float colorWeight = 0.0;
  
  // Loop through all potential ripples
  for (int i = 0; i < 20; i++) {
      vec4 rippleData = uRipples[i];
      float strength = rippleData.w;
      
      if (strength > 0.0) {
          vec2 center = rippleData.xz;
          float time = rippleData.y;
          float dist = distance(pos.xz, center);
          
          float speed = 15.0;
          // Scale wavelength with strength (1-20)
          // At 1: 4.5
          // At 20: 14.0
          float waveLength = 4.0 + strength * 0.5;
          float frequency = 6.28 / waveLength;
          float currentRadius = time * speed;
          
          if (dist < currentRadius) {
              float distFromFront = dist - currentRadius;
              float distDamp = 1.0 / (1.0 + dist * 0.1);
              // Slower time decay for longer lasting ripples
              float timeDamp = exp(-time * 0.05);
              
              // Normalize strength 1-20 -> 0-1
              float t = strength / 20.0;
              
              // Quadratic interpolation for amplitude
              // Scaled down by factor of 3 as requested
              // Min (1): ~0.7
              // Max (20): ~16.0
              float targetAmplitude = mix(0.7, 16.0, t * t);
              
              // Wider wave packet to show more rings at higher strength
              float packetWidth = 0.1 / max(1.0, strength * 0.5);
              float packetDamp = exp(-abs(distFromFront) * packetWidth);
              
              float totalDamp = distDamp * timeDamp * packetDamp;
              
              float wave = sin(frequency * distFromFront);
              
              float displacement = wave * targetAmplitude * totalDamp;
              
              totalRipple += displacement;
              
              // For color, we want it to last longer and be visible even when wave is small due to distance
              // So we use the wave signal within the packet, ignoring distance damping
              float signal = wave * packetDamp;
              float intensity = smoothstep(0.1, 0.9, abs(signal));
              
              // Optional: slight time fade for color, but much slower than wave height
              intensity *= exp(-time * 0.01);
              
              if (intensity > 0.0) {
                  // Use uniform ripple color
                  // Boost ripple brightness significantly
                  totalColor += uRippleColor * intensity * 5.0;
                  colorWeight += intensity;
              }
          }
      }
  }
  
  pos.y = baseHeight + totalRipple;
  
  // Color Transition Logic
  float distFromCenter = length(pos.xz);
  float colorSpeed = 20.0;
  float colorWaveFront = uColorTime * colorSpeed;
  float colorMix = smoothstep(colorWaveFront - 5.0, colorWaveFront, distFromCenter);
  // mix(B, A, colorMix) -> If dist > waveFront, use A (old), else use B (new)
  // smoothstep returns 0 if dist < waveFront-5 (new color), 1 if dist > waveFront (old color)
  
  vec3 baseColor = mix(uColorB, uColorA, colorMix);
  // Boost base color brightness
  baseColor *= 2.5;
  
  // Blend base color with ripple colors
  if (colorWeight > 0.0) {
      // Mix base color with ripple color based on intensity
      // We want the ripple color to shine through
      vColor = mix(baseColor, totalColor / colorWeight, min(1.0, colorWeight));
  } else {
      vColor = baseColor;
  }
  
  // Magic Sparkles on Collisions (High Amplitude)
  // Threshold > 1.5 to catch more collisions
  float sparkleThreshold = 1.5; 
  float sparkleIntensity = smoothstep(sparkleThreshold, sparkleThreshold * 2.0, abs(totalRipple));
  
  if (sparkleIntensity > 0.0) {
      // High frequency flicker
      float flicker = 0.5 + 0.5 * sin(uTime * 30.0 + pos.x * 137.0 + pos.z * 43.0);
      
      // Sparkle color (Super Bright White/Gold mix)
      // Values > 1.0 will create a "bloom" look with additive blending
      vec3 sparkleColor = vec3(10.0, 10.0, 8.0);
      
      // Add sparkle to existing color (additive)
      vColor += sparkleColor * sparkleIntensity * flicker;
  }

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  gl_PointSize = 3.0 * (10.0 / -mvPosition.z);
  
  // Boost size for sparkles
  if (sparkleIntensity > 0.0) {
      float flicker = 0.5 + 0.5 * sin(uTime * 30.0 + pos.x * 137.0 + pos.z * 43.0);
      gl_PointSize *= (1.0 + sparkleIntensity * 6.0 * flicker);
  }
  
  vAlpha = 1.0 - smoothstep(80.0, 100.0, distFromCenter);
  
  // Keep sparkles fully opaque even at edges
  if (sparkleIntensity > 0.0) {
      vAlpha = 1.0;
  }
}
`

const fragmentShader = `
varying float vAlpha;
varying vec3 vColor;

void main() {
  float r = distance(gl_PointCoord, vec2(0.5));
  if (r > 0.5) discard;
  float glow = 1.0 - smoothstep(0.3, 0.5, r);
  gl_FragColor = vec4(vColor, vAlpha * glow);
}
`

export default function ParticleLandscape({ targetColor, rippleColor, rippleStrength }) {
    const mesh = useRef()
    const { camera, raycaster } = useThree()

    // Grid settings
    // Expanded grid (approx 4x area, 2x linear)
    const rows = 800
    const cols = 800
    const count = rows * cols
    const spacing = 0.25

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uRipples: { value: Array.from({ length: 20 }, () => new THREE.Vector4(0, 0, 0, 0)) },
            uColorA: { value: new THREE.Color('#ffffff') },
            uColorB: { value: new THREE.Color('#ffffff') },
            uColorTime: { value: 1000.0 }, // Finished
            uRippleColor: { value: new THREE.Color('#00ffff') }
        }),
        []
    )

    // Handle ripple color change
    useEffect(() => {
        if (mesh.current) {
            console.log("Setting ripple color:", rippleColor)
            mesh.current.material.uniforms.uRippleColor.value.set(rippleColor)
        }
    }, [rippleColor])

    // Handle color change
    useEffect(() => {
        if (mesh.current) {
            // Set A to current B (or current visual state if we wanted to be precise, but B is fine)
            // Actually, if we interrupt a transition, A should be the mix. 
            // For simplicity, let's assume fast transitions or just jump A to B.
            // Better: A = current B. B = new target.

            mesh.current.material.uniforms.uColorA.value.copy(mesh.current.material.uniforms.uColorB.value)
            mesh.current.material.uniforms.uColorB.value.set(targetColor)
            mesh.current.material.uniforms.uColorTime.value = 0.0
        }
    }, [targetColor])

    const ripples = useRef([])

    const [positions, originalPos] = useMemo(() => {
        const positions = new Float32Array(count * 3)
        const originalPos = new Float32Array(count * 3)

        let i = 0
        for (let x = 0; x < rows; x++) {
            for (let z = 0; z < cols; z++) {
                const px = (x - rows / 2) * spacing
                const pz = (z - cols / 2) * spacing

                positions[i * 3] = px
                positions[i * 3 + 1] = 0
                positions[i * 3 + 2] = pz

                originalPos[i * 3] = px
                originalPos[i * 3 + 1] = 0
                originalPos[i * 3 + 2] = pz

                i++
            }
        }
        return [positions, originalPos]
    }, [])

    useFrame((state, delta) => {
        const { clock } = state
        mesh.current.material.uniforms.uTime.value = clock.getElapsedTime()
        mesh.current.material.uniforms.uColorTime.value += delta

        // Update ripples
        // Filter out old ripples (e.g., > 40 seconds)
        ripples.current = ripples.current.filter(r => r.time < 40.0)

        // Update time for existing ripples
        ripples.current.forEach(r => {
            r.time += delta
        })

        // Update uniforms
        // We need to map our JS objects to the vec4 array
        // Let's stick to: x=x, y=time, z=z, w=strength

        const rippleUniforms = mesh.current.material.uniforms.uRipples.value
        for (let i = 0; i < 20; i++) {
            if (i < ripples.current.length) {
                const r = ripples.current[i]
                rippleUniforms[i].set(r.x, r.time, r.z, r.strength)
            } else {
                rippleUniforms[i].set(0, 0, 0, 0.0)
            }
        }
    })

    // Handle click
    useEffect(() => {
        const handleClick = (e) => {
            // Prevent ripples when clicking on UI
            if (e.target.nodeName !== 'CANVAS') return

            const x = (e.clientX / window.innerWidth) * 2 - 1
            const y = -(e.clientY / window.innerHeight) * 2 + 1
            const mouse = new THREE.Vector2(x, y)

            raycaster.setFromCamera(mouse, camera)
            const planeNormal = new THREE.Vector3(0, 1, 0)
            const planeConstant = 0
            const plane = new THREE.Plane(planeNormal, planeConstant)
            const target = new THREE.Vector3()

            const intersection = raycaster.ray.intersectPlane(plane, target)

            if (intersection) {
                console.log("Adding ripple at", intersection, "Strength:", rippleStrength)
                // Add new ripple
                if (ripples.current.length < 20) {
                    ripples.current.push({
                        x: intersection.x,
                        z: intersection.z,
                        time: 0.0,
                        strength: rippleStrength
                    })
                } else {
                    // Replace oldest if full (shift)
                    ripples.current.shift()
                    ripples.current.push({
                        x: intersection.x,
                        z: intersection.z,
                        time: 0.0,
                        strength: rippleStrength
                    })
                }
            }
        }

        window.addEventListener('click', handleClick)
        return () => window.removeEventListener('click', handleClick)
    }, [camera, raycaster, rippleStrength])

    return (
        <points ref={mesh} frustumCulled={false}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-aOriginalPos"
                    count={count}
                    array={originalPos}
                    itemSize={3}
                />
            </bufferGeometry>
            <shaderMaterial
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                vertexColors={false}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent
            />
        </points>
    )
}
