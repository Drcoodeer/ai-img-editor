'use client'
import { CanvasProvider } from '@/context/context'
import { CanvasUndoRedoProvider } from '@/context/UndoRedoContext'
import React from 'react'

const Editorlayout = ({ children }) => {
   return (
      <CanvasProvider>
         <CanvasUndoRedoProvider>
            {children}
         </CanvasUndoRedoProvider>
      </CanvasProvider>
   )
}

export default Editorlayout