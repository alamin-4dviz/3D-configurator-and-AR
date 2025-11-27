import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { MainLayout } from "@/layouts/main-layout";
import { AdminLayout } from "@/layouts/admin-layout";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import ModelsPage from "@/pages/models";
import ViewModelPage from "@/pages/view-model";
import LoginPage from "@/pages/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminModelsPage from "@/pages/admin/models";
import AdminUploadPage from "@/pages/admin/upload";
import AdminEditPage from "@/pages/admin/edit";
import AdminSettingsPage from "@/pages/admin/settings";

function PublicRouter() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/models" component={ModelsPage} />
        <Route path="/view/:id" component={ViewModelPage} />
        <Route path="/login" component={LoginPage} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function AdminRouter() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/models" component={AdminModelsPage} />
        <Route path="/admin/upload" component={AdminUploadPage} />
        <Route path="/admin/edit/:id" component={AdminEditPage} />
        <Route path="/admin/settings" component={AdminSettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/admin/*?" component={AdminRouter} />
      <Route path="/*?" component={PublicRouter} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
