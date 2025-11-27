import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ModelUploadForm } from "@/components/model-upload-form";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/lib/stores";

interface FormData {
  title: string;
  description?: string;
  category: string;
  visible: boolean;
  parts: string[];
  colors: string[];
}

export default function AdminUploadPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { token } = useAuthStore();

  const uploadMutation = useMutation({
    mutationFn: async ({
      data,
      modelFile,
      textureFiles,
    }: {
      data: FormData;
      modelFile: File | null;
      textureFiles: File[];
    }) => {
      if (!modelFile) {
        throw new Error("Model file is required");
      }

      const formData = new FormData();
      formData.append("model", modelFile);
      formData.append("title", data.title);
      formData.append("description", data.description || "");
      formData.append("category", data.category);
      formData.append("visible", String(data.visible));
      formData.append("parts", JSON.stringify(data.parts));
      formData.append("colors", JSON.stringify(data.colors));

      textureFiles.forEach((file) => {
        formData.append("textures", file);
      });

      const response = await fetch("/api/admin/models", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload model");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/models"] });
      toast({
        title: "Model uploaded",
        description: "Your 3D model has been successfully uploaded.",
      });
      setLocation("/admin/models");
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (
    data: FormData,
    modelFile: File | null,
    textureFiles: File[]
  ) => {
    await uploadMutation.mutateAsync({ data, modelFile, textureFiles });
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Upload New Model</h1>
        <p className="text-muted-foreground">
          Add a new 3D model to your collection
        </p>
      </div>

      <ModelUploadForm
        onSubmit={handleSubmit}
        isLoading={uploadMutation.isPending}
        mode="create"
      />
    </div>
  );
}
