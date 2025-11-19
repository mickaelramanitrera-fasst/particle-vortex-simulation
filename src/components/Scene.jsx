import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import ParticleLandscape from './ParticleLandscape'

export default function Scene({ color, rippleColor }) {
    return (
        <Canvas camera={{ position: [0, 10, 20], fov: 50 }}>
            <color attach="background" args={['#000000']} />
            <ParticleLandscape targetColor={color} rippleColor={rippleColor} />
            <OrbitControls makeDefault />
        </Canvas>
    )
}
