import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { View, RotateCcw, ZoomIn, Smartphone, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeviceType } from "@shared/schema";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          "ios-src"?: string;
          alt?: string;
          ar?: boolean;
          "ar-modes"?: string;
          "ar-scale"?: string;
          "camera-controls"?: boolean;
          "touch-action"?: string;
          "auto-rotate"?: boolean;
          "shadow-intensity"?: string;
          exposure?: string;
          poster?: string;
          loading?: string;
          "reveal"?: string;
        },
        HTMLElement
      >;
    }
  }
}

interface ModelViewerARProps {
  glbPath?: string | null;
  usdzPath?: string | null;
  deviceType: DeviceType;
  title?: string;
  className?: string;
}

export function ModelViewerAR({
  glbPath,
  usdzPath,
  deviceType,
  title = "3D Model",
  className,
}: ModelViewerARProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRef = useRef<HTMLElement | null>(null);
  const fullscreenViewerRef = useRef<HTMLElement | null>(null);

  // Ensure the model-viewer reacts to src changes (useful after uploads)
  useEffect(() => {
    const v = viewerRef.current as any;
    if (!v) return;

    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        // If glbPath is falsy, clear the src
        if (!glbPath) {
          v.removeAttribute && v.removeAttribute("src");
          setIsLoading(false);
          return;
        }

        // Set src directly to ensure the element picks up the new file
        try {
          v.setAttribute("src", glbPath);
        } catch (e) {
          try {
            v.src = glbPath;
          } catch (err) {
            // ignore
          }
        }

        // Some model-viewer builds expose load()/reveal(); call them if present
        if (typeof v.load === "function") {
          await v.load();
        }

        // small delay to allow internal processing
        await new Promise((r) => setTimeout(r, 120));

        if (typeof v.reveal === "function") {
          try {
            v.reveal();
          } catch (e) {
            // ignore reveal errors
          }
        }

        if (!cancelled) setIsLoading(false);
      } catch (err) {
        console.error("Error loading model viewer src:", err);
        if (!cancelled) {
          setIsLoading(false);
          setError("Failed to load model");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [glbPath]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [glbPath]);

  const handleReset = () => {
    if (viewerRef.current) {
      (viewerRef.current as any).cameraOrbit = "0deg 75deg 105%";
      (viewerRef.current as any).fieldOfView = "auto";
    }
  };

  const handleZoom = () => {
    setIsFullscreen(true);
  };

  const handleCloseFullscreen = () => {
    setIsFullscreen(false);
  };

  const syncFullscreenViewer = () => {
    if (viewerRef.current && fullscreenViewerRef.current) {
      const source = viewerRef.current as any;
      const target = fullscreenViewerRef.current as any;
      if (source && target) {
        target.cameraOrbit = source.cameraOrbit;
        target.fieldOfView = source.fieldOfView;
      }
    }
  };

  const isIOS = () => {
    if (typeof window === "undefined") return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  };

  const canViewAR = () => {
    // If we have GLB, AR should generally be available
    if (glbPath) {
      return true;
    }
    
    // If iOS and we have USDZ, AR is available
    if (isIOS() && usdzPath) {
      return true;
    }
    
    // Fallback: if we have any path, allow AR (let model-viewer handle it)
    return Boolean(usdzPath);
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      setIsRequestingPermission(true);
      setError(null);
      
      // Check if the Permissions API is available
      if (!navigator.permissions) {
        console.warn("Permissions API not available, attempting direct camera access");
        // Try direct access for browsers that don't support Permissions API
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } 
          });
          // Stop the stream immediately, we just needed permission
          stream.getTracks().forEach(track => track.stop());
          return true;
        } catch (err) {
          setError("Camera permission denied or not available on this device.");
          return false;
        }
      }

      // Request camera permission
      const permission = await navigator.permissions.query({ name: "camera" });
      
      if (permission.state === "granted") {
        console.log("Camera permission already granted");
        return true;
      }
      
      if (permission.state === "denied") {
        setError("Camera permission denied. Please enable camera access in your browser settings to use AR mode.");
        return false;
      }
      
      // Permission state is "prompt", request it
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        // Stop the stream immediately, we just needed permission
        stream.getTracks().forEach(track => track.stop());
        console.log("Camera permission granted successfully");
        return true;
      } catch (err: any) {
        console.error("Camera permission error:", err);
        if (err.name === "NotAllowedError") {
          setError("Camera permission denied by user.");
        } else if (err.name === "NotFoundError") {
          setError("No camera device found on this device.");
        } else {
          setError("Camera permission denied or not available on this device.");
        }
        return false;
      }
    } catch (err) {
      console.error("Error requesting camera permission:", err);
      setError("Failed to request camera permission. Please try again.");
      return false;
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleViewAR = async () => {
    try {
      // Request camera permission first
      const permissionGranted = await requestCameraPermission();
      
      if (permissionGranted) {
        // Wait a brief moment for permission to be fully processed
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Check if model-viewer element is properly loaded
        if (!viewerRef.current) {
          setError("3D viewer not loaded. Please refresh and try again.");
          return;
        }
        
        // Try to find and click the native AR button
        const arButton = viewerRef.current?.shadowRoot?.querySelector(
          'button[slot="ar-button"]'
        ) as HTMLButtonElement;
        
        if (arButton) {
          console.log("Triggering AR mode with:", { glbPath, usdzPath, deviceType });
          // Add a small delay to ensure model is fully loaded
          await new Promise(resolve => setTimeout(resolve, 200));
          arButton.click();
        } else {
          // If AR button not found, try alternative approach or show helpful message
          const isIOS_Device = isIOS();
          const hasModel = glbPath || usdzPath;
          
          if (!hasModel) {
            setError("No 3D model loaded. Please upload a model first.");
          } else if (isIOS_Device && !usdzPath) {
            setError("iOS Quick Look requires USDZ format. Try uploading a GLB file.");
          } else {
            setError("AR mode is not available on this device or browser. Try updating your browser or using a different device.");
          }
        }
      }
    } catch (err) {
      console.error("Error entering AR mode:", err);
      setError("Failed to enter AR mode. Please try again.");
    }
  };

  if (!glbPath && !usdzPath) {
    return (
      <div
        className={cn(
          "w-full aspect-video rounded-xl bg-card border flex items-center justify-center",
          className
        )}
      >
        <p className="text-muted-foreground">No model available</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full rounded-xl overflow-hidden shadow-lg", className)}>
      <div className="relative aspect-video bg-gradient-to-br from-card to-muted">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Skeleton className="w-full h-full" />
          </div>
        )}
        
        <model-viewer
          ref={viewerRef as any}
          src={glbPath || undefined}
          ios-src={usdzPath || undefined}
          alt={title}
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-scale="fixed"
          camera-controls
          touch-action="pan-y"
          auto-rotate
          shadow-intensity="1"
          exposure="1"
          loading="eager"
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "transparent",
          }}
          onLoad={() => {
            setIsLoading(false);
            try {
              const v = viewerRef.current as any;
              if (v && typeof v.reveal === "function") {
                v.reveal();
              }
            } catch (e) {
              // ignore reveal errors
            }
          }}
          onError={() => {
            setIsLoading(false);
            setError("Failed to load model");
          }}
        />
        
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleReset}
                className="bg-background/80 backdrop-blur-sm"
                data-testid="button-reset-view"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoom}
                className="bg-background/80 backdrop-blur-sm"
                data-testid="button-zoom"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            
            {canViewAR() && (
              <Button
                className="min-h-12 px-6 gap-2 bg-primary hover:bg-primary/90"
                data-testid="button-view-ar"
                onClick={handleViewAR}
                disabled={isRequestingPermission}
              >
                {isRequestingPermission ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span className="font-semibold">Requesting Access...</span>
                  </>
                ) : (
                  <>
                    <View className="h-5 w-5" />
                    <span className="font-semibold">View in AR</span>
                    <Smartphone className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive text-center">
          <p className="text-sm">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => {
              // If AR mode isn't available or camera permission is required,
              // refresh the page to reset state and prompt the user to try again.
              const msg = error || "";
              if (msg.includes("AR mode is not available") || msg.includes("Camera permission")) {
                try {
                  window.location.reload();
                } catch (e) {
                  // fallback to resetting local state
                  setError(null);
                  setIsLoading(true);
                }
                return;
              }

              setError(null);
              setIsLoading(true);
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )}

      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black">
          <Button
            onClick={handleCloseFullscreen}
            variant="ghost"
            size="icon"
            className="fixed top-7 -right-7 z-50 bg-white hover:bg-gray-200 text-black rounded-full shadow-lg p-2"
            data-testid="button-close-fullscreen"
          >
            <X className="h-6 w-6" />
          </Button>

          <div className="w-full h-full relative">
            <model-viewer
              ref={fullscreenViewerRef as any}
              src={glbPath || undefined}
              ios-src={usdzPath || undefined}
              alt={title}
              ar
              ar-modes="webxr scene-viewer quick-look"
              ar-scale="fixed"
              camera-controls
              touch-action="pan-y"
              auto-rotate
              shadow-intensity="1"
              exposure="1"
              loading="eager"
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "transparent",
              }}
              onLoad={() => {
                syncFullscreenViewer();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
