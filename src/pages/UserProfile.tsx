import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Instagram, Linkedin, Facebook, Youtube } from "lucide-react";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { AnimatedElement } from "@/components/ui/animated-element";
import { Button } from "@/components/ui/button";
import { ArticleCard } from "@/components/article-card";
import { DeleteArticleButton } from "@/components/delete-article-button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ProfileEditForm } from "@/components/profile-edit-form";
import { useToast } from "@/components/ui/use-toast";

export default function UserProfile() {
  const [userArticles, setUserArticles] = useState([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchUserData = async () => {
      try {
        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('username, avatar_url, sector, bio, banner_url, instagram_url, linkedin_url, facebook_url, youtube_url')
          .eq('id', user.id)
          .maybeSingle();
          
        if (profileError) {
          console.error("Erro ao buscar perfil:", profileError);
          toast({
            title: "Erro",
            description: "Não foi possível carregar seus dados de perfil.",
            variant: "destructive",
          });
        } else {
          setUserProfile(profile);
        }
        
        // Fetch followers count
        const { count: followerCount, error: followerError } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('followed_id', user.id);
          
        if (followerError) {
          console.error("Erro ao buscar seguidores:", followerError);
        } else {
          setFollowersCount(followerCount || 0);
        }
        
        // Fetch following count
        const { count: followingCountResult, error: followingError } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', user.id);
          
        if (followingError) {
          console.error("Erro ao buscar seguidos:", followingError);
        } else {
          setFollowingCount(followingCountResult || 0);
        }
        
        // Fetch user articles
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
          toast({
            title: "Erro",
            description: "Não foi possível carregar seus artigos.",
            variant: "destructive",
          });
        } else {
          setUserArticles(articles || []);
        }
      } catch (err) {
        console.error("Exceção ao buscar dados do usuário:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user, navigate, toast]);

  const handleArticleDeleted = async () => {
    // Refetch articles after deletion
    if (user) {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('articles')
          .select(`
            *,
            profiles:author_id (username, avatar_url, sector)
          `)
          .eq('author_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Erro ao buscar artigos:", error);
          toast({
            title: "Erro",
            description: "Não foi possível atualizar a lista de artigos.",
            variant: "destructive",
          });
        } else {
          setUserArticles(data || []);
        }
      } catch (err) {
        console.error("Exceção ao buscar artigos atualizados:", err);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleEditSuccess = () => {
    setIsEditing(false);
    // Refresh user profile data
    if (user) {
      try {
        const fetchProfile = async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('username, avatar_url, sector, bio, banner_url, instagram_url, linkedin_url, facebook_url, youtube_url')
            .eq('id', user.id)
            .maybeSingle();
            
          if (error) {
            console.error("Erro ao atualizar perfil na tela:", error);
          } else {
            setUserProfile(data);
          }
        };
        
        fetchProfile();
      } catch (err) {
        console.error("Exceção ao atualizar perfil na tela:", err);
      }
    }
  };

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
      
      <div className="pt-16 pb-20">
        {!isEditing && userProfile?.banner_url && (
          <div 
            className="w-full h-48 md:h-64 bg-cover bg-center"
            style={{ backgroundImage: `url(${userProfile.banner_url})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black"></div>
          </div>
        )}
        
        <div className="container mx-auto px-4 relative">
          {!isEditing && userProfile?.banner_url && (
            <div className="h-24"></div>
          )}
          
          <AnimatedElement>
            {isEditing ? (
              <div className="mb-12">
                <h1 className="text-3xl font-bold mb-8 border-b border-zinc-800 pb-4">
                  Editar Perfil
                </h1>
                <ProfileEditForm 
                  onCancel={() => setIsEditing(false)} 
                  onSuccess={handleEditSuccess}
                />
              </div>
            ) : (
              <div className={`mb-12 flex flex-col md:flex-row items-center md:items-start gap-6 ${userProfile?.banner_url ? '-mt-16' : 'mt-8'}`}>
                <div className="w-24 h-24 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center text-4xl border-4 border-black">
                  {userProfile?.avatar_url ? (
                    <img 
                      src={userProfile.avatar_url} 
                      alt="Avatar do usuário" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    user?.email?.charAt(0).toUpperCase() || "U"
                  )}
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold mb-2">
                    {userProfile?.username || "Usuário"}
                  </h1>
                  {userProfile?.sector && (
                    <p className="text-zinc-300 mb-2">
                      {userProfile.sector}
                    </p>
                  )}
                  
                  {userProfile?.bio && (
                    <p className="text-zinc-300 mb-4 max-w-2xl">
                      {userProfile.bio}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 my-4">
                    <div className="text-center">
                      <span className="block text-xl font-bold">{followersCount}</span>
                      <span className="text-zinc-400 text-sm">Seguidores</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-xl font-bold">{followingCount}</span>
                      <span className="text-zinc-400 text-sm">Seguindo</span>
                    </div>
                  </div>
                  
                  {/* Social media links */}
                  {(userProfile?.instagram_url || userProfile?.linkedin_url || userProfile?.facebook_url || userProfile?.youtube_url) && (
                    <div className="flex flex-wrap gap-3 mb-4 justify-center md:justify-start">
                      {userProfile?.instagram_url && (
                        <a 
                          href={userProfile.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-400 hover:text-white transition"
                        >
                          <Instagram className="h-5 w-5" />
                          <span className="sr-only">Instagram</span>
                        </a>
                      )}
                      {userProfile?.linkedin_url && (
                        <a 
                          href={userProfile.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-400 hover:text-white transition"
                        >
                          <Linkedin className="h-5 w-5" />
                          <span className="sr-only">LinkedIn</span>
                        </a>
                      )}
                      {userProfile?.facebook_url && (
                        <a 
                          href={userProfile.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-400 hover:text-white transition"
                        >
                          <Facebook className="h-5 w-5" />
                          <span className="sr-only">Facebook</span>
                        </a>
                      )}
                      {userProfile?.youtube_url && (
                        <a 
                          href={userProfile.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-400 hover:text-white transition"
                        >
                          <Youtube className="h-5 w-5" />
                          <span className="sr-only">YouTube</span>
                        </a>
                      )}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
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
                  <div key={article.id} className="relative group">
                    <ArticleCard 
                      id={article.id}
                      title={article.title}
                      excerpt={article.content.substring(0, 100) + '...'}
                      category={article.category}
                      imageUrl={article.image_url}
                      date={new Date(article.created_at).toLocaleDateString('pt-BR')}
                      authorName={article.profiles?.username || 'Você'}
                      authorAvatar={article.profiles?.avatar_url || ''}
                      showActions={true}
                    />
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DeleteArticleButton 
                        articleId={article.id}
                        onDeleted={handleArticleDeleted}
                      />
                    </div>
                  </div>
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
