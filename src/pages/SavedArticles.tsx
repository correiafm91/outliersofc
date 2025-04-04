
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { ArticleCard } from "@/components/article-card";
import { AnimatedElement } from "@/components/ui/animated-element";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, tablesWithoutTypes } from "@/integrations/supabase/client";

export default function SavedArticles() {
  const [savedArticles, setSavedArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchSavedArticles = async () => {
      setIsLoading(true);
      
      try {
        const { data, error } = await tablesWithoutTypes.bookmarks()
          .select(`
            id,
            article_id,
            articles:article_id (
              id, 
              title,
              content,
              image_url,
              category,
              created_at,
              profiles:author_id (
                username,
                avatar_url
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Erro ao buscar artigos salvos:", error);
          setSavedArticles([]);
        } else {
          // Transform data to match ArticleCard props
          const articles = data?.map(item => item.articles) || [];
          setSavedArticles(articles.filter(Boolean));
        }
      } catch (err) {
        console.error("Exception fetching saved articles:", err);
        setSavedArticles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedArticles();
  }, [user, navigate]);

  if (!user) return null;
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <NavBar />
        <div className="pt-24 pb-20 flex justify-center items-center h-[60vh]">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-8 bg-zinc-700 rounded-full"></div>
            <p className="mt-4 text-zinc-500">Carregando artigos salvos...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />
      
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <AnimatedElement>
            <h1 className="text-3xl font-bold mb-8 border-b border-zinc-800 pb-4">
              Artigos Salvos
            </h1>
            
            {savedArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedArticles.map((article) => (
                  <ArticleCard 
                    key={article.id}
                    id={article.id}
                    title={article.title}
                    excerpt={article.content.substring(0, 100) + '...'}
                    category={article.category}
                    imageUrl={article.image_url}
                    date={new Date(article.created_at).toLocaleDateString('pt-BR')}
                    authorName={article.profiles?.username || 'Autor'}
                    authorAvatar={article.profiles?.avatar_url || ''}
                    showActions={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-zinc-900/50 rounded-lg">
                <p className="text-zinc-400 mb-4">Você ainda não salvou nenhum artigo.</p>
                <Button 
                  onClick={() => navigate("/")} 
                  className="bg-white text-black hover:bg-zinc-200"
                >
                  Explorar artigos
                </Button>
              </div>
            )}
          </AnimatedElement>
        </div>
      </div>

      <Footer />
    </div>
  );
}
