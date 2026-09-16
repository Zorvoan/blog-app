import { type ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Layers,
  Home,
  FileText,
  Newspaper,
  FolderTree,
  Settings,
  LogOut,
  Menu,
  X,
  WifiOff,
  Wifi,
} from "lucide-react";

export type View = "feed" | "pages" | "posts" | "categories" | "settings";

interface LayoutProps {
  currentView: View;
  onNavigate: (view: View) => void;
  children: ReactNode;
}

const NAV_ITEMS: { view: View; label: string; icon: typeof Home }[] = [
  { view: "feed", label: "Feed", icon: Home },
  { view: "posts", label: "Posts", icon: Newspaper },
  { view: "pages", label: "Pages", icon: FileText },
  { view: "categories", label: "Categories", icon: FolderTree },
  { view: "settings", label: "Settings", icon: Settings },
];

export function Layout({ currentView, onNavigate, children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [online, setOnlineState] = useState(true);

  useEffect(() => {
    setOnlineState(navigator.onLine);
    const onOnline = () => setOnlineState(true);
    const onOffline = () => setOnlineState(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  function handleNavigate(view: View) {
    onNavigate(view);
    setMobileOpen(false);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Block CMS</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => handleNavigate(item.view)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Online status */}
        <div className="px-5 py-2 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
            {online ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-green-500" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                Offline mode
              </>
            )}
          </div>
        </div>

        {/* User */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 px-2 py-2">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ backgroundColor: user?.avatar_color ?? "#3b82f6" }}
            >
              {(user?.display_name || user?.username || "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {user?.display_name || user?.username}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                @{user?.username}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between h-14 px-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 -ml-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">Block CMS</span>
          </div>
          <div className="w-9" />
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
