import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import ParticleLandscape from './ParticleLandscape'

export default function Scene({ color, rippleColor, rippleStrength }) {
    return (
        <Canvas camera={{ position: [0, 20, 40], fov: 50 }}>
            <color attach="background" args={['#000000']} />
            <ParticleLandscape targetColor={color} rippleColor={rippleColor} rippleStrength={rippleStrength} />
            <OrbitControls makeDefault />
        </Canvas>
    )
}
