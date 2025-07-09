
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, RotateCcw, Move, ZoomIn, ZoomOut } from "lucide-react";

interface ImageElement {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  zIndex: number;
}

interface MultiImageStoryEditorProps {
  images: File[];
  onImagesChange: (elements: ImageElement[]) => void;
  canvasWidth: number;
  canvasHeight: number;
}

const MultiImageStoryEditor = ({ 
  images, 
  onImagesChange, 
  canvasWidth = 400, 
  canvasHeight = 600 
}: MultiImageStoryEditorProps) => {
  const [imageElements, setImageElements] = useState<ImageElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialTouch, setInitialTouch] = useState<{ x: number; y: number; distance: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize image elements when images change
  useEffect(() => {
    const loadImages = async () => {
      const elements: ImageElement[] = [];
      
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const src = URL.createObjectURL(file);
        
        // Create image to get dimensions
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = src;
        });
        
        const aspectRatio = img.width / img.height;
        const maxSize = Math.min(canvasWidth, canvasHeight) * 0.6;
        let width = maxSize;
        let height = maxSize;
        
        if (aspectRatio > 1) {
          height = maxSize / aspectRatio;
        } else {
          width = maxSize * aspectRatio;
        }
        
        elements.push({
          id: `image-${i}`,
          src,
          x: canvasWidth / 2 + (i * 20),
          y: canvasHeight / 2 + (i * 20),
          width,
          height,
          rotation: 0,
          scale: 1,
          zIndex: i
        });
      }
      
      setImageElements(elements);
      onImagesChange(elements);
    };
    
    if (images.length > 0) {
      loadImages();
    }
  }, [images, canvasWidth, canvasHeight, onImagesChange]);

  const getDistance = (touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getMidpoint = (touch1: Touch, touch2: Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    setSelectedElement(elementId);
    setIsDragging(true);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent, elementId: string) => {
    e.preventDefault();
    setSelectedElement(elementId);
    
    if (e.touches.length === 1) {
      setIsDragging(true);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setDragStart({
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top
        });
      }
    } else if (e.touches.length === 2) {
      setIsResizing(true);
      const distance = getDistance(e.touches[0], e.touches[1]);
      const midpoint = getMidpoint(e.touches[0], e.touches[1]);
      const rect = containerRef.current?.getBoundingClientRect();
      
      if (rect) {
        setInitialTouch({
          x: midpoint.x - rect.left,
          y: midpoint.y - rect.top,
          distance
        });
      }
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedElement) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    const deltaX = currentX - dragStart.x;
    const deltaY = currentY - dragStart.y;
    
    setImageElements(prev => prev.map(element => 
      element.id === selectedElement 
        ? { ...element, x: element.x + deltaX, y: element.y + deltaY }
        : element
    ));
    
    setDragStart({ x: currentX, y: currentY });
  }, [isDragging, selectedElement, dragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (!selectedElement) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    if (e.touches.length === 1 && isDragging) {
      const currentX = e.touches[0].clientX - rect.left;
      const currentY = e.touches[0].clientY - rect.top;
      const deltaX = currentX - dragStart.x;
      const deltaY = currentY - dragStart.y;
      
      setImageElements(prev => prev.map(element => 
        element.id === selectedElement 
          ? { ...element, x: element.x + deltaX, y: element.y + deltaY }
          : element
      ));
      
      setDragStart({ x: currentX, y: currentY });
    } else if (e.touches.length === 2 && isResizing && initialTouch) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scaleChange = currentDistance / initialTouch.distance;
      
      setImageElements(prev => prev.map(element => 
        element.id === selectedElement 
          ? { ...element, scale: Math.max(0.1, Math.min(3, element.scale * scaleChange)) }
          : element
      ));
      
      setInitialTouch({
        ...initialTouch,
        distance: currentDistance
      });
    }
  }, [isDragging, isResizing, selectedElement, dragStart, initialTouch]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setInitialTouch(null);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setInitialTouch(null);
  }, []);

  const removeImage = useCallback((elementId: string) => {
    const updatedElements = imageElements.filter(el => el.id !== elementId);
    setImageElements(updatedElements);
    onImagesChange(updatedElements);
    if (selectedElement === elementId) {
      setSelectedElement(null);
    }
  }, [imageElements, selectedElement, onImagesChange]);

  const bringToFront = useCallback((elementId: string) => {
    const maxZ = Math.max(...imageElements.map(el => el.zIndex));
    setImageElements(prev => prev.map(element => 
      element.id === elementId 
        ? { ...element, zIndex: maxZ + 1 }
        : element
    ));
  }, [imageElements]);

  const resetTransform = useCallback((elementId: string) => {
    setImageElements(prev => prev.map(element => 
      element.id === elementId 
        ? { ...element, scale: 1, rotation: 0 }
        : element
    ));
  }, []);

  useEffect(() => {
    onImagesChange(imageElements);
  }, [imageElements, onImagesChange]);

  return (
    <div className="relative">
      <div 
        ref={containerRef}
        className="relative bg-black rounded-lg overflow-hidden select-none"
        style={{ width: canvasWidth, height: canvasHeight }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {imageElements
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((element) => (
            <div
              key={element.id}
              className={`absolute cursor-move ${selectedElement === element.id ? 'ring-2 ring-blue-500' : ''}`}
              style={{
                left: element.x - (element.width * element.scale) / 2,
                top: element.y - (element.height * element.scale) / 2,
                width: element.width * element.scale,
                height: element.height * element.scale,
                transform: `rotate(${element.rotation}deg)`,
                zIndex: element.zIndex,
                touchAction: 'none'
              }}
              onMouseDown={(e) => handleMouseDown(e, element.id)}
              onTouchStart={(e) => handleTouchStart(e, element.id)}
              onClick={() => {
                setSelectedElement(element.id);
                bringToFront(element.id);
              }}
            >
              <img
                src={element.src}
                alt="Story element"
                className="w-full h-full object-cover rounded-lg pointer-events-none"
                draggable={false}
              />
              
              {selectedElement === element.id && (
                <>
                  {/* Corner resize handles */}
                  <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full cursor-nw-resize" />
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full cursor-ne-resize" />
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 rounded-full cursor-sw-resize" />
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize" />
                  
                  {/* Action buttons */}
                  <div className="absolute -top-8 left-0 flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(element.id);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        resetTransform(element.id);
                      }}
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
      </div>
      
      {/* Instructions */}
      <div className="mt-4 text-sm text-gray-600 space-y-1">
        <p>• Tap to select an image</p>
        <p>• Drag to move</p>
        <p>• Pinch with two fingers to resize</p>
        <p>• Use corner handles for precise resizing</p>
      </div>
    </div>
  );
};

export default MultiImageStoryEditor;
