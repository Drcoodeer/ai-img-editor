// src/context/UndoRedoContext.jsx
import React, { createContext, useContext, useRef } from "react";

const UndoRedoContext = createContext(null);

export const UndoRedoProvider = ({ children }) => {
    const undoRedoRef = useRef(null);

    const setUndoRedo = (instance) => {
        undoRedoRef.current = instance;
    };

    const getUndoRedo = () => {
        if (!undoRedoRef.current) {
            throw new Error("UndoRedo not initialized. Make sure useCanvasUndoRedo is called first.");
        }
        return undoRedoRef.current;
    };

    return (
        <UndoRedoContext.Provider value={{ setUndoRedo, getUndoRedo }}>
            {children}
        </UndoRedoContext.Provider>
    );
};

export const useUndoRedo = () => {
    const context = useContext(UndoRedoContext);
    if (!context) {
        throw new Error("useUndoRedo must be used within an UndoRedoProvider");
    }
    return context.getUndoRedo();
};

export const useUndoRedoSetter = () => {
    const context = useContext(UndoRedoContext);
    if (!context) {
        throw new Error("useUndoRedoSetter must be used within an UndoRedoProvider");
    }
    return context.setUndoRedo;
};