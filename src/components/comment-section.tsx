
import { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { CommentItem } from "@/components/comment-item";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CommentSectionProps {
  articleId: string;
}

interface CommentProfile {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface CommentData {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  article_id: string;
  profiles?: CommentProfile;
}

export function CommentSection({ articleId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (articleId) {
      fetchComments();
    }
  }, [articleId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      // First, get all comments for this article
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('article_id', articleId)
        .order('created_at', { ascending: false });
      
      if (commentsError) {
        console.error('Erro ao carregar comentários:', commentsError);
        return;
      }
      
      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        setIsLoading(false);
        return;
      }
      
      // Then fetch profile data for each comment
      const commentsWithProfiles = await Promise.all(
        commentsData.map(async (comment) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', comment.user_id)
            .single();
            
          return {
            ...comment,
            profiles: profileData || {
              id: comment.user_id,
              username: 'Usuário',
              avatar_url: null
            }
          };
        })
      );
      
      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa fazer login para comentar",
        variant: "destructive",
      });
      return;
    }

    if (!commentText.trim()) {
      toast({
        title: "Comentário vazio",
        description: "Por favor, escreva algo para comentar",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const commentId = crypto.randomUUID();
      
      // Add comment to the database
      const { error } = await supabase
        .from('comments')
        .insert([
          { 
            id: commentId,
            article_id: articleId, 
            content: commentText.trim(),
            user_id: user.id
          }
        ]);
      
      if (error) throw error;
      
      // Get profile data for the current user
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', user.id)
        .single();
      
      // Add notification for the article author
      const { data: article } = await supabase
        .from('articles')
        .select('author_id')
        .eq('id', articleId)
        .single();
      
      if (article && article.author_id !== user.id) {
        await supabase
          .from('notifications')
          .insert([
            {
              id: crypto.randomUUID(),
              user_id: article.author_id,
              actor_id: user.id,
              article_id: articleId,
              type: 'comment',
              is_read: false
            }
          ]);
      }
      
      // Add the new comment to the state
      const newComment: CommentData = {
        id: commentId,
        content: commentText.trim(),
        created_at: new Date().toISOString(),
        user_id: user.id,
        article_id: articleId,
        profiles: profileData || {
          id: user.id,
          username: user.email?.split('@')[0] || 'Usuário',
          avatar_url: null
        }
      };
      
      setComments(prevComments => [newComment, ...prevComments]);
      setCommentText("");
      
      toast({
        title: "Comentário publicado",
        description: "Seu comentário foi adicionado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível publicar seu comentário",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentDelete = (deletedCommentId: string) => {
    setComments(prevComments => 
      prevComments.filter(comment => comment.id !== deletedCommentId)
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Comentários</h3>
      
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.user_metadata?.avatar_url || undefined} />
              <AvatarFallback>{user.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            
            <Textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Escreva um comentário..."
              className="flex-1 bg-zinc-900 border-zinc-700 focus-visible:ring-zinc-500"
            />
          </div>
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting || !commentText.trim()}
              className="bg-white text-black hover:bg-zinc-200"
            >
              {isSubmitting ? "Publicando..." : "Publicar comentário"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-zinc-900/50 p-4 rounded-md text-center">
          <p className="text-zinc-400 mb-2">Faça login para deixar um comentário</p>
          <Button 
            variant="outline"
            onClick={() => window.location.href = "/auth"}
            className="border-zinc-700 hover:bg-zinc-800"
          >
            Entrar / Cadastrar
          </Button>
        </div>
      )}
      
      <div className="space-y-2 divide-y divide-zinc-800">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3 py-4">
                <div className="h-10 w-10 rounded-full bg-zinc-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-zinc-800 rounded w-1/4" />
                  <div className="h-4 bg-zinc-800 rounded w-3/4" />
                  <div className="h-4 bg-zinc-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length > 0 ? (
          comments.map(comment => (
            <CommentItem 
              key={comment.id}
              id={comment.id}
              text={comment.content}
              createdAt={comment.created_at}
              userId={comment.user_id}
              user={{
                id: comment.profiles?.id || comment.user_id,
                name: comment.profiles?.username || "Usuário",
                avatar: comment.profiles?.avatar_url || ""
              }}
              onDeleted={() => handleCommentDelete(comment.id)}
            />
          ))
        ) : (
          <div className="py-4 text-center">
            <p className="text-zinc-400">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
          </div>
        )}
      </div>
    </div>
  );
}
