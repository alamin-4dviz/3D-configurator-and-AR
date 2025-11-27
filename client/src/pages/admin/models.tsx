import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Search,
  Filter,
  Plus,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Box,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AdminModel } from "@shared/schema";

const categories = [
  "All",
  "Furniture",
  "Electronics",
  "Fashion",
  "Automotive",
  "Architecture",
  "Art",
  "Sports",
  "General",
];

export default function AdminModelsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [deleteModelId, setDeleteModelId] = useState<string | null>(null);

  const { data: models, isLoading } = useQuery<AdminModel[]>({
    queryKey: ["/api/admin/models"],
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({
      modelId,
      visible,
    }: {
      modelId: string;
      visible: boolean;
    }) => {
      await apiRequest("PATCH", `/api/admin/models/${modelId}`, { visible });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/models"] });
      toast({
        title: "Visibility updated",
        description: "Model visibility has been changed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update visibility.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (modelId: string) => {
      await apiRequest("DELETE", `/api/admin/models/${modelId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/models"] });
      toast({
        title: "Model deleted",
        description: "The model has been permanently deleted.",
      });
      setDeleteModelId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete model.",
        variant: "destructive",
      });
    },
  });

  const filteredModels = models?.filter((model) => {
    const matchesSearch =
      model.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || model.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (modelId: string) => {
    setLocation(`/admin/edit/${modelId}`);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Models</h1>
          <p className="text-muted-foreground">
            Manage your 3D model collection
          </p>
        </div>
        <Button
          onClick={() => setLocation("/admin/upload")}
          className="gap-2"
          data-testid="button-add-model"
        >
          <Plus className="h-4 w-4" />
          Add Model
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-admin-models"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-48" data-testid="select-admin-category">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-14 w-14 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : filteredModels && filteredModels.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Preview</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Category
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModels.map((model) => (
                    <TableRow key={model.id} data-testid={`row-model-${model.id}`}>
                      <TableCell>
                        <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center">
                          {model.thumbnailPath ? (
                            <img
                              src={model.thumbnailPath}
                              alt={model.title}
                              className="h-full w-full object-cover rounded-lg"
                            />
                          ) : (
                            <Box className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{model.title}</p>
                          {model.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {model.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary">{model.category}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {formatDate(model.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={model.visible}
                          onCheckedChange={(checked) =>
                            toggleVisibilityMutation.mutate({
                              modelId: model.id,
                              visible: checked,
                            })
                          }
                          disabled={toggleVisibilityMutation.isPending}
                          data-testid={`switch-model-visibility-${model.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(model.id)}
                            data-testid={`button-edit-model-${model.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteModelId(model.id)}
                            className="text-destructive hover:text-destructive"
                            data-testid={`button-delete-model-${model.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-16">
              <Box className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No models found</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                {searchQuery || selectedCategory !== "All"
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by uploading your first 3D model."}
              </p>
              <Button onClick={() => setLocation("/admin/upload")} className="gap-2">
                <Plus className="h-4 w-4" />
                Upload Model
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deleteModelId}
        onOpenChange={() => setDeleteModelId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Model</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this model? This action cannot be
              undone and will permanently remove the model and all associated
              files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteModelId && deleteMutation.mutate(deleteModelId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
