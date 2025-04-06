
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Edit, CheckCircle } from "lucide-react";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { CommentSection } from "@/components/comment-section";
import { LikeButton } from "@/components/like-button";
import { BookmarkButton } from "@/components/bookmark-button";
import { ShareButton } from "@/components/share-button";
import { DeleteArticleButton } from "@/components/delete-article-button";
import { UserFollowButton } from "@/components/user-follow-button";
import { AnimatedElement } from "@/components/ui/animated-element";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ArticleData {
  id: string;
  title: string;
  content: string;
  category: string;
  imageUrl: string;
  date: string;
  created_at: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    sector: string;
    isVerified?: boolean;
  };
  stats: {
    likeCount: number;
    commentCount: number;
    shareCount: number;
  };
}

export default function ArticleDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAuthor = user && article && user.id === article.author.id;

  useEffect(() => {
    // Set current URL for sharing
    setCurrentUrl(window.location.href);

    // Fetch article data
    const fetchArticle = async () => {
      if (!id) return;
      
      setIsLoading(true);

      try {
        // Get article data
        const { data: articleData, error: articleError } = await supabase
          .from('articles')
          .select(`
            id, 
            title, 
            content, 
            category, 
            image_url, 
            created_at,
            author_id,
            profiles:author_id (
              id, 
              username, 
              avatar_url,
              sector
            )
          `)
          .eq('id', id)
          .single();

        if (articleError) throw articleError;

        if (!articleData) {
          navigate("/not-found");
          return;
        }

        // Get like count
        const { count: likeCount, error: likeError } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('article_id', id);

        if (likeError) throw likeError;

        // Get comment count
        const { count: commentCount, error: commentError } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('article_id', id);

        if (commentError) throw commentError;

        // Check if author is verified (Outliers Oficial)
        const isVerified = articleData.profiles.username === "Outliers Oficial";

        // Format article data
        const formattedArticle: ArticleData = {
          id: articleData.id,
          title: articleData.title,
          content: articleData.content,
          category: articleData.category,
          imageUrl: articleData.image_url,
          date: new Date(articleData.created_at).toLocaleDateString('pt-BR'),
          created_at: articleData.created_at,
          author: {
            id: articleData.profiles.id,
            name: articleData.profiles.username,
            avatar: articleData.profiles.avatar_url,
            sector: articleData.profiles.sector || "",
            isVerified: isVerified
          },
          stats: {
            likeCount: likeCount || 0,
            commentCount: commentCount || 0,
            shareCount: 0 // We don't track shares in the database yet
          }
        };

        setArticle(formattedArticle);
      } catch (error) {
        console.error("Error fetching article:", error);
        navigate("/not-found");
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [id, navigate]);

  // Function to reveal elements as user scrolls
  useEffect(() => {
    const handleScroll = () => {
      const reveals = document.querySelectorAll('.reveal');
      
      reveals.forEach((element) => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
          element.classList.add('active');
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Reveal visible elements on initial load
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [article]);

  return (
    <main className="min-h-screen bg-black text-white">
      <NavBar />

      {isLoading ? (
        <div className="container mx-auto px-4 pt-32 pb-20 flex justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-8 bg-zinc-700 rounded-full"></div>
            <p className="mt-4 text-zinc-500">Carregando artigo...</p>
          </div>
        </div>
      ) : article ? (
        <>
          {/* Hero Section */}
          <section className="pt-24 pb-8">
            <div className="container mx-auto px-4">
              <AnimatedElement>
                <div className="flex items-center space-x-2 text-zinc-400 text-sm mb-4">
                  <span>{article.category}</span>
                  <span>•</span>
                  <span>{article.date}</span>
                </div>
              </AnimatedElement>
              
              <AnimatedElement className="animate-delay-100">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-4xl">
                  {article.title}
                </h1>
              </AnimatedElement>
              
              <AnimatedElement className="animate-delay-200">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="relative">
                    <Link to={`/user/${article.author.id}`}>
                      {article.author.avatar ? (
                        <img 
                          src={article.author.avatar} 
                          alt={article.author.name} 
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 text-lg font-medium">
                          {article.author.name.charAt(0)}
                        </div>
                      )}
                    </Link>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link to={`/user/${article.author.id}`} className="font-medium hover:underline">{article.author.name}</Link>
                      {article.author.isVerified && (
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="text-zinc-400 text-sm">
                      {article.author.sector || "Autor"}
                    </div>
                  </div>
                  
                  {user && user.id !== article.author.id && (
                    <UserFollowButton 
                      userId={article.author.id} 
                      username={article.author.name} 
                    />
                  )}

                  {isAuthor && (
                    <div className="flex gap-2">
                      <Link to={`/edit-article/${article.id}`}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-blue-500 border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/30"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      </Link>
                      <DeleteArticleButton articleId={article.id} redirectTo="/" />
                    </div>
                  )}
                </div>
              </AnimatedElement>

              <AnimatedElement className="flex flex-wrap items-center gap-2 mb-8 text-sm">
                <div className="flex items-center text-zinc-400">
                  <span className="mr-5">
                    <span className="font-medium text-white">{article.stats.likeCount}</span> curtidas
                  </span>
                  <span className="mr-5">
                    <span className="font-medium text-white">{article.stats.commentCount}</span> comentários
                  </span>
                </div>
              </AnimatedElement>
            </div>
          </section>
          
          {/* Featured Image */}
          <section className="mb-12">
            <div className="container mx-auto px-4">
              <AnimatedElement className="animate-delay-300">
                <div className="w-full">
                  <img 
                    src={article.imageUrl} 
                    alt={article.title} 
                    className="w-full object-contain max-h-[80vh]"
                    loading="lazy"
                  />
                </div>
              </AnimatedElement>
            </div>
          </section>
          
          {/* Article Content */}
          <section className="pb-12">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-12 gap-8">
                {/* Social sharing sidebar */}
                <aside className="hidden lg:block col-span-1">
                  <div className="sticky top-32 flex flex-col space-y-4 items-center">
                    <LikeButton articleId={article.id} />
                    <BookmarkButton 
                      articleId={article.id} 
                      className="md:scale-110" 
                    />
                    <ShareButton 
                      articleTitle={article.title}
                      articleUrl={currentUrl}
                      variant="icon"
                    />
                  </div>
                </aside>
                
                {/* Main content */}
                <article className="col-span-12 lg:col-span-8 space-y-6 text-lg leading-relaxed">
                  <div 
                    className="article-content prose prose-invert prose-zinc max-w-none" 
                    dangerouslySetInnerHTML={{ __html: article.content }}
                  />
                  
                  {/* Mobile social bar */}
                  <div className="lg:hidden flex justify-center items-center gap-4 my-8">
                    <LikeButton articleId={article.id} />
                    <BookmarkButton 
                      articleId={article.id} 
                    />
                    <ShareButton 
                      articleTitle={article.title}
                      articleUrl={currentUrl}
                      variant="button"
                    />
                  </div>
                  
                  <Separator className="my-8 bg-zinc-800" />
                  
                  {/* Comments Section */}
                  <CommentSection articleId={article.id} />
                </article>
                
                {/* Sidebar/Related Content */}
                <aside className="hidden lg:block col-span-3">
                  <div className="sticky top-32 space-y-8">
                    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
                      <h3 className="text-xl font-bold mb-4">Artigos relacionados</h3>
                      <RelatedArticles 
                        category={article.category} 
                        currentArticleId={article.id}
                      />
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </section>
        </>
      ) : null}

      <Footer />
    </main>
  );
}

// Related articles component
function RelatedArticles({ category, currentArticleId }: { category: string, currentArticleId: string }) {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchRelatedArticles = async () => {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          image_url,
          created_at
        `)
        .eq('category', category)
        .neq('id', currentArticleId)
        .order('created_at', { ascending: false })
        .limit(3);
        
      if (error) {
        console.error("Error fetching related articles:", error);
      } else {
        setArticles(data || []);
      }
      
      setIsLoading(false);
    };
    
    fetchRelatedArticles();
  }, [category, currentArticleId]);
  
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="w-16 h-16 bg-zinc-800 rounded-md flex-shrink-0"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-zinc-800 rounded w-full"></div>
              <div className="h-3 bg-zinc-800 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (articles.length === 0) {
    return <p className="text-zinc-500 text-sm">Nenhum artigo relacionado encontrado.</p>;
  }
  
  return (
    <ul className="space-y-4">
      {articles.map((article) => (
        <li key={article.id} className="group">
          <a 
            href={`/article/${article.id}`} 
            className="flex gap-3 items-start"
          >
            <img 
              src={article.image_url} 
              alt={article.title} 
              className="w-16 h-16 object-cover rounded-md flex-shrink-0"
            />
            <div>
              <h4 className="font-medium group-hover:text-white transition-colors line-clamp-2">
                {article.title}
              </h4>
              <p className="text-xs text-zinc-400">
                {new Date(article.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}
