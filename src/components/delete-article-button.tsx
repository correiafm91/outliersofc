
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteArticleButtonProps {
  articleId: string;
  onDeleted?: () => void;
}

export function DeleteArticleButton({ articleId, onDeleted }: DeleteArticleButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      // First delete related data (comments, likes, etc.)
      await supabase.from('comment_likes').delete().eq('comment_id', supabase.from('comments').select('id').eq('article_id', articleId));
      await supabase.from('comments').delete().eq('article_id', articleId);
      await supabase.from('likes').delete().eq('article_id', articleId);
      await supabase.from('bookmarks').delete().eq('article_id', articleId);
      await supabase.from('notifications').delete().eq('article_id', articleId);
      
      // Then delete the article itself
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId);
        
      if (error) throw error;
      
      toast({
        title: "Artigo excluído",
        description: "Seu artigo foi excluído com sucesso",
      });
      
      if (onDeleted) {
        onDeleted();
      } else {
        // Navigate to home if no callback provided
        navigate("/");
      }
    } catch (error) {
      console.error("Erro ao excluir artigo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o artigo",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="text-red-500 border-red-500/20 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800">
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente o seu artigo
            e removerá todos os dados associados a ele.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-zinc-800 text-white hover:bg-zinc-700">Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            className="bg-red-500 text-white hover:bg-red-600"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
