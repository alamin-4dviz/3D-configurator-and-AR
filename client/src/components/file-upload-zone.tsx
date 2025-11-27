import { useCallback, useState } from "react";
import { Upload, File, X, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ConversionStatus } from "@shared/schema";

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  status: ConversionStatus;
  selectedFile: File | null;
  onClear: () => void;
  isUploading: boolean;
  progress?: number;
}

const supportedFormats = [
  { ext: ".glb", label: "GLB" },
  { ext: ".gltf", label: "GLTF" },
  { ext: ".obj", label: "OBJ" },
  { ext: ".fbx", label: "FBX" },
  { ext: ".stl", label: "STL" },
];

const acceptedExtensions = supportedFormats.map((f) => f.ext).join(",");

export function FileUploadZone({
  onFileSelect,
  status,
  selectedFile,
  onClear,
  isUploading,
  progress = 0,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (selectedFile) {
    return (
      <div className="w-full">
        <div className="border-2 border-dashed border-border rounded-xl p-6 bg-card">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center">
              <File className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate" data-testid="text-file-name">
                {selectedFile.name}
              </p>
              <p className="text-sm text-muted-foreground" data-testid="text-file-size">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            {status === "pending" && !isUploading && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClear}
                data-testid="button-clear-file"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {(isUploading || status === "converting") && (
            <div className="mt-4">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium" data-testid="text-upload-status">
                  {isUploading ? "Uploading..." : "Converting..."}
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${isUploading ? progress : 50}%` }}
                />
              </div>
            </div>
          )}

          {status === "ready" && (
            <div className="mt-4 flex items-center gap-2 text-green-600 dark:text-green-500">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium" data-testid="text-conversion-complete">
                Conversion complete!
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-xl min-h-64 flex flex-col items-center justify-center p-8 transition-all cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"
        )}
      >
        <input
          type="file"
          accept={acceptedExtensions}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          data-testid="input-file-upload"
        />
        
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Upload className="h-8 w-8 text-primary" />
        </div>
        
        <h4 className="text-lg font-semibold mb-2">
          Drag & drop your 3D model
        </h4>
        <p className="text-muted-foreground text-center mb-4">
          or click to browse files
        </p>
        
        <div className="flex flex-wrap gap-2 justify-center">
          {supportedFormats.map((format) => (
            <Badge key={format.ext} variant="secondary" className="text-xs">
              {format.label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
