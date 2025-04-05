
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Instagram, Linkedin, Facebook, Youtube } from "lucide-react";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { AnimatedElement } from "@/components/ui/animated-element";
import { ArticleCard } from "@/components/article-card";
import { UserFollowButton } from "@/components/user-follow-button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function UserView() {
  const { id } = useParams();
  const [userArticles, setUserArticles] = useState([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!id) return;

    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, sector, bio, banner_url, instagram_url, linkedin_url, facebook_url, youtube_url')
          .eq('id', id)
          .maybeSingle();
          
        if (profileError) {
          console.error("Erro ao buscar perfil:", profileError);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os dados deste perfil.",
            variant: "destructive",
          });
        } else if (!profile) {
          toast({
            title: "Usuário não encontrado",
            description: "Este perfil não existe ou foi removido.",
            variant: "destructive",
          });
        } else {
          setUserProfile(profile);
        }
        
        // Get follower count
        const { count: followerCount, error: followerError } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('followed_id', id);
          
        if (followerError) {
          console.error("Erro ao buscar seguidores:", followerError);
        } else {
          setFollowersCount(followerCount || 0);
        }
        
        // Get following count
        const { count: followingCountResult, error: followingError } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', id);
          
        if (followingError) {
          console.error("Erro ao buscar seguidos:", followingError);
        } else {
          setFollowingCount(followingCountResult || 0);
        }
        
        // Get articles by this user
        const { data: articles, error: articlesError } = await supabase
          .from('articles')
          .select(`
            *,
            profiles:author_id (username, avatar_url, sector)
          `)
          .eq('author_id', id)
          .order('created_at', { ascending: false });
        
        if (articlesError) {
          console.error("Erro ao buscar artigos:", articlesError);
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
  }, [id, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <NavBar />
        <div className="pt-24 pb-20 flex justify-center items-center h-[60vh]">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-8 bg-zinc-700 rounded-full"></div>
            <p className="mt-4 text-zinc-500">Carregando perfil...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-black text-white">
        <NavBar />
        <div className="pt-24 pb-20 flex justify-center items-center h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Usuário não encontrado</h1>
            <p className="text-zinc-400">Este perfil não existe ou foi removido.</p>
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
        {userProfile.banner_url && (
          <div 
            className="w-full h-48 md:h-64 bg-cover bg-center"
            style={{ backgroundImage: `url(${userProfile.banner_url})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black"></div>
          </div>
        )}
        
        <div className="container mx-auto px-4 relative">
          {userProfile.banner_url && (
            <div className="h-24"></div>
          )}
          
          <AnimatedElement>
            <div className={`mb-12 flex flex-col md:flex-row items-center md:items-start gap-6 ${userProfile.banner_url ? '-mt-16' : 'mt-8'}`}>
              <div className="w-24 h-24 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center text-4xl border-4 border-black">
                {userProfile.avatar_url ? (
                  <img 
                    src={userProfile.avatar_url} 
                    alt="Avatar do usuário" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  userProfile.username?.charAt(0).toUpperCase() || "U"
                )}
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">
                      {userProfile.username || "Usuário"}
                    </h1>
                    {userProfile.sector && (
                      <p className="text-zinc-300 mb-2">
                        {userProfile.sector}
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-4 md:mt-0">
                    <UserFollowButton 
                      userId={userProfile.id} 
                      username={userProfile.username} 
                    />
                  </div>
                </div>
                
                {userProfile.bio && (
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
                
                {(userProfile.instagram_url || userProfile.linkedin_url || userProfile.facebook_url || userProfile.youtube_url) && (
                  <div className="flex flex-wrap gap-3 mb-4 justify-center md:justify-start">
                    {userProfile.instagram_url && (
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
                    {userProfile.linkedin_url && (
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
                    {userProfile.facebook_url && (
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
                    {userProfile.youtube_url && (
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
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-6 border-b border-zinc-800 pb-4">
              Artigos
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
                    authorName={article.profiles?.username || 'Usuário'}
                    authorAvatar={article.profiles?.avatar_url || ''}
                    authorId={article.author_id}
                    showActions={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-zinc-900/50 rounded-lg">
                <p className="text-zinc-400">Este usuário ainda não publicou nenhum artigo.</p>
              </div>
            )}
          </AnimatedElement>
        </div>
      </div>

      <Footer />
    </div>
  );
}
