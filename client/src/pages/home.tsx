import { useState, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, Sparkles, Box } from "lucide-react";
import { DeviceSelector } from "@/components/device-selector";
import { FileUploadZone } from "@/components/file-upload-zone";
import { ModelViewerAR } from "@/components/model-viewer-ar";
import { ConversionStatus } from "@/components/conversion-status";
import { Button } from "@/components/ui/button";
import { useUploadStore } from "@/lib/stores";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ConversionStatus as Status, UploadResponse } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const {
    sessionId,
    deviceType,
    status,
    glbPath,
    usdzPath,
    originalFileName,
    setDeviceType,
    setUploadState,
    resetUpload,
  } = useUploadStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("model", file);
      formData.append("deviceType", deviceType);
      formData.append("sessionId", sessionId);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      return response.json() as Promise<UploadResponse>;
    },
    onMutate: () => {
      setUploadState({ status: "converting" });
    },
    onSuccess: (data) => {
      setUploadState({
        uploadId: data.id,
        status: data.status,
        glbPath: data.glbPath || null,
        usdzPath: data.usdzPath || null,
      });
      toast({
        title: "Model ready!",
        description: "Your 3D model has been converted and is ready for AR viewing.",
      });
    },
    onError: (error) => {
      setUploadState({ status: "error" });
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = useCallback(
    (file: File) => {
      setSelectedFile(file);
      setUploadState({ originalFileName: file.name });
    },
    [setUploadState]
  );

  const handleUpload = useCallback(() => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  }, [selectedFile, uploadMutation]);

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    resetUpload();
  }, [resetUpload]);

  const handleNewUpload = useCallback(() => {
    apiRequest("DELETE", `/api/upload/${sessionId}`).catch(() => {});
    setSelectedFile(null);
    resetUpload();
  }, [sessionId, resetUpload]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      navigator.sendBeacon(`/api/upload/cleanup/${sessionId}`);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [sessionId]);

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Instant 3D to AR Conversion
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              View Your 3D Models in{" "}
              <span className="text-primary">Augmented Reality</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload any 3D model and instantly view it in AR on your device.
              Supports OBJ, FBX, GLB, and STL formats.
            </p>
          </div>

          {status === "ready" && (glbPath || usdzPath) ? (
            <div className="space-y-6">
              <ModelViewerAR
                glbPath={glbPath}
                usdzPath={usdzPath}
                deviceType={deviceType}
                title={originalFileName || "3D Model"}
              />
              <div className="flex items-center justify-between">
                <ConversionStatus status={status} />
                <Button onClick={handleNewUpload} variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload New Model
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <DeviceSelector
                selectedDevice={deviceType}
                onDeviceChange={setDeviceType}
              />

              <FileUploadZone
                onFileSelect={handleFileSelect}
                status={status}
                selectedFile={selectedFile}
                onClear={handleClear}
                isUploading={uploadMutation.isPending}
                progress={uploadProgress}
              />

              {selectedFile && status === "pending" && (
                <div className="flex justify-center">
                  <Button
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending}
                    className="gap-2 min-h-12 px-8"
                    data-testid="button-start-conversion"
                  >
                    <Box className="h-5 w-5" />
                    Convert & View in AR
                  </Button>
                </div>
              )}

              {(status === "converting" || uploadMutation.isPending) && (
                <ConversionStatus status="converting" />
              )}

              {status === "error" && (
                <div className="text-center">
                  <ConversionStatus status="error" />
                  <Button
                    onClick={handleClear}
                    variant="outline"
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t bg-card/50">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: 1,
                title: "Select Device",
                description:
                  "Choose your target device to ensure optimal AR format conversion.",
              },
              {
                step: 2,
                title: "Upload Model",
                description:
                  "Drag and drop your 3D model file. We support OBJ, FBX, GLB, and STL.",
              },
              {
                step: 3,
                title: "View in AR",
                description:
                  "Experience your model in augmented reality on your mobile device.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
