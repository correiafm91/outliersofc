
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { ensureColumnsExist } from "@/integrations/supabase/client";

// Pages
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import UserProfile from "@/pages/UserProfile";
import CreateArticle from "@/pages/CreateArticle";
import ArticleDetail from "@/pages/ArticleDetail";
import SavedArticles from "@/pages/SavedArticles";
import UserView from "@/pages/UserView";

function App() {
  useEffect(() => {
    // Check and ensure required columns exist when the app starts
    ensureColumnsExist();
  }, []);

  return (
    <React.StrictMode>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/user/:id" element={<UserView />} />
            <Route path="/criar-artigo" element={<CreateArticle />} />
            <Route path="/article/:id" element={<ArticleDetail />} />
            <Route path="/saved-articles" element={<SavedArticles />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </React.StrictMode>
  );
}

export default App;
