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
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialTouch, setInitialTouch] = useState<{ x: number; y: number; distance: number } | null>(null);
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const [lastTouchTime, setLastTouchTime] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect if device is mobile
  const isMobile = window.innerWidth < 768;
  const touchTargetSize = isMobile ? 'w-8 h-8' : 'w-6 h-6';
  const buttonSize = isMobile ? 'h-10 w-10' : 'h-8 w-8';

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
        const maxSize = Math.min(canvasWidth, canvasHeight) * 0.5; // Smaller for mobile
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
          x: canvasWidth / 2 + (i * 15), // Smaller offset for mobile
          y: canvasHeight / 2 + (i * 15),
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

  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getMidpoint = (touch1: React.Touch, touch2: React.Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  };

  const getRelativePosition = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedElement(elementId);
    setIsDragging(true);
    
    const pos = getRelativePosition(e.clientX, e.clientY);
    setDragStart(pos);
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent, elementId: string, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedElement(elementId);
    setIsResizing(true);
    setResizeHandle(handle);
    
    const element = imageElements.find(el => el.id === elementId);
    if (element) {
      setInitialSize({ width: element.width, height: element.height });
    }
    
    const pos = getRelativePosition(e.clientX, e.clientY);
    setDragStart(pos);
  }, [imageElements]);

  const handleTouchStart = useCallback((e: React.TouchEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const currentTime = Date.now();
    const timeDiff = currentTime - lastTouchTime;
    setLastTouchTime(currentTime);
    
    // Handle double tap for selection
    if (timeDiff < 300) {
      setSelectedElement(elementId);
      bringToFront(elementId);
      return;
    }
    
    setSelectedElement(elementId);
    
    if (e.touches.length === 1) {
      setIsDragging(true);
      const pos = getRelativePosition(e.touches[0].clientX, e.touches[0].clientY);
      setDragStart(pos);
    } else if (e.touches.length === 2) {
      setIsResizing(true);
      setResizeHandle('corner');
      const distance = getDistance(e.touches[0], e.touches[1]);
      const midpoint = getMidpoint(e.touches[0], e.touches[1]);
      const pos = getRelativePosition(midpoint.x, midpoint.y);
      
      const element = imageElements.find(el => el.id === elementId);
      if (element) {
        setInitialSize({ width: element.width, height: element.height });
      }
      
      setInitialTouch({
        x: pos.x,
        y: pos.y,
        distance
      });
    }
  }, [imageElements, lastTouchTime]);

  const handleMove = useCallback((currentX: number, currentY: number) => {
    if (!selectedElement) return;
    
    if (isDragging && !isResizing) {
      const deltaX = currentX - dragStart.x;
      const deltaY = currentY - dragStart.y;
      
      setImageElements(prev => prev.map(element => 
        element.id === selectedElement 
          ? { ...element, x: element.x + deltaX, y: element.y + deltaY }
          : element
      ));
      
      setDragStart({ x: currentX, y: currentY });
    } else if (isResizing && resizeHandle) {
      const deltaX = currentX - dragStart.x;
      const deltaY = currentY - dragStart.y;
      
      setImageElements(prev => prev.map(element => {
        if (element.id !== selectedElement) return element;
        
        let newWidth = element.width;
        let newHeight = element.height;
        const minSize = isMobile ? 40 : 30;
        const maxSize = Math.min(canvasWidth * 0.8, canvasHeight * 0.8);
        
        switch (resizeHandle) {
          case 'nw':
            newWidth = Math.max(minSize, Math.min(maxSize, initialSize.width - deltaX));
            newHeight = Math.max(minSize, Math.min(maxSize, initialSize.height - deltaY));
            break;
          case 'ne':
            newWidth = Math.max(minSize, Math.min(maxSize, initialSize.width + deltaX));
            newHeight = Math.max(minSize, Math.min(maxSize, initialSize.height - deltaY));
            break;
          case 'sw':
            newWidth = Math.max(minSize, Math.min(maxSize, initialSize.width - deltaX));
            newHeight = Math.max(minSize, Math.min(maxSize, initialSize.height + deltaY));
            break;
          case 'se':
          case 'corner':
            newWidth = Math.max(minSize, Math.min(maxSize, initialSize.width + deltaX));
            newHeight = Math.max(minSize, Math.min(maxSize, initialSize.height + deltaY));
            break;
        }
        
        return { ...element, width: newWidth, height: newHeight };
      }));
    }
  }, [isDragging, isResizing, selectedElement, dragStart, resizeHandle, initialSize, canvasWidth, canvasHeight, isMobile]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return;
    const pos = getRelativePosition(e.clientX, e.clientY);
    handleMove(pos.x, pos.y);
  }, [handleMove, isDragging, isResizing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (!selectedElement) return;
    
    if (e.touches.length === 1 && isDragging && !isResizing) {
      const pos = getRelativePosition(e.touches[0].clientX, e.touches[0].clientY);
      handleMove(pos.x, pos.y);
    } else if (e.touches.length === 2 && isResizing && initialTouch) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scaleChange = currentDistance / initialTouch.distance;
      
      setImageElements(prev => prev.map(element => 
        element.id === selectedElement 
          ? { 
              ...element, 
              width: Math.max(40, Math.min(canvasWidth * 0.8, initialSize.width * scaleChange)),
              height: Math.max(40, Math.min(canvasHeight * 0.8, initialSize.height * scaleChange))
            }
          : element
      ));
    }
  }, [isDragging, isResizing, selectedElement, initialTouch, initialSize, canvasWidth, canvasHeight, handleMove]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
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
    <div className="relative w-full">
      <div 
        ref={containerRef}
        className="relative bg-black rounded-lg overflow-hidden select-none mx-auto"
        style={{ 
          width: Math.min(canvasWidth, window.innerWidth - 32),
          height: Math.min(canvasHeight, window.innerHeight * 0.6),
          aspectRatio: `${canvasWidth}/${canvasHeight}`
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleEnd}
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
                  {/* Corner resize handles - larger for mobile */}
                  <div 
                    className={`absolute -top-4 -left-4 ${touchTargetSize} bg-blue-500 rounded-full cursor-nw-resize touch-manipulation flex items-center justify-center`}
                    onMouseDown={(e) => handleResizeStart(e, element.id, 'nw')}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedElement(element.id);
                      setIsResizing(true);
                      setResizeHandle('nw');
                      const element = imageElements.find(el => el.id === element.id);
                      if (element) {
                        setInitialSize({ width: element.width, height: element.height });
                      }
                      const pos = getRelativePosition(e.touches[0].clientX, e.touches[0].clientY);
                      setDragStart(pos);
                    }}
                  >
                    {isMobile && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div 
                    className={`absolute -top-4 -right-4 ${touchTargetSize} bg-blue-500 rounded-full cursor-ne-resize touch-manipulation flex items-center justify-center`}
                    onMouseDown={(e) => handleResizeStart(e, element.id, 'ne')}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedElement(element.id);
                      setIsResizing(true);
                      setResizeHandle('ne');
                      const element = imageElements.find(el => el.id === element.id);
                      if (element) {
                        setInitialSize({ width: element.width, height: element.height });
                      }
                      const pos = getRelativePosition(e.touches[0].clientX, e.touches[0].clientY);
                      setDragStart(pos);
                    }}
                  >
                    {isMobile && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div 
                    className={`absolute -bottom-4 -left-4 ${touchTargetSize} bg-blue-500 rounded-full cursor-sw-resize touch-manipulation flex items-center justify-center`}
                    onMouseDown={(e) => handleResizeStart(e, element.id, 'sw')}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedElement(element.id);
                      setIsResizing(true);
                      setResizeHandle('sw');
                      const element = imageElements.find(el => el.id === element.id);
                      if (element) {
                        setInitialSize({ width: element.width, height: element.height });
                      }
                      const pos = getRelativePosition(e.touches[0].clientX, e.touches[0].clientY);
                      setDragStart(pos);
                    }}
                  >
                    {isMobile && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div 
                    className={`absolute -bottom-4 -right-4 ${touchTargetSize} bg-blue-500 rounded-full cursor-se-resize touch-manipulation flex items-center justify-center`}
                    onMouseDown={(e) => handleResizeStart(e, element.id, 'se')}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedElement(element.id);
                      setIsResizing(true);
                      setResizeHandle('se');
                      const element = imageElements.find(el => el.id === element.id);
                      if (element) {
                        setInitialSize({ width: element.width, height: element.height });
                      }
                      const pos = getRelativePosition(e.touches[0].clientX, e.touches[0].clientY);
                      setDragStart(pos);
                    }}
                  >
                    {isMobile && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  
                  {/* Action buttons - larger for mobile */}
                  <div className={`absolute ${isMobile ? '-top-16' : '-top-12'} left-0 flex gap-2`}>
                    <Button
                      size="sm"
                      variant="secondary"
                      className={`${buttonSize} p-0 touch-manipulation`}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(element.id);
                      }}
                    >
                      <X className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className={`${buttonSize} p-0 touch-manipulation`}
                      onClick={(e) => {
                        e.stopPropagation();
                        resetTransform(element.id);
                      }}
                    >
                      <RotateCcw className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
      </div>
      
      {/* Instructions - mobile optimized */}
      <div className={`mt-4 text-sm text-gray-600 space-y-1 ${isMobile ? 'px-2' : ''}`}>
        <p>• {isMobile ? 'Double tap' : 'Click'} to select an image</p>
        <p>• {isMobile ? 'Touch and drag' : 'Drag'} to move around</p>
        <p>• {isMobile ? 'Touch corner handles' : 'Use corner handles'} to resize</p>
        <p>• {isMobile ? 'Pinch with two fingers to scale' : 'Use handles to resize precisely'}</p>
        {isMobile && <p>• Touch action buttons to remove or reset</p>}
      </div>
    </div>
  );
};

export default MultiImageStoryEditor;
