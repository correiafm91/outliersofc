
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, Trash2, Reply, CheckCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CommentItemProps {
  id: string;
  text: string;
  createdAt: string;
  userId: string;
  parentId?: string | null;
  mentionUserId?: string | null;
  replyToUsername?: string | null;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  onDeleted?: () => void;
  onReply?: () => void;
  articleId: string;
}

interface CommentLike {
  id: string;
  user_id: string;
  comment_id: string;
  created_at?: string;
}

export function CommentItem({ 
  id, 
  text, 
  createdAt, 
  userId,
  parentId,
  mentionUserId,
  replyToUsername,
  user, 
  onDeleted,
  onReply,
  articleId
}: CommentItemProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeId, setLikeId] = useState<string | null>(null);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [mentionedUser, setMentionedUser] = useState<{ id: string, username: string } | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const isOwner = currentUser?.id === userId;
  const formattedDate = formatDistanceToNow(new Date(createdAt), { 
    addSuffix: true,
    locale: ptBR 
  });

  // Check if the user is verified (Outliers Oficial)
  useEffect(() => {
    if (user.name === "Outliers Oficial") {
      setIsVerified(true);
    }
  }, [user.name]);

  // Format text to highlight mentions
  const formattedText = text.replace(
    /@(\w+)/g,
    (match, username) => `<span class="text-blue-400">@${username}</span>`
  );

  // Check if the user has liked this comment
  useEffect(() => {
    if (!currentUser) return;

    const checkLikeStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('comment_likes')
          .select('id')
          .eq('user_id', currentUser.id)
          .eq('comment_id', id)
          .maybeSingle();
        
        if (error) {
          console.error('Error checking like status:', error);
          return;
        }
        
        if (data) {
          setIsLiked(true);
          setLikeId(data.id);
        }
      } catch (err) {
        console.error('Error checking like status:', err);
      }
    };

    const fetchLikeCount = async () => {
      try {
        const { count, error } = await supabase
          .from('comment_likes')
          .select('*', { count: 'exact', head: true })
          .eq('comment_id', id);
        
        if (error) {
          console.error('Error fetching like count:', error);
          return;
        }
        
        setLikeCount(count || 0);
      } catch (err) {
        console.error('Error fetching like count:', err);
      }
    };

    // Fetch mentioned user information
    const fetchMentionedUser = async () => {
      if (mentionUserId) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, username')
            .eq('id', mentionUserId)
            .single();
            
          if (error) {
            console.error('Error fetching mentioned user:', error);
            return;
          }
          
          if (data) {
            setMentionedUser(data);
          }
        } catch (err) {
          console.error('Error fetching mentioned user:', err);
        }
      }
    };

    checkLikeStatus();
    fetchLikeCount();
    fetchMentionedUser();
  }, [currentUser, id, mentionUserId]);

  const handleDelete = async () => {
    if (!currentUser || !isOwner) return;
    
    setIsDeleting(true);
    
    try {
      // Delete all likes to this comment first
      await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', id);
        
      // Delete any notifications related to this comment
      await supabase
        .from('notifications')
        .delete()
        .eq('type', 'comment_like')
        .eq('article_id', articleId)
        .eq('actor_id', userId);
      
      // Finally delete the comment itself
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Comentário excluído",
        description: "Seu comentário foi excluído com sucesso",
      });
      
      if (onDeleted) onDeleted();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o comentário",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      toast({
        title: "Faça login",
        description: "Você precisa fazer login para curtir comentários",
        variant: "destructive",
      });
      return;
    }

    setIsLikeLoading(true);
    
    try {
      if (isLiked) {
        // Unlike comment
        if (likeId) {
          const { error } = await supabase
            .from('comment_likes')
            .delete()
            .eq('id', likeId);
          
          if (error) throw error;
          
          setIsLiked(false);
          setLikeId(null);
          setLikeCount(prev => Math.max(0, prev - 1));
        }
      } else {
        // Like comment
        const newLike: CommentLike = {
          id: crypto.randomUUID(),
          user_id: currentUser.id,
          comment_id: id
        };
        
        const { data, error } = await supabase
          .from('comment_likes')
          .insert(newLike)
          .select('id')
          .single();
        
        if (error) throw error;
        
        // Create notification if the comment is not by the current user
        if (userId !== currentUser.id) {
          await supabase
            .from('notifications')
            .insert({
              id: crypto.randomUUID(),
              user_id: userId,
              actor_id: currentUser.id,
              article_id: articleId,
              type: 'comment_like',
              is_read: false
            });
        }
        
        setIsLiked(true);
        setLikeId(data.id);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error liking/unliking comment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível curtir o comentário",
        variant: "destructive",
      });
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleReply = () => {
    if (onReply) {
      onReply();
    }
  };

  return (
    <div className="py-4 border-b border-zinc-800 last:border-b-0">
      <div className="flex gap-3">
        <Link to={`/user/${user.id}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
            <AvatarFallback className="bg-zinc-800 text-zinc-200">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <Link to={`/user/${user.id}`} className="font-medium text-white hover:underline">
                {user.name}
              </Link>
              {isVerified && (
                <CheckCircle className="h-4 w-4 text-blue-500 ml-1" />
              )}
              <span className="ml-2 text-xs text-zinc-400">{formattedDate}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Reply Button */}
              {currentUser && (
                <button
                  onClick={handleReply}
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <Reply className="h-4 w-4" />
                  <span className="hidden sm:inline">Responder</span>
                </button>
              )}
              
              {/* Like Button */}
              <button
                onClick={handleLike}
                disabled={isLikeLoading}
                className={`flex items-center gap-1 text-xs ${
                  isLiked ? 'text-red-500' : 'text-zinc-400 hover:text-zinc-200'
                } transition-colors`}
              >
                <Heart 
                  className={`h-4 w-4 ${isLiked ? 'fill-red-500' : ''}`}
                />
                {likeCount > 0 && <span>{likeCount}</span>}
              </button>
              
              {/* Delete Button (only shown to comment owner) */}
              {isOwner && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-1 text-zinc-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Excluir comentário</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir comentário</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isto excluirá permanentemente o seu comentário.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isDeleting ? "Excluindo..." : "Excluir"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
          
          {/* Reply-to information */}
          {replyToUsername && (
            <div className="mt-1 mb-2 text-xs text-zinc-400">
              Resposta para <span className="text-blue-400">@{replyToUsername}</span>
            </div>
          )}
          
          <div className="mt-2 text-zinc-200 whitespace-pre-wrap">
            <div dangerouslySetInnerHTML={{ __html: formattedText }} />
          </div>
        </div>
      </div>
    </div>
  );
}
