import { Navigation } from "@/components/navigation";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>{children}</main>
    </div>
  );
}
