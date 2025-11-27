import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Box, Eye, EyeOff, HardDrive, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/stats-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { AdminModel } from "@shared/schema";

interface DashboardStats {
  totalModels: number;
  visibleModels: number;
  hiddenModels: number;
  totalStorage: string;
}

export default function AdminDashboard() {
  const { data: models, isLoading: modelsLoading } = useQuery<AdminModel[]>({
    queryKey: ["/api/admin/models"],
  });

  const stats: DashboardStats = {
    totalModels: models?.length || 0,
    visibleModels: models?.filter((m) => m.visible).length || 0,
    hiddenModels: models?.filter((m) => !m.visible).length || 0,
    totalStorage: "0 MB",
  };

  const recentModels = models?.slice(0, 5) || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your 3D model management
          </p>
        </div>
        <Link href="/admin/upload">
          <Button className="gap-2" data-testid="button-add-new-model">
            <Plus className="h-4 w-4" />
            Add New Model
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Models"
          value={stats.totalModels}
          icon={Box}
          description="All uploaded models"
        />
        <StatsCard
          title="Visible"
          value={stats.visibleModels}
          icon={Eye}
          description="Publicly accessible"
        />
        <StatsCard
          title="Hidden"
          value={stats.hiddenModels}
          icon={EyeOff}
          description="Not visible to users"
        />
        <StatsCard
          title="Storage Used"
          value={stats.totalStorage}
          icon={HardDrive}
          description="Total file storage"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-xl">Recent Uploads</CardTitle>
          <Link href="/admin/models">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {modelsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentModels.length > 0 ? (
            <div className="space-y-4">
              {recentModels.map((model) => (
                <div
                  key={model.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover-elevate bg-card border"
                  data-testid={`row-recent-model-${model.id}`}
                >
                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
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
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{model.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(model.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={model.visible ? "default" : "secondary"}>
                    {model.visible ? "Visible" : "Hidden"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Box className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No models uploaded yet</p>
              <Link href="/admin/upload">
                <Button variant="outline" className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Upload Your First Model
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/upload">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" />
                Upload New Model
              </Button>
            </Link>
            <Link href="/admin/models">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Box className="h-4 w-4" />
                Manage Models
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                Optimize 3D models before upload for faster loading
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                Add descriptions and categories to improve discoverability
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                Use the configurator metadata for future customization features
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
