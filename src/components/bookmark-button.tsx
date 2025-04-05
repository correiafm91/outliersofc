
import { useState, useEffect } from "react";
import { BookmarkIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase, tablesWithoutTypes } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export interface BookmarkButtonProps {
  articleId: string;
  className?: string;
  variant?: "default" | "outline";  // Add variant prop
  onBookmarkChange?: (isBookmarked: boolean) => void;
}

export function BookmarkButton({ articleId, className, variant = "default", onBookmarkChange }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const checkBookmarkStatus = async () => {
      try {
        const { data, error } = await tablesWithoutTypes.bookmarks()
          .select('id')
          .eq('user_id', user.id)
          .eq('article_id', articleId)
          .maybeSingle();
        
        if (error) {
          console.error("Error checking bookmark status:", error);
          return;
        }
        
        setIsBookmarked(!!data);
        if (onBookmarkChange) onBookmarkChange(!!data);
      } catch (err) {
        console.error("Error checking bookmark status:", err);
      }
    };

    checkBookmarkStatus();
  }, [articleId, user, onBookmarkChange]);

  const toggleBookmark = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para salvar artigos",
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
        if (onBookmarkChange) onBookmarkChange(false);
        
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
        if (onBookmarkChange) onBookmarkChange(true);
        
        toast({
          title: "Artigo salvo",
          description: "O artigo foi adicionado aos seus salvos",
        });
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os salvos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const buttonClasses = cn(
    "inline-flex items-center justify-center p-2 rounded-full transition-colors",
    variant === "default" 
      ? "bg-white text-black hover:bg-zinc-200" 
      : "bg-zinc-900 border border-zinc-700 text-white hover:bg-zinc-800",
    isLoading ? "opacity-50 cursor-not-allowed" : "",
    className
  );

  return (
    <button
      onClick={toggleBookmark}
      disabled={isLoading}
      className={buttonClasses}
      aria-label={isBookmarked ? "Remover dos salvos" : "Adicionar aos salvos"}
    >
      <BookmarkIcon
        className={cn("h-4 w-4", isBookmarked ? "fill-current" : "")}
      />
    </button>
  );
}
