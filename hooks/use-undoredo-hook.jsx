import { useCallback, useRef, useState, useEffect } from "react";

const TRACKABLE_ACTIONS = {
    OBJECT_MODIFIED: 'object:modified',
    OBJECT_ADDED: 'object:added',
    OBJECT_REMOVED: 'object:removed',
    BACKGROUND_REMOVED: 'background:removed',
    IMAGE_CROPPED: 'image:cropped',
    CANVAS_RESIZED: 'canvas:resized',
    CANVAS_BACKGROUND_CHANGED: 'canvas:background:changed',
    FILTER_APPLIED: 'filter:applied',
    TEXT_ADDED: 'text:added',
    SHAPE_ADDED: 'shape:added',
    IMAGE_REPLACED: 'image:replaced',
    BULK_OPERATION: 'bulk:operation'
};

// Actions that should NOT trigger undo save (to avoid unnecessary states)
const IGNORED_ACTIONS = {
    SELECTION_CREATED: 'selection:created',
    SELECTION_UPDATED: 'selection:updated',
    SELECTION_CLEARED: 'selection:cleared',
    MOUSE_MOVE: 'mouse:move',
    MOUSE_OVER: 'mouse:over',
    MOUSE_OUT: 'mouse:out',
    OBJECT_MOVING: 'object:moving',
    OBJECT_SCALING: 'object:scaling',
    OBJECT_ROTATING: 'object:rotating'
};

