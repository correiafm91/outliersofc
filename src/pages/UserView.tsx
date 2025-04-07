import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserFollowButton } from "@/components/user-follow-button";
import { ArticleCard } from "@/components/article-card";
import { supabase, getFollowers, getFollowing } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, Instagram, Linkedin, Facebook, Youtube, Twitter } from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  sector: string | null;
  banner_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  twitter_url: string | null;
}

interface Article {
  id: string;
  title: string;
  created_at: string;
  content: string;
  image_url: string | null;
  category: string;
}

interface UserData {
  id: string;
  username: string;
  avatar_url: string | null;
}

export default function UserView() {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [followers, setFollowers] = useState<UserData[]>([]);
  const [following, setFollowing] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (id) {
      fetchUserProfile();
      fetchUserArticles();
      fetchFollowData();
    }
  }, [id]);

  useEffect(() => {
    if (profile?.username === "Outliers Oficial") {
      setIsVerified(true);
    }
  }, [profile]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchUserArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('author_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setArticles(data || []);
    } catch (error) {
      console.error("Error fetching user articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowData = async () => {
    if (!id) return;
    
    try {
      const followerData = await getFollowers(id);
      const followingData = await getFollowing(id);
      
      setFollowers(followerData);
      setFollowing(followingData);
    } catch (error) {
      console.error("Error fetching follow data:", error);
    }
  };

  const renderSocialLink = (url: string | null, Icon: React.ComponentType) => {
    if (!url) return null;
    
    return (
      <Button variant="ghost" size="icon" asChild>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Icon className="h-4 w-4" />
        </a>
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        {profile ? (
          <div className="space-y-6">
            {/* Banner */}
            {profile.banner_url && (
              <div className="relative w-full h-64 rounded-md overflow-hidden">
                <img
                  src={profile.banner_url}
                  alt="Banner"
                  className="object-cover w-full h-full"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile.avatar_url} alt={profile.username} className="object-cover" />
                  <AvatarFallback className="bg-zinc-800 text-zinc-200">
                    {profile.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">{profile.username}</h2>
                    {isVerified && (
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <p className="text-zinc-400">{profile.sector || 'Setor não especificado'}</p>
                </div>
              </div>
              {user && user.id !== id && (
                <UserFollowButton targetUserId={id || ''} />
              )}
            </div>

            <div className="flex gap-2">
              {renderSocialLink(profile.instagram_url, Instagram)}
              {renderSocialLink(profile.linkedin_url, Linkedin)}
              {renderSocialLink(profile.facebook_url, Facebook)}
              {renderSocialLink(profile.youtube_url, Youtube)}
              {renderSocialLink(profile.twitter_url, Twitter)}
            </div>

            {profile.bio && (
              <div className="bg-zinc-900/30 rounded-md p-4">
                <p className="text-zinc-200">{profile.bio}</p>
              </div>
            )}

            <Tabs defaultValue="articles" className="w-full">
              <TabsList>
                <TabsTrigger value="articles">Artigos</TabsTrigger>
                <TabsTrigger value="followers">Seguidores ({followers.length})</TabsTrigger>
                <TabsTrigger value="following">Seguindo ({following.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="articles" className="pt-4">
                {loading ? (
                  <p className="text-zinc-500">Carregando artigos...</p>
                ) : articles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {articles.map(article => (
                      <ArticleCard
                        key={article.id}
                        id={article.id}
                        title={article.title}
                        imageUrl={article.image_url}
                        createdAt={article.created_at}
                        content={article.content}
                        category={article.category}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-400">Nenhum artigo publicado ainda.</p>
                )}
              </TabsContent>
              <TabsContent value="followers" className="pt-4">
                {followers.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {followers.map(follower => (
                      <Link key={follower.id} to={`/user/${follower.id}`} className="flex items-center gap-4 hover:bg-zinc-900/30 rounded-md p-2 transition-colors">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={follower.avatar_url || undefined} alt={follower.username} className="object-cover" />
                          <AvatarFallback className="bg-zinc-800 text-zinc-200">
                            {follower.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{follower.username}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-400">Este usuário não tem seguidores.</p>
                )}
              </TabsContent>
              <TabsContent value="following" className="pt-4">
                {following.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {following.map(followed => (
                      <Link key={followed.id} to={`/user/${followed.id}`} className="flex items-center gap-4 hover:bg-zinc-900/30 rounded-md p-2 transition-colors">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={followed.avatar_url || undefined} alt={followed.username} className="object-cover" />
                          <AvatarFallback className="bg-zinc-800 text-zinc-200">
                            {followed.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{followed.username}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-400">Este usuário não segue ninguém.</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <p className="text-zinc-400">Carregando perfil...</p>
        )}
      </div>
      <Footer />
    </div>
  );
}
