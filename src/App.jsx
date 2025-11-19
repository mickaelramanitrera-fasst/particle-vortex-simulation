import React, { useState } from 'react'
import Scene from './components/Scene'
import UI from './components/UI'

function App() {
  const [color, setColor] = useState('#ffffff')
  const [rippleColor, setRippleColor] = useState('#00ffff') // Default to cyan for visibility

  return (
    <>
      <UI
        color={color}
        onColorChange={setColor}
        rippleColor={rippleColor}
        onRippleColorChange={setRippleColor}
      />
      <Scene color={color} rippleColor={rippleColor} />
    </>
  )
}

export default App
