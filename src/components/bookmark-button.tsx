
import { useState, useEffect } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, tablesWithoutTypes } from "@/integrations/supabase/client";

interface BookmarkButtonProps {
  articleId: string;
}

export function BookmarkButton({ articleId }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && articleId) {
      checkBookmarkStatus();
    }
  }, [user, articleId]);

  const checkBookmarkStatus = async () => {
    if (!user) return;

    try {
      // Use tablesWithoutTypes to avoid TypeScript errors
      const { data, error } = await tablesWithoutTypes.bookmarks()
        .select('*')
        .eq('user_id', user.id)
        .eq('article_id', articleId)
        .maybeSingle();
        
      if (error) {
        console.error("Error checking bookmark status:", error);
        return;
      }
      
      setIsBookmarked(!!data);
    } catch (err) {
      console.error("Error checking bookmark status:", err);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      toast({
        title: "Você precisa estar logado",
        description: "Faça login para salvar este artigo",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isBookmarked) {
        // Remove bookmark
        const { error } = await tablesWithoutTypes.bookmarks()
          .delete()
          .eq('user_id', user.id)
          .eq('article_id', articleId);
          
        if (error) throw error;
        
        setIsBookmarked(false);
        toast({
          title: "Artigo removido",
          description: "O artigo foi removido dos seus salvos",
        });
      } else {
        // Add bookmark
        const { error } = await tablesWithoutTypes.bookmarks()
          .insert({
            user_id: user.id,
            article_id: articleId
          });
          
        if (error) throw error;
        
        setIsBookmarked(true);
        toast({
          title: "Artigo salvo",
          description: "O artigo foi salvo na sua lista",
        });
      }
    } catch (error) {
      console.error("Error bookmarking article:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível realizar esta operação",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-9 px-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
      onClick={handleBookmark}
      disabled={isLoading}
    >
      {isBookmarked ? (
        <>
          <BookmarkCheck className="h-5 w-5 mr-1" />
          <span>Salvo</span>
        </>
      ) : (
        <>
          <Bookmark className="h-5 w-5 mr-1" />
          <span>Salvar</span>
        </>
      )}
    </Button>
  );
}
