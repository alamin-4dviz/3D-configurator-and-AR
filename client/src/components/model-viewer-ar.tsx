import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { View, RotateCcw, Smartphone, RefreshCw, X, Maximize2 } from "lucide-react";
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

  const handleResetFullscreen = () => {
    if (fullscreenViewerRef.current) {
      (fullscreenViewerRef.current as any).cameraOrbit = "0deg 75deg 105%";
      (fullscreenViewerRef.current as any).fieldOfView = "auto";
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

  const handleViewAR = async () => {
    try {
      if (!viewerRef.current) {
        setError("3D viewer not loaded. Please refresh and try again.");
        return;
      }

      const viewer = viewerRef.current as any;

      // Try simple AR trigger approaches (shadow DOM button, activateAR, ar.launch)
      const arButton = viewer?.shadowRoot?.querySelector('button[slot="ar-button"]') as HTMLButtonElement;
      if (arButton) {
        arButton.click();
        return;
      }

      if (typeof viewer?.activateAR === "function") {
        await viewer.activateAR();
        return;
      }

      if (viewer?.ar && typeof viewer.ar.launch === "function") {
        viewer.ar.launch();
        return;
      }

      setError("AR mode is not available for this device or browser.");
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
        
        <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleReset}
                className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
                title="Reset view to default camera position"
                data-testid="button-reset-view"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoom}
                className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
                title="Expand to fullscreen"
                data-testid="button-zoom"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
              {/* Info / tips removed to restore previous UX state */}
            </div>
            
            {canViewAR() && (
              <Button
                className="px-4 gap-2 bg-primary hover:bg-primary/90 shadow-lg"
                data-testid="button-view-ar"
                onClick={handleViewAR}
              >
                <View className="h-4 w-4" />
                <span className="font-semibold text-xs md:text-sm">View in AR</span>
                <Smartphone className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>

          {/* Tips overlay removed to restore previous UX state */}
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
                // If AR mode isn't available, reload to reset state; otherwise clear error
                const msg = error || "";
                if (msg.includes("AR mode is not available")) {
                  try {
                    window.location.reload();
                  } catch (e) {
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
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Fullscreen Header */}
          <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between">
            <div className="text-white max-w-[15rem] sm:max-w-sm">
              <h3 className="font-semibold text-sm truncate">{title}</h3>
              <p className="text-xs text-gray-300">Fullscreen Preview</p>
            </div>
            <Button
              onClick={handleCloseFullscreen}
              variant="ghost"
              size="icon"
              className="bg-white hover:bg-gray-200 text-black rounded-full shadow-lg p-2"
              data-testid="button-close-fullscreen"
              title="Close fullscreen"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="w-full h-full flex-1 relative">
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

          {/* Fullscreen Controls Footer */}
          <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFullscreen}
              className="bg-white/20 hover:bg-white/30 text-white border-white/40 backdrop-blur-sm"
              title="Reset camera position"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewAR}
              className="bg-primary hover:bg-primary/90 text-white border-0 backdrop-blur-sm"
              title="View this model in AR"
            >
              <View className="h-4 w-4 mr-2" />
              View in AR
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
