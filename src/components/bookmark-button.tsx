
import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { supabase, tablesWithoutTypes, BookmarkTable } from "@/integrations/supabase/client";

interface BookmarkButtonProps {
  articleId: string;
  className?: string;
}

export function BookmarkButton({ articleId, className = "" }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const checkBookmarkStatus = async () => {
      try {
        const { data } = await tablesWithoutTypes.bookmarks()
          .select('id')
          .eq('user_id', user.id)
          .eq('article_id', articleId)
          .maybeSingle();
        
        setIsBookmarked(!!data);
      } catch (error) {
        console.error("Error checking bookmark status:", error);
      }
    };

    checkBookmarkStatus();
  }, [user, articleId]);

  const handleToggleBookmark = async () => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa fazer login para salvar artigos",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

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
          description: "O artigo foi removido dos seus favoritos",
        });
      } else {
        // Add bookmark
        const newBookmark: Partial<BookmarkTable> = {
          id: crypto.randomUUID(),
          user_id: user.id,
          article_id: articleId
        };
        
        const { error } = await tablesWithoutTypes.bookmarks()
          .insert(newBookmark);
          
        if (error) throw error;
        
        setIsBookmarked(true);
        toast({
          title: "Artigo salvo",
          description: "O artigo foi adicionado aos seus favoritos",
        });
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar seus favoritos",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleToggleBookmark();
      }}
      disabled={isUpdating}
      className={`h-8 w-8 p-0 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 ${className}`}
    >
      <Bookmark
        className={`h-4 w-4 ${isBookmarked ? 'fill-white text-white' : 'text-white'}`}
      />
      <span className="sr-only">
        {isBookmarked ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      </span>
    </Button>
  );
}
