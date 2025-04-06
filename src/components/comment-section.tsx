
import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
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
  parent_id: string | null;
  mention_user_id: string | null;
  profiles?: CommentProfile;
  reply_to?: string | null;
}

export function CommentSection({ articleId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [mentionedUsers, setMentionedUsers] = useState<CommentProfile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (articleId) {
      fetchComments();
      fetchArticleAuthor();
    }
  }, [articleId]);

  // Set up real-time updates for comments
  useEffect(() => {
    if (!articleId) return;

    const channel = supabase
      .channel(`article-comments-${articleId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'comments',
          filter: `article_id=eq.${articleId}` 
        }, 
        async (payload) => {
          // When a new comment is added, fetch its profile info
          const newComment = payload.new as CommentData;
          
          // Get profile data for the commenter
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', newComment.user_id)
            .single();
            
          // Add the new comment to the state with profile data
          if (newComment.user_id !== user?.id) {
            const commentWithProfile = {
              ...newComment,
              profiles: profileData || {
                id: newComment.user_id,
                username: 'Usuário',
                avatar_url: null
              }
            };
            
            setComments(prevComments => [commentWithProfile, ...prevComments]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [articleId, user]);

  const fetchArticleAuthor = async () => {
    try {
      const { data: article } = await supabase
        .from('articles')
        .select('author_id')
        .eq('id', articleId)
        .single();

      if (article) {
        // Get author profile
        const { data: authorProfile } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', article.author_id)
          .single();
          
        if (authorProfile) {
          setMentionedUsers([authorProfile]);
        }
      }
    } catch (error) {
      console.error('Error fetching article author:', error);
    }
  };

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      // First, get all comments for this article with their user profiles
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          id, content, created_at, user_id, article_id, parent_id, mention_user_id
        `)
        .eq('article_id', articleId)
        .order('created_at', { ascending: false });
      
      if (commentsError) {
        console.error('Erro ao carregar comentários:', commentsError);
        setIsLoading(false);
        return;
      }
      
      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        setIsLoading(false);
        return;
      }
      
      // Get profiles for all comment authors
      const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);
      
      if (profilesError) {
        console.error('Erro ao carregar perfis de usuários:', profilesError);
        setIsLoading(false);
        return;
      }
      
      // Add profiles to comments
      const commentsWithProfiles = commentsData.map(comment => {
        const profile = profiles?.find(p => p.id === comment.user_id);
        return {
          ...comment,
          profiles: profile || {
            id: comment.user_id,
            username: 'Usuário',
            avatar_url: null
          }
        };
      });
      
      // For comments with parent_id, get the username of the parent comment's author
      const commentsWithReplyInfo = await Promise.all(commentsWithProfiles.map(async (comment) => {
        if (comment.parent_id) {
          // Get the parent comment's user id
          const parentComment = commentsWithProfiles.find(c => c.id === comment.parent_id);
          if (parentComment) {
            return {
              ...comment,
              reply_to: parentComment.profiles?.username || null
            };
          }
        }
        return comment;
      }));
      
      setComments(commentsWithReplyInfo);
      
      // Collect users for mention suggestions
      if (profiles) {
        setMentionedUsers(prev => {
          const existingIds = new Set(prev.map(u => u.id));
          const newUsers = profiles.filter(u => !existingIds.has(u.id));
          return [...prev, ...newUsers];
        });
      }
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
      
      // Extract mentioned users from comment text
      const mentionRegex = /@(\w+)/g;
      const mentionMatches = [...commentText.matchAll(mentionRegex)];
      let mentionUserId: string | null = null;
      
      if (mentionMatches.length > 0) {
        const mentionedUsername = mentionMatches[0][1];
        
        // Find the user ID for the mentioned username
        const mentionedUser = mentionedUsers.find(u => 
          u.username.toLowerCase() === mentionedUsername.toLowerCase()
        );
        
        if (mentionedUser) {
          mentionUserId = mentionedUser.id;
        }
      }
      
      // Add comment to the database
      const { error } = await supabase
        .from('comments')
        .insert({
          id: commentId,
          article_id: articleId, 
          content: commentText.trim(),
          user_id: user.id,
          parent_id: replyTo ? replyTo.id : null,
          mention_user_id: mentionUserId
        });
      
      if (error) throw error;
      
      // Get profile data for the current user
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', user.id)
        .single();
      
      // Get article author to send notification
      const { data: article } = await supabase
        .from('articles')
        .select('author_id')
        .eq('id', articleId)
        .single();
      
      // Add notifications
      const notifications = [];
      
      // Notification for article author if not the same as commenter
      if (article && article.author_id !== user.id) {
        notifications.push({
          id: crypto.randomUUID(),
          user_id: article.author_id,
          actor_id: user.id,
          article_id: articleId,
          type: 'comment',
          is_read: false
        });
      }
      
      // Notification for reply
      if (replyTo && replyTo.id !== user.id) {
        notifications.push({
          id: crypto.randomUUID(),
          user_id: replyTo.id,
          actor_id: user.id,
          article_id: articleId,
          type: 'comment_reply',
          is_read: false
        });
      }
      
      // Notification for mention
      if (mentionUserId && mentionUserId !== user.id) {
        notifications.push({
          id: crypto.randomUUID(),
          user_id: mentionUserId,
          actor_id: user.id,
          article_id: articleId,
          type: 'comment_mention',
          is_read: false
        });
      }
      
      // Insert all notifications
      if (notifications.length > 0) {
        await supabase
          .from('notifications')
          .insert(notifications);
      }
      
      // Add the new comment to the state
      const newComment: CommentData = {
        id: commentId,
        content: commentText.trim(),
        created_at: new Date().toISOString(),
        user_id: user.id,
        article_id: articleId,
        parent_id: replyTo ? replyTo.id : null,
        mention_user_id: mentionUserId,
        profiles: profileData || {
          id: user.id,
          username: user.email?.split('@')[0] || 'Usuário',
          avatar_url: null
        },
        reply_to: replyTo ? replyTo.username : null
      };
      
      setComments(prevComments => [newComment, ...prevComments]);
      setCommentText("");
      setReplyTo(null);
      
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

  const handleReplyTo = (id: string, username: string) => {
    setReplyTo({ id, username });
    setCommentText(`@${username} `);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const cancelReply = () => {
    setReplyTo(null);
    setCommentText("");
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
            
            <div className="flex-1 space-y-2">
              {replyTo && (
                <div className="flex items-center justify-between bg-zinc-800 px-3 py-1 rounded text-xs">
                  <span>Respondendo para <strong>@{replyTo.username}</strong></span>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={cancelReply}
                    className="h-5 px-1 text-xs"
                  >
                    Cancelar
                  </Button>
                </div>
              )}
              
              <Textarea
                ref={textareaRef}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder={replyTo ? `Responda para @${replyTo.username}...` : "Escreva um comentário..."}
                className="flex-1 bg-zinc-900 border-zinc-700 focus-visible:ring-zinc-500"
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-xs text-zinc-400">
              <span>Mencione usuários usando um "@"</span>
            </div>
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
              parentId={comment.parent_id}
              replyToUsername={comment.reply_to}
              mentionUserId={comment.mention_user_id}
              user={{
                id: comment.user_id,
                name: comment.profiles?.username || "Usuário",
                avatar: comment.profiles?.avatar_url || ""
              }}
              onDeleted={() => handleCommentDelete(comment.id)}
              onReply={() => handleReplyTo(comment.user_id, comment.profiles?.username || "Usuário")}
              articleId={articleId}
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
