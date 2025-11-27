import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, Filter, Box, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModelCard } from "@/components/model-card";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function ModelsPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data: models, isLoading, error } = useQuery<AdminModel[]>({
    queryKey: ["/api/models/public"],
  });

  const filteredModels = models?.filter((model) => {
    const matchesSearch =
      model.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || model.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleViewModel = (model: AdminModel) => {
    setLocation(`/view/${model.id}`);
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-destructive">Failed to load models</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">3D Model Gallery</h1>
          <p className="text-muted-foreground">
            Browse our collection of 3D models and view them in AR
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-models"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48" data-testid="select-filter-category">
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

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-video rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredModels && filteredModels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModels.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                onView={() => handleViewModel(model)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="h-20 w-20 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
              <Box className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No models found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchQuery || selectedCategory !== "All"
                ? "Try adjusting your search or filter criteria."
                : "No models have been published yet. Check back later!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
