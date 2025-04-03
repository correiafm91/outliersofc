import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { ArticleCard } from "@/components/article-card";
import { AnimatedElement } from "@/components/ui/animated-element";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Index() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const articlesPerPage = 6;
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const loadArticles = useCallback(async (reset = false) => {
    if (isLoading && !reset) return;
    
    const currentPage = reset ? 0 : page;
    setIsLoading(true);

    const from = currentPage * articlesPerPage;
    const to = from + articlesPerPage - 1;

    try {
      let query = supabase
        .from('articles')
        .select(`
          *,
          profiles:author_id (username, avatar_url, sector)
        `)
        .order('created_at', { ascending: false })
        .range(from, to);
        
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }
        
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data.length < articlesPerPage) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      
      if (reset || currentPage === 0) {
        setArticles(data || []);
      } else {
        setArticles(prev => [...prev, ...(data || [])]);
      }
      
      setPage(currentPage + 1);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [page, articlesPerPage, searchTerm, isLoading]);

  useEffect(() => {
    loadArticles(true);
  }, []);

  useEffect(() => {
    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        loadArticles();
      }
    });

    if (loadMoreRef.current) {
      observer.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [hasMore, isLoading, loadArticles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    loadArticles(true);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setIsSearching(true);
    loadArticles(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-zinc-700 rounded-full"></div>
          <p className="mt-4 text-zinc-500">Carregando...</p>
        </div>
      </div>
    );
  }

  const featuredArticle = articles[0] || null;
  const regularArticles = articles.slice(1);

  return (
    <main className="min-h-screen bg-black text-white">
      <NavBar />
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
            alt="Business skyline" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <AnimatedElement className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Outliers
            </h1>
            <p className="text-xl md:text-2xl text-zinc-300 mb-8">
              Perspectivas inovadoras sobre o mundo dos negócios
            </p>
            <Button asChild size="lg" className="bg-white text-black hover:bg-zinc-200 rounded-full px-8">
              <a href="#articles">Explorar artigos</a>
            </Button>
          </AnimatedElement>
        </div>
      </section>
      <section className="py-8 border-b border-zinc-800">
        <div className="container mx-auto px-4">
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar artigos ou autores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-900 border-zinc-700"
              />
            </div>
            <Button type="submit" disabled={isSearching} className="bg-white text-black hover:bg-zinc-200">
              Buscar
            </Button>
            {searchTerm && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={clearSearch}
                className="border-zinc-700"
              >
                Limpar
              </Button>
            )}
          </form>
        </div>
      </section>
      <section id="articles" className="py-20">
        <div className="container mx-auto px-4">
          <AnimatedElement>
            <h2 className="text-3xl font-bold mb-12 border-b border-zinc-800 pb-4">
              {searchTerm ? `Resultados para "${searchTerm}"` : "Artigos em destaque"}
            </h2>
          </AnimatedElement>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading && articles.length === 0 ? (
              <div className="col-span-full flex justify-center py-20">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-8 w-8 bg-zinc-700 rounded-full"></div>
                  <p className="mt-4 text-zinc-500">Carregando artigos...</p>
                </div>
              </div>
            ) : articles.length > 0 ? (
              <>
                {featuredArticle && !searchTerm && (
                  <ArticleCard 
                    id={featuredArticle.id}
                    title={featuredArticle.title}
                    excerpt={featuredArticle.content.substring(0, 150) + '...'}
                    category={featuredArticle.category}
                    imageUrl={featuredArticle.image_url}
                    date={new Date(featuredArticle.created_at).toLocaleDateString('pt-BR')}
                    authorName={featuredArticle.profiles?.username || 'Autor desconhecido'}
                    authorAvatar={featuredArticle.profiles?.avatar_url || ''}
                    featured={true} 
                    className="mb-8 col-span-full" 
                  />
                )}
                {regularArticles.map((article) => (
                  <ArticleCard 
                    key={article.id}
                    id={article.id}
                    title={article.title}
                    excerpt={article.content.substring(0, 100) + '...'}
                    category={article.category}
                    imageUrl={article.image_url}
                    date={new Date(article.created_at).toLocaleDateString('pt-BR')}
                    authorName={article.profiles?.username || 'Autor desconhecido'}
                    authorAvatar={article.profiles?.avatar_url || ''}
                  />
                ))}
              </>
            ) : (
              <div className="col-span-full text-center py-12">
                {searchTerm ? (
                  <>
                    <p className="text-zinc-400 mb-4">Nenhum resultado encontrado para "{searchTerm}".</p>
                    <Button 
                      onClick={clearSearch} 
                      className="bg-white text-black hover:bg-zinc-200"
                    >
                      Limpar busca
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-zinc-400 mb-4">Nenhum artigo publicado ainda.</p>
                    <Button 
                      onClick={() => navigate("/criar-artigo")} 
                      className="bg-white text-black hover:bg-zinc-200"
                    >
                      Seja o primeiro a publicar
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
          {hasMore && articles.length > 0 && (
            <div 
              ref={loadMoreRef} 
              className="flex justify-center mt-12"
            >
              {isLoading && (
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-8 w-8 bg-zinc-700 rounded-full"></div>
                  <p className="mt-4 text-zinc-500">Carregando mais artigos...</p>
                </div>
              )}
            </div>
          )}
          {articles.length > 0 && (
            <div className="mt-8 text-center">
              <Button 
                onClick={() => navigate("/criar-artigo")} 
                className="bg-white text-black hover:bg-zinc-200"
              >
                Criar artigo
              </Button>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
