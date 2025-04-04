
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ThumbsUp, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CommentItemProps {
  comment: {
    id: string;
    text: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
    likes?: number;
  };
  onDelete?: () => void;
}

export function CommentItem({ comment, onDelete }: CommentItemProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes || 0);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

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

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa fazer login para curtir comentários",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!isLiked) {
        // Like comment
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: comment.id,
            user_id: user.id
          });
        
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      } else {
        // Unlike comment
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', comment.id)
          .eq('user_id', user.id);
          
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível curtir este comentário",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!user || user.id !== comment.user.id) return;
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', comment.id);
      
      if (error) throw error;
      
      toast({
        title: "Comentário excluído",
        description: "Seu comentário foi excluído com sucesso",
      });
      
      if (onDelete) onDelete();
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

  useEffect(() => {
    if (!user) return;
    
    const checkLikeStatus = async () => {
      const { data } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', comment.id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      setIsLiked(!!data);
    };
    
    checkLikeStatus();
  }, [comment.id, user]);

  return (
    <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 animate-fade-in">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 border border-zinc-700">
          <AvatarImage src={comment.user.avatar} />
          <AvatarFallback className="bg-zinc-800 text-zinc-400">
            {comment.user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{comment.user.name}</h4>
            </div>
            <span className="text-xs text-zinc-500">{formatDate(comment.createdAt)}</span>
          </div>
          <p className="text-zinc-300">{comment.text}</p>
          
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800">
            <button 
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium py-1 px-2 rounded hover:bg-zinc-800 transition-colors",
                isLiked ? "text-blue-400" : "text-zinc-400"
              )}
            >
              <ThumbsUp className={cn("h-3.5 w-3.5", isLiked && "fill-blue-400")} />
              <span>{likeCount > 0 ? likeCount : ""} {likeCount === 1 ? "Curtida" : "Curtidas"}</span>
            </button>
            
            {user && user.id === comment.user.id && (
              <Button
                variant="ghost" 
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/20"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Excluir
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
