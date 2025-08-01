'use client'
import { Button } from '@/components/ui/button';
import { useCanvas } from '@/context/context'
import { Download, ImageIcon, Loader2, Palette, Scissors, Search, Sparkles, Trash2, Wand2 } from 'lucide-react';
import React, { useState } from 'react'
import { FabricImage } from "fabric";
import { HexColorPicker } from 'react-colorful';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = "https://api.unsplash.com";

const BackgroundControls = ({ project }) => {
  const { canvasEditor, processingMessage, setProcessingMessage } = useCanvas()
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [searchQuery, setSearchQuery] = useState('')
  const [unsplashImages, setUnsplashImages] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedImageId, setSelectedImageId] = useState(null)
  const [prompt, setPrompt] = useState("");

  // Get the main image object from canvas
  const getMainImage = () => {
    if (!canvasEditor) return null;
    const objects = canvasEditor.getObjects();
    return objects.find((obj) => obj.type === "image") || null;
  };

  // Set canvas background color
  const handleColorBackground = () => {
    if (!canvasEditor) return;

    // In Fabric.js 6.7, set property directly and render
    canvasEditor.backgroundColor = backgroundColor;
    canvasEditor.requestRenderAll();
  };


  // Search Unsplash images
  const searchUnsplashImages = async () => {
    if (!searchQuery.trim() || !UNSPLASH_ACCESS_KEY) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=12`,
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to search images");

      const data = await response.json();
      setUnsplashImages(data.results || []);
    } catch (error) {
      console.error("Error searching Unsplash:", error);
      alert("Failed to search images. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      searchUnsplashImages()
    }
  }

  // Set image as canvas background
  const handleImageBackground = async (imageUrl, imageId) => {
    if (!canvasEditor) return;

    setSelectedImageId(imageId);
    try {
      // Download and trigger Unsplash download endpoint (required by Unsplash API)
      if (UNSPLASH_ACCESS_KEY) {
        fetch(`${UNSPLASH_API_URL}/photos/${imageId}/download`, {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        }).catch(() => { }); // Silent fail for download tracking
      }

      // Create fabric image from URL
      const fabricImage = await FabricImage.fromURL(imageUrl, {
        crossOrigin: "anonymous",
      });

      // USE PROJECT DIMENSIONS instead of canvas dimensions for proper scaling
      const canvasWidth = project.width; // Logical canvas width
      const canvasHeight = project.height; // Logical canvas height

      // Calculate scales
      const scaleX = canvasWidth / fabricImage.width;
      const scaleY = canvasHeight / fabricImage.height;

      // Use Math.max to FILL the entire canvas (ensures no empty space)
      const scale = Math.max(scaleX, scaleY);

      fabricImage.set({
        scaleX: scale,
        scaleY: scale,
        originX: "center",
        originY: "center",
        left: canvasWidth / 2, // Use project dimensions
        top: canvasHeight / 2, // Use project dimensions
      });

      // Set background and render
      canvasEditor.backgroundImage = fabricImage;
      canvasEditor.requestRenderAll();
      setSelectedImageId(null);

      console.log("Background set:", {
        imageSize: `${fabricImage.width}x${fabricImage.height}`,
        canvasSize: `${canvasWidth}x${canvasHeight}`,
        scale: scale,
        finalSize: `${fabricImage.width * scale}x${fabricImage.height * scale}`,
      });
    } catch (error) {
      console.error("Error setting background image:", error);
      alert("Failed to set background image. Please try again.");
      setSelectedImageId(null);
    }
  };



  const handleBackgroundRemoval = async () => {
    const mainImage = getMainImage();
    if (!mainImage || !project) return;

    setProcessingMessage("Removing background with AI...");

    try {
      // Get the current image URL
      const currentImageUrl =
        project.currentImageUrl || project.originalImageUrl;

      // Create ImageKit transformation URL for background removal
      const bgRemovedUrl = currentImageUrl.includes("ik.imagekit.io")
        ? `${currentImageUrl.split("?")[0]}?tr=e-bgremove`
        : currentImageUrl;

      // Create new image with background removed
      const processedImage = await FabricImage.fromURL(bgRemovedUrl, {
        crossOrigin: "anonymous",
      });

      // Store the current properties before removing the old image
      const currentProps = {
        left: mainImage.left,
        top: mainImage.top,
        scaleX: mainImage.scaleX,
        scaleY: mainImage.scaleY,
        angle: mainImage.angle,
        originX: mainImage.originX,
        originY: mainImage.originY,
      };

      // Remove the old image and add the new one
      canvasEditor.remove(mainImage);
      processedImage.set(currentProps);
      canvasEditor.add(processedImage);

      // IMPORTANT: Update coordinates after replacing the image
      processedImage.setCoords();

      // Set as active object and recalculate canvas offset
      canvasEditor.setActiveObject(processedImage);
      canvasEditor.calcOffset();
      canvasEditor.requestRenderAll();

      console.log("Background removed successfully");
    } catch (error) {
      console.error("Error removing background:", error);
      alert("Failed to remove background. Please try again.");
    } finally {
      setProcessingMessage(null);
    }
  };

  // change background image by ai 
  const handleBackgroundReplacement = async (prompt) => {

    if (!prompt && !prompt.trim()) {
      alert("plese enter prompt first")
      return
    }

    const mainImage = getMainImage();
    if (!mainImage || !project) return;

    setProcessingMessage(`Changing background to: "${prompt}"...`);

    try {
      const currentImageUrl = project.currentImageUrl || project.originalImageUrl;

      // Create ImageKit transformation URL for background replacement
      const transformedUrl = currentImageUrl.includes("ik.imagekit.io")
        ? `${currentImageUrl.split("?")[0]}?tr=e-changebg-prompt-${encodeURIComponent(prompt)}`
        : currentImageUrl; // Fallback if not using ImageKit     

      // Load the new image with replaced background
      const processedImage = await FabricImage.fromURL(transformedUrl, {
        crossOrigin: "anonymous",
      });

      // Store the current properties before removing the old image
      const currentProps = {
        left: mainImage.left,
        top: mainImage.top,
        scaleX: mainImage.scaleX,
        scaleY: mainImage.scaleY,
        angle: mainImage.angle,
        originX: mainImage.originX,
        originY: mainImage.originY,
      };

      // Remove the old image and add the new one
      canvasEditor.remove(mainImage);
      processedImage.set(currentProps);
      canvasEditor.add(processedImage);

      // IMPORTANT: Update coordinates after replacing the image
      processedImage.setCoords();

      // Set as active object and recalculate canvas offset
      canvasEditor.setActiveObject(processedImage);
      canvasEditor.calcOffset();
      canvasEditor.requestRenderAll();

      console.log("Background replaced successfully");
    } catch (error) {
      console.error("Error replacing background:", error);
      alert("Failed to replace background. Please try a different prompt.");
    } finally {
      setProcessingMessage(null);
    }
  };

  if (!canvasEditor) {
    return (
      <div className="p-4">
        <p className="text-white/70 text-sm">Canvas not ready</p>
      </div>
    );
  }


  // Remove canvas background (both color and image)
  const handleRemoveBackground = () => {
    if (!canvasEditor) return;

    // Clear both background color and image
    canvasEditor.backgroundColor = null;
    canvasEditor.backgroundImage = null;
    canvasEditor.requestRenderAll();
  };




  return (
    <>
      <div className="space-y-6 relative h-full">
        {/* AI Background Removal Button - Outside of tabs */}
        <div className="space-y-6">
          {/* AI Background Removal */}
          <div className="space-y-4 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                <Scissors className="h-4 w-4 text-cyan-400" />
                AI Background Removal
              </h3>
              <p className="text-xs text-white/60 mb-4">
                Automatically remove the background from your image using AI
              </p>
            </div>

            <Button
              onClick={handleBackgroundRemoval}
              disabled={processingMessage || !getMainImage()}
              className="w-full"
              variant="gradient"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Remove Background
            </Button>

            {!getMainImage() && (
              <p className="text-xs text-amber-400/80 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Please add an image to the canvas first
              </p>
            )}
          </div>

          {/* AI Background Replacement */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                <Palette className="h-4 w-4 text-purple-400" />
                Change Background with AI
              </h3>
              <p className="text-xs text-white/60 mb-4">
                Transform the background using a text prompt
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe new background (e.g. 'sunset beach')"
                className="flex-1 bg-slate-800 border-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={processingMessage}
              />
              <Button
                onClick={() => handleBackgroundReplacement(prompt)}
                disabled={processingMessage || !prompt.trim()}
                className="shrink-0"
                variant="gradient"
                size="sm"
              >
                <Wand2 className="h-4 w-4 mr-1" />
                <span className="hidden xs:inline">Generate</span>
              </Button>
            </div>
            {!getMainImage() && (
              <p className="text-xs text-amber-400/80 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Please add an image to the canvas first
              </p>
            )}

            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => handleBackgroundReplacement("beach sunset")}
              >
                Beach
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => handleBackgroundReplacement("city skyline")}
              >
                City
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => handleBackgroundReplacement("studio lighting")}
              >
                Studio
              </Button>
            </div>
          </div>
        </div>

        {/* Shadcn UI Tabs */}
        <Tabs defaultValue="color" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
            <TabsTrigger
              value="color"
              className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white"
            >
              <Palette className="h-4 w-4 mr-2" />
              Color
            </TabsTrigger>
            <TabsTrigger
              value="image"
              className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Image
            </TabsTrigger>
          </TabsList>

          {/* Color Background Tab */}
          <TabsContent value="color" className="space-y-4 mt-6">
            <div>
              <h3 className="text-sm font-medium text-white mb-2">
                Solid Color Background
              </h3>
              <p className="text-xs text-white/70 mb-4">
                Choose a solid color for your canvas background
              </p>
            </div>

            <div className="space-y-4">
              <HexColorPicker
                color={backgroundColor}
                onChange={setBackgroundColor}
                style={{ width: "100%" }}
              />

              <div className="flex items-center gap-2">
                <Input
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1 bg-slate-700 border-white/20 text-white"
                />
                <div
                  className="w-10 h-10 rounded border border-white/20"
                  style={{ backgroundColor }}
                />
              </div>

              <Button
                onClick={handleColorBackground}
                className="w-full"
                variant="gradient"
              >
                <Palette className="h-4 w-4 mr-2" />
                Apply Color
              </Button>
            </div>
          </TabsContent>

          {/* Image Background Tab */}
          <TabsContent value="image" className="space-y-4 mt-6">
            <div>
              <h3 className="text-sm font-medium text-white mb-2">
                Image Background
              </h3>
              <p className="text-xs text-white/70 mb-4">
                Search and use high-quality images from Unsplash
              </p>
            </div>

            {/* Search Bar */}
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                placeholder="Search for backgrounds..."
                className="flex-1 bg-slate-700 border-white/20 text-white"
              />
              <Button
                onClick={searchUnsplashImages}
                disabled={isSearching || !searchQuery.trim()}
                variant="primary"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Search Results */}
            {unsplashImages?.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white">
                  Search Results ({unsplashImages?.length})
                </h4>
                <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {unsplashImages.map((image) => (
                    <div
                      key={image.id}
                      className="relative group cursor-pointer rounded-lg overflow-hidden border border-white/10 hover:border-cyan-400 transition-colors"
                      onClick={() =>
                        handleImageBackground(image.urls.regular, image.id)
                      }
                    >
                      <img
                        src={image.urls.small}
                        alt={image.alt_description || "Background image"}
                        className="w-full h-24 object-cover"
                      />

                      {/* Loading overlay */}
                      {selectedImageId === image.id && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-white" />
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Download className="h-5 w-5 text-white" />
                      </div>

                      {/* Attribution */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                        <p className="text-xs text-white/80 truncate">
                          by {image.user.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!isSearching && unsplashImages?.length === 0 && searchQuery && (
              <div className="text-center py-8">
                <ImageIcon className="h-12 w-12 text-white/30 mx-auto mb-3" />
                <p className="text-white/70 text-sm">
                  No images found for "{searchQuery}"
                </p>
                <p className="text-white/50 text-xs">
                  Try a different search term
                </p>
              </div>
            )}

            {/* Initial state */}
            {!searchQuery && unsplashImages?.length === 0 && (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-white/30 mx-auto mb-3" />
                <p className="text-white/70 text-sm">
                  Search for background images
                </p>
                <p className="text-white/50 text-xs">Powered by Unsplash</p>
              </div>
            )}

            {/* API key warning */}
            {!UNSPLASH_ACCESS_KEY && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-amber-400 text-xs">
                  Unsplash API key not configured. Please add
                  NEXT_PUBLIC_UNSPLASH_ACCESS_KEY to your environment variables.
                </p>
              </div>
            )}
          </TabsContent>

        </Tabs>
        {/* Clear Canvas Background Button - At the bottom */}
        <div className="pt-4 border-t border-white/10 bottom-0 w-full">
          <Button
            onClick={handleRemoveBackground}
            className="w-full"
            variant="outline"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Canvas Background
          </Button>
        </div>


      </div >

    </>
  )
}

export default BackgroundControls