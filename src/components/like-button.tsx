
import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface LikeButtonProps {
  articleId: string;
}

export function LikeButton({ articleId }: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [likeId, setLikeId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Only fetch likes if we have an articleId
    if (!articleId) return;
    
    const fetchLikes = async () => {
      // Get total like count for this article
      const { count, error: countError } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', articleId);
        
      if (countError) {
        console.error("Error fetching like count:", countError);
      } else {
        setLikeCount(count || 0);
      }
      
      // Check if the current user liked this article
      if (user) {
        const { data, error } = await supabase
          .from('likes')
          .select('id')
          .eq('article_id', articleId)
          .eq('user_id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
          console.error("Error checking if user liked article:", error);
        } else if (data) {
          setLiked(true);
          setLikeId(data.id);
        }
      }
    };
    
    fetchLikes();
  }, [articleId, user]);

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Você precisa fazer login",
        description: "Faça login para curtir este artigo",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (liked) {
        // Remove like
        if (likeId) {
          const { error } = await supabase
            .from('likes')
            .delete()
            .eq('id', likeId);
            
          if (error) throw error;
          
          setLikeCount((prev) => prev - 1);
          setLiked(false);
          setLikeId(null);
          
          toast({
            title: "Curtida removida",
            description: "Você removeu sua curtida deste artigo",
          });
        }
      } else {
        // Add like
        setIsAnimating(true);
        
        const { data, error } = await supabase
          .from('likes')
          .insert({
            article_id: articleId,
            user_id: user.id,
          })
          .select('id')
          .single();
          
        if (error) throw error;
        
        setLikeCount((prev) => prev + 1);
        setLiked(true);
        setLikeId(data.id);
        
        toast({
          title: "Artigo curtido!",
          description: "Você curtiu este artigo",
        });
      }
    } catch (error) {
      console.error("Error updating like:", error);
      toast({
        title: "Erro",
        description: "Não foi possível processar sua curtida",
        variant: "destructive",
      });
    } finally {
      // Finalizar animação
      setTimeout(() => setIsAnimating(false), 1000);
    }
  };

  return (
    <button 
      onClick={handleLike}
      className={cn(
        "flex items-center space-x-2 py-2 px-4 rounded-full border transition-all duration-300",
        liked 
          ? "bg-pink-500/10 border-pink-500/30 text-pink-500" 
          : "bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
      )}
    >
      <Heart 
        className={cn(
          "h-5 w-5 transition-transform", 
          isAnimating && "animate-[heartbeat_1s_ease-in-out]",
          liked && "fill-pink-500"
        )} 
      />
      <span>{likeCount}</span>
      
      <style jsx>
        {`
          @keyframes heartbeat {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.3); }
          }
        `}
      </style>
    </button>
  );
}
