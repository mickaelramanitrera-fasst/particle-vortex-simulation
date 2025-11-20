import React from 'react'

export default function UI({ color, onColorChange, rippleColor, onRippleColorChange, rippleStrength, onRippleStrengthChange }) {
    return (
        <>
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                zIndex: 10,
                background: 'rgba(0, 0, 0, 0.5)',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                color: 'white',
                fontFamily: 'sans-serif'
            }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Particle Color</label>
                <input
                    type="color"
                    value={color}
                    onChange={(e) => onColorChange(e.target.value)}
                    style={{
                        width: '100%',
                        height: '30px',
                        border: 'none',
                        cursor: 'pointer',
                        background: 'none',
                        marginBottom: '10px'
                    }}
                />

                <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Ripple Color</label>
                <input
                    type="color"
                    value={rippleColor}
                    onChange={(e) => onRippleColorChange(e.target.value)}
                    style={{
                        width: '100%',
                        height: '30px',
                        border: 'none',
                        cursor: 'pointer',
                        background: 'none',
                        marginBottom: '10px'
                    }}
                />

                <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Ripple Strength: {rippleStrength}</label>
                <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={rippleStrength}
                    onChange={(e) => onRippleStrengthChange(parseInt(e.target.value, 10))}
                    style={{
                        width: '100%',
                        cursor: 'pointer'
                    }}
                />
            </div>

            <div style={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                color: 'rgba(255, 255, 255, 0.8)',
                fontFamily: 'sans-serif',
                fontSize: '14px',
                letterSpacing: '1px',
                pointerEvents: 'none',
                textTransform: 'uppercase',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '8px 16px',
                borderRadius: '20px',
                backdropFilter: 'blur(4px)'
            }}>
                Click or drag the particles to create ripples and wakes
            </div>
        </>
    )
}
