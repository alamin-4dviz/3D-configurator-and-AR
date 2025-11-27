import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { View, RotateCcw, ZoomIn, Smartphone, RefreshCw } from "lucide-react";
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
          "camera-controls"?: boolean;
          "touch-action"?: string;
          "auto-rotate"?: boolean;
          "shadow-intensity"?: string;
          exposure?: string;
          poster?: string;
          loading?: string;
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
  const viewerRef = useRef<HTMLElement | null>(null);

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
    if (viewerRef.current) {
      const current = (viewerRef.current as any).fieldOfView;
      (viewerRef.current as any).fieldOfView = current === "auto" ? "30deg" : "auto";
    }
  };

  const isIOS = () => {
    if (typeof window === "undefined") return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  };

  const canViewAR = () => {
    if (deviceType === "ios" || deviceType === "both") {
      if (isIOS() && usdzPath) return true;
    }
    if (deviceType === "android" || deviceType === "both") {
      if (!isIOS() && glbPath) return true;
    }
    return Boolean(glbPath);
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
          onLoad={() => setIsLoading(false)}
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
                onClick={() => {
                  const arButton = viewerRef.current?.shadowRoot?.querySelector(
                    'button[slot="ar-button"]'
                  ) as HTMLButtonElement;
                  arButton?.click();
                }}
              >
                <View className="h-5 w-5" />
                <span className="font-semibold">View in AR</span>
                <Smartphone className="h-4 w-4 ml-1" />
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
              setError(null);
              setIsLoading(true);
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
