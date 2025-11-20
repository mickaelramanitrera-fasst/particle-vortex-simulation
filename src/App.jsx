import React, { useState } from 'react'
import Scene from './components/Scene'
import UI from './components/UI'

function App() {
  const [color, setColor] = useState('#ffffff')
  const [rippleColor, setRippleColor] = useState('#00ffff') // Default to cyan for visibility
  const [rippleStrength, setRippleStrength] = useState(5.0)

  return (
    <>
      <UI
        color={color}
        onColorChange={setColor}
        rippleColor={rippleColor}
        onRippleColorChange={setRippleColor}
        rippleStrength={rippleStrength}
        onRippleStrengthChange={setRippleStrength}
      />
      <Scene color={color} rippleColor={rippleColor} rippleStrength={rippleStrength} />
    </>
  )
}

export default App
