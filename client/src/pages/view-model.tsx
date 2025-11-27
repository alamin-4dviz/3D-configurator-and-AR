import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Tag, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ModelViewerAR } from "@/components/model-viewer-ar";
import type { AdminModel } from "@shared/schema";

export default function ViewModelPage() {
  const [, params] = useRoute("/view/:id");
  const modelId = params?.id;

  const { data: model, isLoading, error } = useQuery<AdminModel>({
    queryKey: ["/api/models", modelId],
    enabled: !!modelId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="aspect-video rounded-xl mb-8" />
          <Skeleton className="h-6 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Model not found</h2>
        <p className="text-muted-foreground mb-6">
          The model you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/models">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Gallery
          </Button>
        </Link>
      </div>
    );
  }

  const detectDeviceType = () => {
    if (typeof window === "undefined") return "android";
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ? "ios" : "android";
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/models">
            <Button variant="ghost" className="gap-2 mb-6" data-testid="button-back-to-gallery">
              <ArrowLeft className="h-4 w-4" />
              Back to Gallery
            </Button>
          </Link>

          <ModelViewerAR
            glbPath={model.glbPath}
            usdzPath={model.usdzPath}
            deviceType={detectDeviceType()}
            title={model.title}
            className="mb-8"
          />

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="text-model-title">
                {model.title}
              </h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <Badge variant="secondary">{model.category}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    {new Date(model.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {model.description && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground">{model.description}</p>
              </div>
            )}

            <div className="pt-6 border-t">
              <h2 className="text-lg font-semibold mb-4">
                AR Viewing Instructions
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-card border">
                  <h3 className="font-medium mb-2">iOS Users</h3>
                  <p className="text-sm text-muted-foreground">
                    Tap "View in AR" to open the model in Quick Look. Point your
                    camera at a flat surface to place the model.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-card border">
                  <h3 className="font-medium mb-2">Android Users</h3>
                  <p className="text-sm text-muted-foreground">
                    Tap "View in AR" to launch WebXR. Grant camera permissions
                    and point at a surface to view the model.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
