import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Box,
  Upload,
  Settings,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores";
import { ThemeToggle } from "./theme-toggle";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/admin",
  },
  {
    title: "Models",
    icon: Box,
    path: "/admin/models",
  },
  {
    title: "Upload New",
    icon: Upload,
    path: "/admin/upload",
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/admin/settings",
  },
];

export function AdminSidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuthStore();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/">
          <Button variant="ghost" className="w-full justify-start gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Site
          </Button>
        </Link>
        <div className="mt-4">
          <h2 className="text-lg font-bold">Admin Panel</h2>
          {user && (
            <p className="text-sm text-muted-foreground">
              Welcome, {user.username}
            </p>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarSeparator />
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.path} data-testid={`link-admin-${item.title.toLowerCase()}`}>
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <div className="flex items-center justify-between">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
            className="gap-2"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
