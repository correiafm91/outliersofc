
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { ArticleCard } from "@/components/article-card";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  sector: string | null;
  created_at: string;
}

interface Follower {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url: string;
  created_at: string;
  author_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

export default function UserView() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [following, setFollowing] = useState<Follower[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [loadingFollowers, setLoadingFollowers] = useState(true);
  const [loadingFollowing, setLoadingFollowing] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoadingProfile(false);
      }
    };

    const fetchArticles = async () => {
      try {
        setLoadingArticles(true);
        const { data, error } = await supabase
          .from('articles')
          .select(`
            *,
            profiles!author_id (username, avatar_url)
          `)
          .eq('author_id', id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setArticles(data);
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setLoadingArticles(false);
      }
    };

    fetchProfile();
    fetchArticles();
  }, [id]);

  const fetchFollowers = async () => {
    try {
      setLoadingFollowers(true);
      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower_id,
          profiles:follower_id (id, username, avatar_url)
        `)
        .eq('followed_id', id);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const followersList: Follower[] = data.map(row => ({
          id: row.profiles?.id || '',
          username: row.profiles?.username || '',
          avatar_url: row.profiles?.avatar_url || null
        }));
        setFollowers(followersList);
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setLoadingFollowers(false);
    }
  };

  const fetchFollowing = async () => {
    try {
      setLoadingFollowing(true);
      const { data, error } = await supabase
        .from('follows')
        .select(`
          followed_id,
          profiles:followed_id (id, username, avatar_url)
        `)
        .eq('follower_id', id);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const followingList: Follower[] = data.map(row => ({
          id: row.profiles?.id || '',
          username: row.profiles?.username || '',
          avatar_url: row.profiles?.avatar_url || null
        }));
        setFollowing(followingList);
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setLoadingFollowing(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchFollowers();
      fetchFollowing();
    }
  }, [id]);

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />
      <div className="container mx-auto py-8">
        <Card className="w-full max-w-3xl mx-auto bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar>
                {loadingProfile ? (
                  <Skeleton className="h-12 w-12 rounded-full" />
                ) : profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile.username} />
                ) : (
                  <AvatarFallback>{profile?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-col">
                <CardTitle>{loadingProfile ? <Skeleton className="h-5 w-40" /> : profile?.username}</CardTitle>
                <CardDescription>{loadingProfile ? <Skeleton className="h-4 w-60" /> : profile?.sector || 'Sem informações'}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Separator className="bg-zinc-700" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{loadingFollowers ? <Skeleton className="h-6 w-10 mx-auto" /> : followers.length}</div>
                <div className="text-sm text-zinc-400">Seguidores</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{loadingFollowing ? <Skeleton className="h-6 w-10 mx-auto" /> : following.length}</div>
                <div className="text-sm text-zinc-400">Seguindo</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{loadingArticles ? <Skeleton className="h-6 w-10 mx-auto" /> : articles.length}</div>
                <div className="text-sm text-zinc-400">Artigos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="py-12">
          <h2 className="text-2xl font-bold mb-8 border-b border-zinc-800 pb-4">Artigos de {profile?.username}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loadingArticles ? (
              <div className="col-span-full flex justify-center py-20">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-8 w-8 bg-zinc-700 rounded-full"></div>
                  <p className="mt-4 text-zinc-500">Carregando artigos...</p>
                </div>
              </div>
            ) : articles.length > 0 ? (
              articles.map((article) => (
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
                  authorId={article.author_id}
                  showActions={false}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-zinc-400">Nenhum artigo publicado por este usuário ainda.</p>
              </div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
