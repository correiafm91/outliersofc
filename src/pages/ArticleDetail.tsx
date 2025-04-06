
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { CalendarIcon, User2Icon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BookmarkButton } from "@/components/bookmark-button";
import { EditButton } from "@/components/edit-button";
import { DeleteArticleButton } from "@/components/delete-article-button";
import { useAuth } from "@/contexts/AuthContext";

interface Author {
  id: string;
  username: string;
  avatar_url: string;
  sector: string;
}

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url: string;
  created_at: string;
  author_id: string;
  author: Author;
}

export default function ArticleDetail() {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id, navigate]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          content,
          category,
          image_url, 
          created_at,
          author_id,
          profiles!author_id (id, username, avatar_url, sector)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        const articleWithProfile = {
          ...data,
          author: {
            id: data.profiles?.id || '',
            username: data.profiles?.username || '',
            avatar_url: data.profiles?.avatar_url || '',
            sector: data.profiles?.sector || ''
          }
        };
        setArticle(articleWithProfile);
      }
    } catch (error) {
      console.error("Error fetching article:", error);
      navigate("/404");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-zinc-700 rounded-full"></div>
          <p className="mt-4 text-zinc-500">Carregando artigo...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-black text-white">
        <NavBar />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-bold mb-4">Artigo não encontrado</h1>
          <p className="text-zinc-400">O artigo que você está procurando não existe ou foi removido.</p>
          <Button onClick={() => navigate("/")} className="mt-8 bg-white text-black hover:bg-zinc-200">
            Voltar para a página inicial
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />
      <div className="container mx-auto px-4 py-16">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">{article.title}</h1>
            <div className="flex items-center gap-4 text-zinc-500">
              <div className="flex items-center gap-2">
                <User2Icon className="h-4 w-4" />
                <a href={`/user/${article.author.id}`} className="hover:underline">
                  {article.author.username}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {new Date(article.created_at).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {user?.id === article.author_id && (
              <>
                <EditButton articleId={article.id} />
                <DeleteArticleButton articleId={article.id} redirectTo="/" />
              </>
            )}
            <BookmarkButton articleId={article.id} />
          </div>
        </div>
        <img
          src={article.image_url}
          alt={article.title}
          className="w-full rounded-lg mb-8 object-cover max-h-[400px]"
        />
        <div className="prose prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>
      </div>
      <Footer />
    </div>
  );
}
