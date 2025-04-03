
import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface BookmarkButtonProps {
  articleId: string;
  variant?: "icon" | "button";
  className?: string;
}

export function BookmarkButton({ articleId, variant = "icon", className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !articleId) return;
    
    const checkBookmarkStatus = async () => {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('article_id', articleId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error checking bookmark status:", error);
      } else if (data) {
        setIsBookmarked(true);
        setBookmarkId(data.id);
      }
    };
    
    checkBookmarkStatus();
  }, [articleId, user]);

  const handleBookmark = async () => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa fazer login para salvar artigos",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      if (isBookmarked) {
        // Remove bookmark
        if (bookmarkId) {
          const { error } = await supabase
            .from('bookmarks')
            .delete()
            .eq('id', bookmarkId);
          
          if (error) throw error;
          
          setIsBookmarked(false);
          setBookmarkId(null);
          
          toast({
            title: "Removido dos salvos",
            description: "Este artigo foi removido dos seus salvos",
          });
        }
      } else {
        // Add bookmark
        const { data, error } = await supabase
          .from('bookmarks')
          .insert({
            article_id: articleId,
            user_id: user.id,
          })
          .select('id')
          .single();
        
        if (error) throw error;
        
        setIsBookmarked(true);
        setBookmarkId(data.id);
        
        toast({
          title: "Salvo!",
          description: "Este artigo foi salvo na sua lista",
        });
      }
    } catch (error) {
      console.error("Error bookmarking article:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o artigo",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === "icon") {
    return (
      <button 
        onClick={handleBookmark}
        disabled={isLoading}
        className={cn(
          "flex items-center justify-center p-2 rounded-full transition-colors",
          isBookmarked 
            ? "text-yellow-500" 
            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800",
          className
        )}
      >
        <Bookmark 
          className={cn(
            "h-5 w-5", 
            isBookmarked && "fill-yellow-500"
          )} 
        />
      </button>
    );
  }

  return (
    <Button
      variant={isBookmarked ? "outline" : "secondary"}
      size="sm"
      onClick={handleBookmark}
      disabled={isLoading}
      className={cn(
        isBookmarked && "border-yellow-500/30 text-yellow-500",
        className
      )}
    >
      <Bookmark className={cn("h-4 w-4 mr-2", isBookmarked && "fill-yellow-500")} />
      {isBookmarked ? "Salvo" : "Salvar"}
    </Button>
  );
}
