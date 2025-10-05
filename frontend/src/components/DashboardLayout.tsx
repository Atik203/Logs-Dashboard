import {
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { authService, type User } from "@api/auth";
import { ModeToggle } from "@components/ModeToggle";
import { Button } from "@components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Logs", href: "/logs", icon: FileText },
  { name: "Create Log", href: "/logs/create", icon: PlusCircle },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(authService.getUser());

  useEffect(() => {
    // Fetch current user if not in cache
    if (!user) {
      authService
        .fetchCurrentUser()
        .then(setUser)
        .catch(() => {
          toast.error("Failed to load user profile");
        });
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Logout failed");
      navigate("/");
    }
  };

  const getUserInitial = () => {
    if (!user) return "U";
    return (
      user.username?.charAt(0).toUpperCase() ||
      user.email?.charAt(0).toUpperCase() ||
      "U"
    );
  };

  const getUserDisplay = () => {
    if (!user) return "Loading...";
    return user.username || user.email;
  };

  const getUserEmail = () => {
    if (!user) return "";
    return user.email;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed, no scrolling */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b px-6 flex-shrink-0">
            <Home className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Logs Dashboard</span>
          </div>

          {/* Navigation - No scrolling needed, few items */}
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const isActive =
                location.pathname === item.href ||
                (item.href !== "/dashboard" &&
                  location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t p-4 space-y-2 flex-shrink-0">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {getUserInitial()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {getUserDisplay()}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {getUserEmail()}
                </p>
              </div>
            </div>
            <div className="flex justify-end items-center">
              <ModeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content - This is the only scrollable area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar for mobile */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 lg:hidden flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <span className="font-semibold">Logs Dashboard</span>
        </header>

        {/* Page content - Scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-none px-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
