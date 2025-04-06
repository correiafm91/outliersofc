
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase, tables } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export interface DeleteArticleButtonProps {
  articleId: string;
  onDeleted?: () => void;
  redirectTo?: string;
}

export function DeleteArticleButton({ articleId, onDeleted, redirectTo }: DeleteArticleButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!window.confirm("Tem certeza que deseja excluir este artigo? Esta ação não pode ser desfeita.")) {
      return;
    }

    setIsDeleting(true);

    try {
      // Delete all comments associated with the article
      const { error: commentsError } = await tables.comments()
        .delete()
        .eq('article_id', articleId);

      if (commentsError) {
        console.error("Error deleting comments:", commentsError);
      }

      // Delete all likes associated with the article
      const { error: likesError } = await tables.likes()
        .delete()
        .eq('article_id', articleId);

      if (likesError) {
        console.error("Error deleting likes:", likesError);
      }

      // Delete all bookmarks associated with the article
      const { error: bookmarksError } = await tables.bookmarks()
        .delete()
        .eq('article_id', articleId);

      if (bookmarksError) {
        console.error("Error deleting bookmarks:", bookmarksError);
      }

      // Delete notifications related to the article
      const { error: notificationsError } = await tables.notifications()
        .delete()
        .eq('article_id', articleId);

      if (notificationsError) {
        console.error("Error deleting notifications:", notificationsError);
      }

      // Finally delete the article
      const { error: articleError } = await tables.articles()
        .delete()
        .eq('id', articleId);

      if (articleError) throw articleError;

      toast({
        title: "Artigo excluído",
        description: "O artigo foi excluído com sucesso.",
      });

      if (onDeleted) {
        onDeleted();
      }

      if (redirectTo) {
        navigate(redirectTo);
      }
    } catch (error) {
      console.error("Error deleting article:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o artigo.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleDelete();
      }}
      disabled={isDeleting}
      aria-label="Excluir artigo"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
