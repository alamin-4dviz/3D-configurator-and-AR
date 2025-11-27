import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Box, Upload, Layers, LogIn, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ThemeToggle } from "./theme-toggle";
import { useAuthStore } from "@/lib/stores";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Upload Model", path: "/", icon: Upload },
  { label: "Admin Models", path: "/models", icon: Layers },
];

export function Navigation() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, isAdmin, user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer" data-testid="link-home">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <Box className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl hidden sm:block">AR Viewer</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="gap-2"
                    data-testid={`link-nav-${item.label.toLowerCase().replace(" ", "-")}`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                {isAdmin && (
                  <Link href="/admin">
                    <Button variant="outline" className="gap-2" data-testid="link-admin-panel">
                      <User className="h-4 w-4" />
                      Admin Panel
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  onClick={logout}
                  data-testid="button-logout-nav"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/login" className="hidden md:block">
                <Button variant="outline" className="gap-2" data-testid="link-login">
                  <LogIn className="h-4 w-4" />
                  Admin Login
                </Button>
              </Link>
            )}
            
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                  {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                  <SheetDescription>Navigate through the application</SheetDescription>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-8">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.path;
                    
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setIsOpen(false)}
                      >
                        <Button
                          variant={isActive ? "secondary" : "ghost"}
                          className="w-full justify-start gap-2"
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Button>
                      </Link>
                    );
                  })}
                  
                  <div className="border-t my-4" />
                  
                  {isAuthenticated ? (
                    <>
                      {isAdmin && (
                        <Link href="/admin" onClick={() => setIsOpen(false)}>
                          <Button variant="outline" className="w-full justify-start gap-2">
                            <User className="h-4 w-4" />
                            Admin Panel
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          logout();
                          setIsOpen(false);
                        }}
                      >
                        Logout
                      </Button>
                    </>
                  ) : (
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <LogIn className="h-4 w-4" />
                        Admin Login
                      </Button>
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
