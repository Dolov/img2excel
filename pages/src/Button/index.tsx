
import React from 'react'
// @ts-ignore
import ParticleEffectButton from 'react-particle-effect-button'

const option = {
  background: 'linear-gradient(120deg, #84fab0, #8fd3f4)',
  text: 'Logout',
  buttonStyles: {
    background: 'linear-gradient(to top, #22b9d2 0%, #5389ec 100%)',
    color: '#fff',
    padding: '2rem 4rem',
    borderRadius: 10
  },
  buttonOptions: {
    type: 'triangle',
    style: 'stroke',
    size: 5,
    color: 'blue',
    duration: 2000,
    speed: 1.5,
    oscillationCoefficient: 15,
    direction: 'right'
  }
}

interface ButtonProps extends React.ImgHTMLAttributes<HTMLButtonElement> {
  hidden: boolean
  onComplete?(): void
}

const Button: React.FC<ButtonProps> = props => {
  const { hidden, children, onComplete, ...otherProps } = props
  return (
    <ParticleEffectButton
      hidden={hidden}
      onComplete={onComplete}
      {...option.buttonOptions}
    >
      <button
        className="particle-effect-button"
        style={{ ...option.buttonStyles }}
        {...otherProps}
      >
        {children}
      </button>
    </ParticleEffectButton>
  )
}

export default Button

