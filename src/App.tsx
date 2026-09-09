import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AuthScreen } from "@/components/AuthScreen";
import { Layout, type View } from "@/components/Layout";
import { FeedView } from "@/components/FeedView";
import { PostsView } from "@/components/PostsView";
import { PagesView } from "@/components/PagesView";
import { CategoriesView } from "@/components/CategoriesView";
import { SettingsView } from "@/components/SettingsView";
import { Loader2 } from "lucide-react";

function AppContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<View>("feed");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <Layout currentView={view} onNavigate={setView}>
      {view === "feed" && <FeedView onNavigate={setView} />}
      {view === "posts" && <PostsView />}
      {view === "pages" && <PagesView />}
      {view === "categories" && <CategoriesView />}
      {view === "settings" && <SettingsView />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
