'use client'
import { useCanvas } from "@/context/context";
import { api } from "@/convex/_generated/api";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { Canvas, FabricImage } from "fabric";
import React, { useEffect, useRef, useState } from "react";

function CanvasEditor({ project }) {
  const canvasRef = useRef();
  const containerRef = useRef();
  const { canvasEditor, setCanvasEditor, activeTool, onToolChange } =
    useCanvas();
  const [isLoading, setIsLoading] = useState(true);

  const { mutate: updateProject } = useConvexMutation(
    api.projects.updateProject
  );

  const calculateViewportScale = () => {
    if (!containerRef.current || !project) return 1;
    const container = containerRef.current;
    const containerWidth = container.clientWidth - 40;
    const containerHeight = container.clientHeight - 40;
    const scaleX = containerWidth / project.width;
    const scaleY = containerHeight / project.height;
    return Math.min(scaleX, scaleY, 1);
  };

  useEffect(() => {
    if (!canvasRef.current || !project || canvasEditor) return;

    const initializeCanvas = async () => {
      setIsLoading(true);
      const viewportScale = calculateViewportScale();

      const canvas = new Canvas(canvasRef.current, {
        width: project.width,
        height: project.height,
        backgroundColor: "#ffffff",
        preserveObjectStacking: true,
        controlsAboveOverlay: true,
        selection: true,
        hoverCursor: "move",
        moveCursor: "move",
        defaultCursor: "default",
        allowTouchScrolling: false,
        renderOnAddRemove: true,
        skipTargetFind: false,
        // ADD THESE CRITICAL PROPERTIES:
        enableRetinaScaling: false,
        devicePixelRatio: 1,
        // IMPORTANT: These prevent filter clipping
        imageSmoothingEnabled: false,
        // Force larger filter canvas
        filterBackend: 'webgl' // or 'canvas2d' if webgl causes issues
      });      

      // Set visible canvas size
      canvas.setDimensions(
        {
          width: project.width * viewportScale,
          height: project.height * viewportScale,
        },
        { backstoreOnly: false }
      );

      // Set canvas zoom
      canvas.setZoom(viewportScale);

      // High DPI fix
      const scaleFactor = window.devicePixelRatio || 1;
      if (scaleFactor > 1) {
        canvas.getElement().width = project.width * scaleFactor;
        canvas.getElement().height = project.height * scaleFactor;
        canvas.getContext().scale(scaleFactor, scaleFactor);
      }

      // Wait for canvas layout to settle
      await new Promise((resolve) => setTimeout(resolve, 30));

      // ===== FIXED IMAGE LOADING AND SCALING =====
      if (project.currentImageUrl || project.originalImageUrl) {
        try {
          const imageUrl = project.currentImageUrl || project.originalImageUrl;
          const fabricImage = await FabricImage.fromURL(imageUrl, {
            crossOrigin: "anonymous",
          });

          // DEBUG: Log dimensions
          // console.log('Canvas dimensions:', {
          //   width: canvas.getWidth(),
          //   height: canvas.getHeight(),
          //   zoom: canvas.getZoom(),
          //   viewportScale: viewportScale
          // });
          // console.log('Image dimensions:', {
          //   width: fabricImage.width,
          //   height: fabricImage.height
          // });

          // Use ACTUAL canvas dimensions (not scaled dimensions)
          const canvasWidth = project.width;  // Use original project dimensions
          const canvasHeight = project.height;
          const imageWidth = fabricImage.width;
          const imageHeight = fabricImage.height;

          // Calculate scale to fit image within canvas bounds
          const scaleX = canvasWidth / imageWidth;
          const scaleY = canvasHeight / imageHeight;
          const scale = Math.min(scaleX, scaleY);

          console.log('Calculated scale:', scale, 'scaleX:', scaleX, 'scaleY:', scaleY);

          // Set image properties
          fabricImage.set({
            originX: "center",
            originY: "center",
            scaleX: scale,
            scaleY: scale,
            left: canvasWidth / 2,
            top: canvasHeight / 2,
            selectable: true,
            evented: true,
            objectCaching: false,
          });

          // Clear canvas first
          canvas.clear();

          // Add image to canvas
          canvas.add(fabricImage);

          // Update object coordinates
          fabricImage.setCoords();
          canvas.backgroundColor = "#ffffff"
          // Force render
          canvas.requestRenderAll();

          console.log('Image positioned at:', {
            left: fabricImage.left,
            top: fabricImage.top,
            scaleX: fabricImage.scaleX,
            scaleY: fabricImage.scaleY
          });

        } catch (error) {
          console.error("Error loading project image:", error);
        }
      }

      // Restore canvas state if available (do this AFTER image loading)
      if (project.canvasState) {
        try {
          await canvas.loadFromJSON(project.canvasState);
          canvas.requestRenderAll();
        } catch (error) {
          console.error("Error loading canvas state:", error);
        }
      }

      // Final setup
      canvas.calcOffset();
      canvas.requestRenderAll();
      setCanvasEditor(canvas);

      // Fix initial resize bugs
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 500);

      setIsLoading(false);
    };

    initializeCanvas();

    return () => {
      if (canvasEditor) {
        canvasEditor.dispose();
        setCanvasEditor(null);
      }
    };
  }, [project]);


  const saveCanvasState = async () => {
    if (!canvasEditor || !project) return;

    try {
      const canvasJSON = canvasEditor.toJSON();
      await updateProject({
        projectId: project._id,
        canvasState: canvasJSON,
      });
    } catch (error) {
      console.error("Error saving canvas state:", error);
    }
  };

  useEffect(() => {
    if (!canvasEditor) return;
    let saveTimeout;

    const handleCanvasChange = () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        saveCanvasState();
      }, 2000);
    };

    canvasEditor.on("object:modified", handleCanvasChange);
    canvasEditor.on("object:added", handleCanvasChange);
    canvasEditor.on("object:removed", handleCanvasChange);

    return () => {
      clearTimeout(saveTimeout);
      canvasEditor.off("object:modified", handleCanvasChange);
      canvasEditor.off("object:added", handleCanvasChange);
      canvasEditor.off("object:removed", handleCanvasChange);
    };
  }, [canvasEditor]);

  useEffect(() => {
    if (!canvasEditor) return;

    switch (activeTool) {
      case "crop":
        canvasEditor.defaultCursor = "crosshair";
        canvasEditor.hoverCursor = "crosshair";
        break;
      default:
        canvasEditor.defaultCursor = "default";
        canvasEditor.hoverCursor = "move";
    }
  }, [canvasEditor, activeTool]);

  useEffect(() => {
    const handleResize = () => {
      if (!canvasEditor || !project) return;

      const newScale = calculateViewportScale();
      canvasEditor.setDimensions(
        {
          width: project.width * newScale,
          height: project.height * newScale,
        },
        { backstoreOnly: false }
      );
      canvasEditor.setZoom(newScale);
      canvasEditor.calcOffset();
      canvasEditor.requestRenderAll();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [canvasEditor, project]);

  // Handle automatic tab switching when text is selected
  useEffect(() => {
    if (!canvasEditor || !onToolChange) return;

    const handleSelection = (e) => {
      const selectedObject = e.selected?.[0];
      if (selectedObject && selectedObject.type === "i-text") {
        onToolChange("text");
      }
    };

    canvasEditor.on("selection:created", handleSelection);
    canvasEditor.on("selection:updated", handleSelection);

    return () => {
      canvasEditor.off("selection:created", handleSelection);
      canvasEditor.off("selection:updated", handleSelection);
    };
  }, [canvasEditor, onToolChange]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center bg-secondary w-full h-full overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #64748b 25%, transparent 25%),
            linear-gradient(-45deg, #64748b 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #64748b 75%),
            linear-gradient(-45deg, transparent 75%, #64748b 75%)`,
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
        }}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            <p className="text-white/70 text-sm">Loading canvas...</p>
          </div>
        </div>
      )}

      <div className="px-5">
        <canvas id="canvas" className="border" ref={canvasRef} />
      </div>
    </div>
  );
}

export default CanvasEditor;