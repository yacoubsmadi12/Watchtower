import { Link, useLocation } from "wouter";
import { LayoutDashboard, AlertTriangle, FileText, Settings, Shield, Activity, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: AlertTriangle, label: "Alerts", href: "/alerts" },
    { icon: BarChart3, label: "Reports", href: "/reports" },
    { icon: FileText, label: "Logs", href: "/logs" },
    { icon: Shield, label: "Rules", href: "/rules" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-sidebar-border bg-sidebar flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <Activity className="h-6 w-6 text-primary mr-3" />
          <span className="font-mono font-bold text-lg tracking-tight">WATCHTOWER</span>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                location === item.href 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}>
                <item.icon className="h-4 w-4 mr-3" />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground">System Status</span>
              <span className="text-xs font-bold text-green-500">OPERATIONAL</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-grid-pattern">
        {/* Header */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-8 z-10">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold tracking-tight">
              {navItems.find(i => i.href === location)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
             <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono">
               v1.0.0-beta
             </div>
             <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold">
               ZJ
             </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