export const useCanvasUndoRedo = (canvasEditor) => {

    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const [isUndoRedoOperation, setIsUndoRedoOperation] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const undoStackRef = useRef(undoStack);
    useEffect(() => {
        undoStackRef.current = undoStack;
    }, [undoStack]);

    // Refs to track state and prevent race conditions
    const lastSavedState = useRef(null);
    const saveTimeoutRef = useRef(null);
    const initTimeoutRef = useRef(null);
    const operationInProgress = useRef(false);

    // Maximum undo stack size (configurable)
    const MAX_UNDO_STACK_SIZE = 50;
    const DEBOUNCE_DELAY = 1000; // 1 second debounce

    // Generate a hash of canvas state for comparison
    const generateStateHash = useCallback((canvasState) => {
        return JSON.stringify(canvasState).length + '_' +
            JSON.stringify(canvasState).slice(0, 100);
    }, []);


    // Get clean canvas state (excluding temporary properties)
    const getCleanCanvasState = useCallback(() => {
        if (!canvasEditor) return null;

        try {
            const state = canvasEditor.toJSON([
                'id', 'selectable', 'evented', 'left', 'top', 'scaleX', 'scaleY',
                'angle', 'flipX', 'flipY', 'opacity', 'width', 'height', 'fill',
                'stroke', 'strokeWidth', 'src', 'filters', 'clipPath', 'text',
                'fontFamily', 'fontSize', 'fontWeight', 'textAlign', 'lineHeight'
            ]);

            // Add canvas-level properties
            state.canvasWidth = canvasEditor.getWidth();
            state.canvasHeight = canvasEditor.getHeight();
            state.backgroundColor = canvasEditor.backgroundColor;
            state.backgroundImage = canvasEditor.backgroundImage;

            return state;
        } catch (error) {
            console.error('Error getting canvas state:', error);
            return null;
        }
    }, [canvasEditor]);



    // Save state to undo stack with deduplication
    const saveToUndoStack = useCallback((actionType = 'unknown', metadata = {}) => {

        if (!canvasEditor || isUndoRedoOperation || operationInProgress.current) {
            return;
        }

        console.log("called");

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            try {
                const currentState = getCleanCanvasState();
                if (!currentState) return;

                const currentHash = generateStateHash(currentState);

                // Don't save if state hasn't changed
                if (lastSavedState.current === currentHash) {
                    return;
                }

                const stateWithMetadata = {
                    state: currentState,
                    timestamp: Date.now(),
                    actionType,
                    metadata,
                    hash: currentHash
                };

                setUndoStack(prev => {
                    const newStack = [...prev, stateWithMetadata];

                    // Limit stack size
                    if (newStack.length > MAX_UNDO_STACK_SIZE) {
                        newStack.shift();
                    }

                    return newStack;
                });

                // Clear redo stack when new action is performed
                setRedoStack([]);
                lastSavedState.current = currentHash;

                console.log(`Saved undo state: ${actionType}`, metadata);

            } catch (error) {
                console.error('Error saving undo state:', error);
            }
        }, DEBOUNCE_DELAY);
    }, [canvasEditor, isUndoRedoOperation, getCleanCanvasState, generateStateHash]);



    // Manual save function for specific operations
    const saveUndoState = useCallback((actionType, metadata = {}) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveToUndoStack(actionType, metadata);
    }, [saveToUndoStack]);

    // Initialize undo system
    // useEffect(() => {
    //     if (!canvasEditor || isInitialized) return;

    //     // Clear any existing timeout
    //     if (initTimeoutRef.current) {
    //         clearTimeout(initTimeoutRef.current);
    //     }

    //     initTimeoutRef.current = setTimeout(() => {
    //         try {
    //             const initialState = getCleanCanvasState();
    //             if (initialState) {
    //                 const initialStateWithMetadata = {
    //                     state: initialState,
    //                     timestamp: Date.now(),
    //                     actionType: 'initial_state',
    //                     metadata: { isInitial: true },
    //                     hash: generateStateHash(initialState)
    //                 };

    //                 setUndoStack([initialStateWithMetadata]);
    //                 lastSavedState.current = initialStateWithMetadata.hash;
    //                 setIsInitialized(true);

    //                 console.log('Undo system initialized');
    //             }
    //         } catch (error) {
    //             console.error('Error initializing undo system:', error);
    //         }
    //     }, 500);

    //     return () => {
    //         if (initTimeoutRef.current) {
    //             clearTimeout(initTimeoutRef.current);
    //         }
    //     };
    // }, [canvasEditor, isInitialized, getCleanCanvasState, generateStateHash]);


    // Setup canvas event listeners
    useEffect(() => {
        if (!canvasEditor || !isInitialized) return;

        const handleObjectModified = (e) => {
            const obj = e.target;
            saveToUndoStack(TRACKABLE_ACTIONS.OBJECT_MODIFIED, {
                objectType: obj?.type,
                objectId: obj?.id
            });
        };

        const handleObjectAdded = (e) => {
            const obj = e.target;
            saveToUndoStack(TRACKABLE_ACTIONS.OBJECT_ADDED, {
                objectType: obj?.type,
                objectId: obj?.id
            });
        };

        const handleObjectRemoved = (e) => {
            const obj = e.target;
            saveToUndoStack(TRACKABLE_ACTIONS.OBJECT_REMOVED, {
                objectType: obj?.type,
                objectId: obj?.id
            });
        };

        const handlePathCreated = (e) => {
            saveToUndoStack(TRACKABLE_ACTIONS.OBJECT_ADDED, {
                objectType: 'path',
                isDrawing: true
            });
        };

        // Add event listeners
        canvasEditor.on('object:modified', handleObjectModified);
        canvasEditor.on('object:added', handleObjectAdded);
        canvasEditor.on('object:removed', handleObjectRemoved);
        canvasEditor.on('path:created', handlePathCreated);

        return () => {
            canvasEditor.off('object:modified', handleObjectModified);
            canvasEditor.off('object:added', handleObjectAdded);
            canvasEditor.off('object:removed', handleObjectRemoved);
            canvasEditor.off('path:created', handlePathCreated);
        };
    }, [canvasEditor, isInitialized, saveToUndoStack]);

    useEffect(() => {
        console.log("UNDO STACK UPDATED:", {
            length: undoStack.length,
            items: undoStack
        });
    }, [undoStack]);

    // Undo function
    const handleUndo = async () => {
        console.group('Undo Operation Debug');
        const currentUndoStack = undoStackRef.current; // Get current reference
        console.log("undoStack ++>", undoStack)

        console.log("currentUndoStack : ", currentUndoStack);

        // Debug conditions
        if (!canvasEditor) {
            console.log('❌ Undo blocked: No canvas editor instance');
            console.groupEnd();
            return false;
        }

        if (operationInProgress.current) {
            console.log('❌ Undo blocked: Operation already in progress');
            console.groupEnd();
            return false;
        }

        console.log('✅ Basic conditions met - checking undo stack...', {
            undoStackLength: currentUndoStack.length,
            lastAction: currentUndoStack[currentUndoStack.length - 1]?.actionType
        });

        if (currentUndoStack.length <= 1) {
            console.log('❌ Undo blocked: Not enough undo states', {
                undoStackLength: currentUndoStack.length,
                undoStackContents: currentUndoStack
            });
            console.groupEnd();
            return false;
        }

        operationInProgress.current = true;
        setIsUndoRedoOperation(true);
        console.log('🔒 Lock set: operationInProgress.current = true');

        try {
            // Save current state to redo stack
            console.log('🔄 Getting current canvas state...');
            const currentState = getCleanCanvasState();

            if (currentState) {
                console.log('💾 Saving current state to redo stack:', {
                    stateSummary: `${currentState.objects?.length || 0} objects`,
                    canvasSize: `${currentState.canvasWidth}x${currentState.canvasHeight}`
                });

                const currentStateWithMetadata = {
                    state: currentState,
                    timestamp: Date.now(),
                    actionType: 'redo_point',
                    metadata: {},
                    hash: generateStateHash(currentState)
                };

                setRedoStack(prev => {
                    console.log('📥 Redo stack before update:', {
                        redoStackSize: prev.length,
                        lastRedoAction: prev[prev.length - 1]?.actionType
                    });
                    return [...prev, currentStateWithMetadata];
                });
            } else {
                console.warn('⚠️ Could not get current canvas state');
            }

            // Get previous state
            const newUndoStack = [...undoStack];
            console.log('📊 Current undo stack:', {
                size: newUndoStack.length,
                items: newUndoStack.map(item => ({
                    action: item.actionType,
                    time: new Date(item.timestamp).toLocaleTimeString(),
                    hash: item.hash?.slice(0, 10) + '...'
                }))
            });

            const removedState = newUndoStack.pop();
            console.log('🗑️ Removed from undo stack:', {
                action: removedState.actionType,
                hash: removedState.hash?.slice(0, 10) + '...'
            });

            const previousStateData = newUndoStack[newUndoStack.length - 1];
            console.log('⏮️ Previous state to restore:', {
                action: previousStateData?.actionType,
                time: new Date(previousStateData?.timestamp).toLocaleTimeString(),
                hash: previousStateData?.hash?.slice(0, 10) + '...',
                stateSummary: previousStateData?.state ? `${previousStateData.state.objects?.length || 0} objects` : 'No state'
            });

            if (previousStateData?.state) {
                console.log('🖌️ Loading previous state into canvas...');
                await canvasEditor.loadFromJSON(previousStateData.state);

                // Restore canvas properties
                if (previousStateData.state.canvasWidth && previousStateData.state.canvasHeight) {
                    console.log('📏 Restoring canvas dimensions:', {
                        width: previousStateData.state.canvasWidth,
                        height: previousStateData.state.canvasHeight
                    });
                    canvasEditor.setDimensions({
                        width: previousStateData.state.canvasWidth,
                        height: previousStateData.state.canvasHeight
                    });
                }

                if (previousStateData.state.backgroundColor) {
                    console.log('🎨 Restoring background color:', previousStateData.state.backgroundColor);
                    canvasEditor.setBackgroundColor(previousStateData.state.backgroundColor);
                }

                console.log('🔄 Requesting render...');
                canvasEditor.requestRenderAll();

                setUndoStack(newUndoStack);
                lastSavedState.current = previousStateData.hash;

                console.log('✅ Successfully undid action:', previousStateData.actionType);
                console.groupEnd();
                return true;
            } else {
                console.error('🚨 No valid previous state found');
                console.groupEnd();
                return false;
            }
        } catch (error) {
            console.error('💥 Error during undo:', error);
            console.groupEnd();
            return false;
        } finally {
            setTimeout(() => {
                setIsUndoRedoOperation(false);
                operationInProgress.current = false;
                console.log('🔓 Lock released: operationInProgress.current = false');
            }, 100);
        }
    }




    // Redo function
    const handleRedo = useCallback(async () => {
        if (!canvasEditor || redoStack.length === 0 || operationInProgress.current) {
            return false;
        }

        operationInProgress.current = true;
        setIsUndoRedoOperation(true);

        try {
            // Get next state from redo stack
            const newRedoStack = [...redoStack];
            const nextStateData = newRedoStack.pop();

            if (nextStateData?.state) {
                // Save current state to undo stack
                const currentState = getCleanCanvasState();
                if (currentState) {
                    const currentStateWithMetadata = {
                        state: currentState,
                        timestamp: Date.now(),
                        actionType: 'undo_point',
                        metadata: {},
                        hash: generateStateHash(currentState)
                    };

                    setUndoStack(prev => [...prev, currentStateWithMetadata]);
                }

                // Apply redo state
                await canvasEditor.loadFromJSON(nextStateData.state);

                // Restore canvas properties
                if (nextStateData.state.canvasWidth && nextStateData.state.canvasHeight) {
                    canvasEditor.setDimensions({
                        width: nextStateData.state.canvasWidth,
                        height: nextStateData.state.canvasHeight
                    });
                }

                if (nextStateData.state.backgroundColor) {
                    canvasEditor.setBackgroundColor(nextStateData.state.backgroundColor);
                }

                canvasEditor.requestRenderAll();
                setRedoStack(newRedoStack);
                lastSavedState.current = nextStateData.hash;

                console.log(`Redid action: ${nextStateData.actionType}`);
                return true;
            }
        } catch (error) {
            console.error('Error during redo:', error);
            return false;
        } finally {
            setTimeout(() => {
                setIsUndoRedoOperation(false);
                operationInProgress.current = false;
            }, 100);
        }

        return false;
    }, [canvasEditor, redoStack, getCleanCanvasState, generateStateHash]);





    // Clear history
    const clearHistory = useCallback(() => {
        setUndoStack([]);
        setRedoStack([]);
        lastSavedState.current = null;
        setIsInitialized(false);
    }, []);

    // Get history info for UI
    const getHistoryInfo = useCallback(() => {
        return {
            canUndo: undoStack.length > 1,
            canRedo: redoStack.length > 0,
            undoCount: Math.max(0, undoStack.length - 1),
            redoCount: redoStack.length,
            lastAction: undoStack.length > 0 ? undoStack[undoStack.length - 1]?.actionType : null
        };
    }, [undoStack, redoStack]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            if (initTimeoutRef.current) {
                clearTimeout(initTimeoutRef.current);
            }
        };
    }, []);
    console.log("UNDO STAKE : ", undoStack);

    return {
        setUndoStack,
        handleUndo,
        handleRedo,
        saveUndoState, // For manual state saving
        clearHistory,
        getHistoryInfo,
        isUndoRedoOperation,
        TRACKABLE_ACTIONS // Export for use in other components
    };

}