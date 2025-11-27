import { View, Eye, EyeOff, Pencil, Trash2, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { AdminModel } from "@shared/schema";

interface ModelCardProps {
  model: AdminModel;
  isAdmin?: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleVisibility?: (visible: boolean) => void;
}

export function ModelCard({
  model,
  isAdmin = false,
  onView,
  onEdit,
  onDelete,
  onToggleVisibility,
}: ModelCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card
      className={cn(
        "group overflow-hidden hover-elevate transition-transform",
        !model.visible && isAdmin && "opacity-75"
      )}
      data-testid={`card-model-${model.id}`}
    >
      <div className="relative aspect-video bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
        {model.thumbnailPath ? (
          <img
            src={model.thumbnailPath}
            alt={model.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Box className="h-16 w-16 text-muted-foreground/40" />
          </div>
        )}
        
        {isAdmin && (
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <Badge
              variant={model.visible ? "default" : "secondary"}
              className="text-xs"
            >
              {model.visible ? (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  Visible
                </>
              ) : (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  Hidden
                </>
              )}
            </Badge>
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button
            onClick={onView}
            className="gap-2"
            data-testid={`button-view-model-${model.id}`}
          >
            <View className="h-4 w-4" />
            View in AR
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold truncate"
              data-testid={`text-model-title-${model.id}`}
            >
              {model.title}
            </h3>
            {model.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {model.description}
              </p>
            )}
          </div>
          <Badge variant="secondary" className="text-xs shrink-0">
            {model.category}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <span className="text-xs text-muted-foreground">
            {formatDate(model.createdAt)}
          </span>
          
          {isAdmin && (
            <div className="flex items-center gap-1">
              <Switch
                checked={model.visible}
                onCheckedChange={onToggleVisibility}
                data-testid={`switch-visibility-${model.id}`}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                data-testid={`button-edit-${model.id}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="text-destructive hover:text-destructive"
                data-testid={`button-delete-${model.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
