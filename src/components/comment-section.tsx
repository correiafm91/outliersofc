
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    isVerified: boolean;
  };
}

interface CommentSectionProps {
  articleId: string;
}

export function CommentSection({ articleId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load existing comments
  useEffect(() => {
    if (!articleId) return;
    
    const fetchComments = async () => {
      setIsFetching(true);
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          profiles:user_id (
            id,
            username,
            avatar_url,
            is_verified
          )
        `)
        .eq('article_id', articleId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching comments:", error);
      } else if (data) {
        const formattedComments = data.map(comment => ({
          id: comment.id,
          text: comment.content,
          createdAt: comment.created_at,
          user: {
            id: comment.profiles.id,
            name: comment.profiles.username,
            avatar: comment.profiles.avatar_url,
            isVerified: comment.profiles.is_verified || false
          }
        }));
        
        setComments(formattedComments);
      }
      
      setIsFetching(false);
    };
    
    fetchComments();
    
    // Subscribe to realtime comments
    const channel = supabase
      .channel('public:comments')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'comments',
          filter: `article_id=eq.${articleId}`
        }, 
        (payload) => {
          // Refetch comments when a new one is added
          fetchComments();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [articleId]);

  // Fetch user profile if logged in
  useEffect(() => {
    if (!user) return;
    
    const fetchUserProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error("Error fetching user profile:", error);
      } else if (data) {
        setUserName(data.username);
        setUserAvatar(data.avatar_url || "");
      }
    };
    
    fetchUserProfile();
  }, [user]);

  // Verificar se o usuário já tem perfil salvo
  useEffect(() => {
    const storedProfile = localStorage.getItem("commentProfile");
    if (storedProfile && !user) {
      const profile = JSON.parse(storedProfile);
      setUserName(profile.name);
      setUserAvatar(profile.avatar);
    }
  }, [user]);

  const handleProfileSubmit = () => {
    if (!userName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira seu nome para continuar.",
        variant: "destructive",
      });
      return;
    }
    
    // Salvar perfil no localStorage para usuários não logados
    if (!user) {
      const profile = { name: userName, avatar: userAvatar };
      localStorage.setItem("commentProfile", JSON.stringify(profile));
    }
    
    setIsDialogOpen(false);
    toast({
      title: "Perfil salvo!",
      description: "Agora você pode fazer comentários.",
    });
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;
    
    if (!user && !userName) {
      setIsDialogOpen(true);
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (user) {
        // Insert comment in database for logged in users
        const { error } = await supabase
          .from('comments')
          .insert({
            article_id: articleId,
            user_id: user.id,
            content: newComment
          });
          
        if (error) throw error;
        
        // Check if we need to send a notification to the article author
        const { data: articleData } = await supabase
          .from('articles')
          .select('author_id')
          .eq('id', articleId)
          .single();
          
        if (articleData && articleData.author_id !== user.id) {
          // Create notification for article author
          await supabase
            .from('notifications')
            .insert({
              user_id: articleData.author_id,
              actor_id: user.id,
              article_id: articleId,
              type: 'comment'
            });
        }
      } else {
        // Handle comments from non-logged in users (store in localStorage)
        const guestComment = {
          id: Date.now().toString(),
          text: newComment,
          createdAt: new Date().toISOString(),
          user: {
            id: 'guest',
            name: userName,
            avatar: userAvatar,
            isVerified: false
          }
        };
        
        setComments(prev => [guestComment, ...prev]);
      }
      
      setNewComment("");
      
      toast({
        title: "Comentário publicado!",
        description: "Seu comentário foi adicionado com sucesso.",
      });
    } catch (error) {
      console.error("Error posting comment:", error);
      toast({
        title: "Erro",
        description: "Não foi possível publicar seu comentário.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="mt-12 py-8 border-t border-zinc-800">
      <h3 className="text-2xl font-bold mb-6">Comentários ({comments.length})</h3>
      
      {/* Form para novos comentários */}
      <div className="mb-8">
        <Textarea
          placeholder="Deixe seu comentário..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="bg-zinc-900 border-zinc-700 min-h-[100px] mb-3"
        />
        <Button 
          onClick={handleCommentSubmit}
          disabled={isLoading}
          className="bg-white text-black hover:bg-zinc-200"
        >
          {isLoading ? "Publicando..." : "Publicar comentário"}
        </Button>
      </div>

      {/* Lista de comentários */}
      {isFetching ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-zinc-800"></div>
                <div className="flex-1">
                  <div className="h-4 w-28 bg-zinc-800 rounded mb-2"></div>
                  <div className="h-3 w-full bg-zinc-800 rounded mb-1"></div>
                  <div className="h-3 w-2/3 bg-zinc-800 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="p-8 text-center rounded-lg bg-zinc-900 border border-zinc-800">
          <p className="text-zinc-400">Seja o primeiro a comentar neste artigo.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 animate-fade-in">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 border border-zinc-700">
                  <AvatarImage src={comment.user.avatar} />
                  <AvatarFallback className="bg-zinc-800 text-zinc-400">
                    {comment.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{comment.user.name}</h4>
                      {comment.user.isVerified && (
                        <Badge variant="outline" className="text-xs font-normal py-0 px-1 h-4 border-white/20">
                          <span className="sr-only">Verificado</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-zinc-300">{comment.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog para criar perfil */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-xl mb-4">Criar seu perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Seu nome</label>
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Digite seu nome"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">URL da sua foto (opcional)</label>
              <Input
                value={userAvatar}
                onChange={(e) => setUserAvatar(e.target.value)}
                placeholder="https://exemplo.com/sua-foto.jpg"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <Button 
              onClick={handleProfileSubmit}
              className="w-full bg-white text-black hover:bg-zinc-200"
            >
              Salvar perfil
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
