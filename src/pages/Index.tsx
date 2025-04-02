
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { ArticleCard } from "@/components/article-card";
import { AnimatedElement } from "@/components/ui/animated-element";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function Index() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 6;
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();

  // Parse page number from URL query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const page = parseInt(searchParams.get('page') || '1');
    setCurrentPage(isNaN(page) || page < 1 ? 1 : page);
  }, [location.search]);

  useEffect(() => {
    // Fetch articles from Supabase with pagination
    const fetchArticles = async () => {
      setIsLoading(true);

      // Calculate pagination range
      const from = (currentPage - 1) * articlesPerPage;
      const to = from + articlesPerPage - 1;

      // First, get total count for pagination
      const { count, error: countError } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error("Error fetching article count:", countError);
      } else {
        setTotalCount(count || 0);
      }
      
      // Then fetch the actual articles for the current page
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          profiles:author_id (username, avatar_url, sector)
        `)
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) {
        console.error("Error fetching articles:", error);
        return;
      }
      
      setArticles(data || []);
      setIsLoading(false);
    };

    fetchArticles();
  }, [currentPage]);

  // Handle page change
  const handlePageChange = (page) => {
    navigate(`/?page=${page}`);
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / articlesPerPage);

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

  // Dividir artigos para o layout
  const featuredArticle = articles[0] || null;
  const regularArticles = articles.slice(1);

  return (
    <main className="min-h-screen bg-black text-white">
      <NavBar />

      {/* Hero Section */}
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

      {/* Articles Section */}
      <section id="articles" className="py-20">
        <div className="container mx-auto px-4">
          <AnimatedElement>
            <h2 className="text-3xl font-bold mb-12 border-b border-zinc-800 pb-4">
              Artigos em destaque
            </h2>
          </AnimatedElement>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              <div className="col-span-full flex justify-center py-20">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-8 w-8 bg-zinc-700 rounded-full"></div>
                  <p className="mt-4 text-zinc-500">Carregando artigos...</p>
                </div>
              </div>
            ) : articles.length > 0 ? (
              <>
                {featuredArticle && (
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
                <p className="text-zinc-400 mb-4">Nenhum artigo publicado ainda.</p>
                <Button 
                  onClick={() => navigate("/criar-artigo")} 
                  className="bg-white text-black hover:bg-zinc-200"
                >
                  Seja o primeiro a publicar
                </Button>
              </div>
            )}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-12">
              <Pagination>
                <PaginationContent>
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(currentPage - 1)} 
                      />
                    </PaginationItem>
                  )}
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === currentPage}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(currentPage + 1)} 
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
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

      {/* Newsletter Section */}
      <section className="py-20 bg-zinc-900">
        <div className="container mx-auto px-4">
          <AnimatedElement className="max-w-xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Fique atualizado</h2>
            <p className="text-zinc-400 mb-8">
              Assine nossa newsletter e receba as melhores análises e notícias sobre o mundo dos negócios.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input 
                type="email" 
                placeholder="seu@email.com" 
                className="flex-1 px-4 py-3 rounded-md bg-zinc-800 border border-zinc-700 focus:outline-none focus:border-white"
              />
              <Button className="bg-white text-black hover:bg-zinc-200 px-6">
                Assinar
              </Button>
            </div>
          </AnimatedElement>
        </div>
      </section>

      <Footer />
    </main>
  );
}
