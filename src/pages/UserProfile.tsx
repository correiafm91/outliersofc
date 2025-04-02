
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { AnimatedElement } from "@/components/ui/animated-element";
import { Button } from "@/components/ui/button";
import { ArticleCard } from "@/components/article-card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ProfileEditForm } from "@/components/profile-edit-form";

export default function UserProfile() {
  const [userArticles, setUserArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchUserData = async () => {
      // Buscar artigos do usuário
      const { data: articles, error } = await supabase
        .from('articles')
        .select(`
          *,
          profiles:author_id (username, avatar_url, sector)
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Erro ao buscar artigos:", error);
      } else {
        setUserArticles(articles || []);
      }
      
      setIsLoading(false);
    };

    fetchUserData();
  }, [user, navigate]);

  if (!user) return null;
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <NavBar />
        <div className="pt-24 pb-20 flex justify-center items-center h-[60vh]">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-8 bg-zinc-700 rounded-full"></div>
            <p className="mt-4 text-zinc-500">Carregando...</p>
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
            {isEditing ? (
              <div className="mb-12">
                <h1 className="text-3xl font-bold mb-8 border-b border-zinc-800 pb-4">
                  Editar Perfil
                </h1>
                <ProfileEditForm 
                  onCancel={() => setIsEditing(false)} 
                  onSuccess={() => setIsEditing(false)}
                />
              </div>
            ) : (
              <div className="mb-12 flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center text-4xl">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
                
                <div className="text-center md:text-left">
                  <h1 className="text-3xl font-bold mb-2">
                    {user?.email?.split('@')[0] || "Usuário"}
                  </h1>
                  <p className="text-zinc-400 mb-4">
                    {user?.email || ""}
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    <Button 
                      onClick={() => navigate("/criar-artigo")} 
                      className="bg-white text-black hover:bg-zinc-200"
                    >
                      Novo artigo
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(true)}
                      className="border-zinc-700 hover:bg-zinc-800"
                    >
                      Editar perfil
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <h2 className="text-2xl font-bold mb-6 border-b border-zinc-800 pb-4">
              Seus artigos
            </h2>
            
            {userArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userArticles.map((article) => (
                  <ArticleCard 
                    key={article.id}
                    id={article.id}
                    title={article.title}
                    excerpt={article.content.substring(0, 100) + '...'}
                    category={article.category}
                    imageUrl={article.image_url}
                    date={new Date(article.created_at).toLocaleDateString('pt-BR')}
                    authorName={article.profiles?.username || 'Você'}
                    authorAvatar={article.profiles?.avatar_url || ''}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-zinc-900/50 rounded-lg">
                <p className="text-zinc-400 mb-4">Você ainda não publicou nenhum artigo.</p>
                <Button 
                  onClick={() => navigate("/criar-artigo")} 
                  className="bg-white text-black hover:bg-zinc-200"
                >
                  Criar meu primeiro artigo
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
