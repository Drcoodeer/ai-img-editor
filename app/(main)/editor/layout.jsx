'use client'
import { CanvasProvider } from '@/context/context'
import React from 'react'

const Editorlayout = ({children}) => {
  return (
     <CanvasProvider>
        {children}
     </CanvasProvider>
  )
}

export default Editorlayout