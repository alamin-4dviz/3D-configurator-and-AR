import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ModelUploadForm } from "@/components/model-upload-form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuthStore } from "@/lib/stores";
import type { AdminModel, ConfiguratorMetadata } from "@shared/schema";

interface FormData {
  title: string;
  description?: string;
  category: string;
  visible: boolean;
  parts: string[];
  colors: string[];
}

export default function AdminEditPage() {
  const [, params] = useRoute("/admin/edit/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { token } = useAuthStore();
  const modelId = params?.id;

  const { data: model, isLoading: modelLoading } = useQuery<AdminModel>({
    queryKey: ["/api/admin/models", modelId],
    enabled: !!modelId,
  });

  const { data: configurator } = useQuery<ConfiguratorMetadata>({
    queryKey: ["/api/admin/models", modelId, "configurator"],
    enabled: !!modelId,
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      data,
      modelFile,
      textureFiles,
    }: {
      data: FormData;
      modelFile: File | null;
      textureFiles: File[];
    }) => {
      const formData = new FormData();
      if (modelFile) {
        formData.append("model", modelFile);
      }
      formData.append("title", data.title);
      formData.append("description", data.description || "");
      formData.append("category", data.category);
      formData.append("visible", String(data.visible));
      formData.append("parts", JSON.stringify(data.parts));
      formData.append("colors", JSON.stringify(data.colors));

      textureFiles.forEach((file) => {
        formData.append("textures", file);
      });

      const response = await fetch(`/api/admin/models/${modelId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update model");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/models"] });
      toast({
        title: "Model updated",
        description: "Your changes have been saved.",
      });
      setLocation("/admin/models");
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
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
    await updateMutation.mutateAsync({ data, modelFile, textureFiles });
  };

  if (modelLoading) {
    return (
      <div className="max-w-4xl space-y-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Model not found</h2>
        <p className="text-muted-foreground mb-6">
          The model you're looking for doesn't exist.
        </p>
        <Button onClick={() => setLocation("/admin/models")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Models
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <Button
        variant="ghost"
        className="gap-2 mb-6"
        onClick={() => setLocation("/admin/models")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Models
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Model</h1>
        <p className="text-muted-foreground">
          Update model details and configurator settings
        </p>
      </div>

      <ModelUploadForm
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending}
        mode="edit"
        initialData={{
          title: model.title,
          description: model.description || "",
          category: model.category,
          visible: model.visible,
          parts: configurator?.parts || [],
          colors: configurator?.colors || [],
        }}
      />
    </div>
  );
}
