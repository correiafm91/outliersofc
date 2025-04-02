
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ArticleDetail from "./pages/ArticleDetail";
import NotFound from "./pages/NotFound";
import CreateArticle from "./pages/CreateArticle";
import UserProfile from "./pages/UserProfile";
import { useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => {
  // Add class for smooth scrolling animation and set São Paulo timezone
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    
    // Set São Paulo timezone for date formatting
    const setupBrazilianTimeFormat = () => {
      try {
        // Ensure we use Brazilian Portuguese locale and São Paulo timezone
        Intl.DateTimeFormat('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          dateStyle: 'full',
          timeStyle: 'short'
        });
        
        console.log("Brazilian timezone set successfully");
      } catch (error) {
        console.error("Error setting up Brazilian timezone:", error);
      }
    };
    
    setupBrazilianTimeFormat();
    
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/article/:id" element={<ArticleDetail />} />
              <Route path="/criar-artigo" element={<CreateArticle />} />
              <Route path="/perfil" element={<UserProfile />} />
              <Route path="/negocios" element={<Index />} />
              <Route path="/economia" element={<Index />} />
              <Route path="/tecnologia" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
