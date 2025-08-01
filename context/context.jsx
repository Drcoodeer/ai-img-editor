import { createContext, useContext, useState } from "react";

const defaultContext = {
    canvasEditor: null,
    setCanvasEditor: () => { },
    activeTool: null,
    onToolChange: () => { },
    processingMessage: null,
    setActiveTool: () => { },
    setProcessingMessage: () => { }
};

export const CanvasContext = createContext(defaultContext);

// Provider component
export const CanvasProvider = ({ children }) => {
    const [canvasEditor, setCanvasEditor] = useState(null);
    const [activeTool, setActiveTool] = useState('resize');
    const [processingMessage, setProcessingMessage] = useState('');    

    return (
        <CanvasContext.Provider
            value={{
                canvasEditor,
                setCanvasEditor,
                activeTool,
                onToolChange: setActiveTool,
                processingMessage,
                setProcessingMessage,
            }}
        >
            {children}
        </CanvasContext.Provider>
    );
};


export const useCanvas = () => {
    const context = useContext(CanvasContext);
    if (!context) {
        throw new Error('useCanvas must be used within a CanvasProvider');
    }
    return context;
};