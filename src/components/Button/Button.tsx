import * as React from 'react'

interface ButtonProps {
    children: React.ReactNode,
    type?: string,
    onClick: () => any
}

function Button ({ type, onClick, children }: ButtonProps) {
  const _class = 'btn-primary'
  return (
    <button className={_class} onClick={onClick}>{children}</button>
  )
}

export default Button
