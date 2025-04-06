
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { ArticleCard } from "@/components/article-card";
import { AnimatedElement } from "@/components/ui/animated-element";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, tables } from "@/integrations/supabase/client";

export default function SavedArticles() {
  const [savedArticles, setSavedArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const loadBookmarkedArticles = async () => {
      setIsLoading(true);
      
      try {
        const { data: bookmarks, error: bookmarksError } = await tables.bookmarks()
          .select('*')
          .eq('user_id', user.id);

        if (bookmarksError) {
          console.error("Error fetching bookmarks:", bookmarksError);
          toast({
            title: "Erro",
            description: "Não foi possível carregar seus artigos salvos",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (!bookmarks || bookmarks.length === 0) {
          setSavedArticles([]);
          setIsLoading(false);
          return;
        }

        const articleIds = bookmarks.map(bookmark => bookmark.article_id);
        const { data: articles, error: articlesError } = await supabase
          .from('articles')
          .select(`
            *,
            profiles:author_id (username, avatar_url, sector)
          `)
          .in('id', articleIds);

        if (articlesError) {
          console.error("Error fetching saved articles:", articlesError);
        } else {
          const articlesWithBookmarkInfo = articles?.map(article => {
            const bookmark = bookmarks.find(b => b.article_id === article.id);
            return {
              ...article,
              bookmark_id: bookmark?.id
            };
          }) || [];

          setSavedArticles(articlesWithBookmarkInfo);
        }
      } catch (err) {
        console.error("Error loading saved articles:", err);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao carregar seus artigos salvos",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadBookmarkedArticles();
  }, [user, navigate, toast]);

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
