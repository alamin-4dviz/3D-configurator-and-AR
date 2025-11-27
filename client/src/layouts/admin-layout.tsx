import { useEffect } from "react";
import { useLocation } from "wouter";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { useAuthStore } from "@/lib/stores";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isAdmin } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      setLocation("/login");
    }
  }, [isAuthenticated, isAdmin, setLocation]);

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <SidebarInset>
          <header className="flex h-14 items-center gap-4 border-b px-4 lg:px-6">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 p-4 lg:p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
