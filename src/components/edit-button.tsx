
import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface EditButtonProps {
  articleId: string;
}

export function EditButton({ articleId }: EditButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleEdit = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLoading(true);
    
    try {
      // Check if the current user is the author of the article
      const { data, error } = await supabase
        .from('articles')
        .select('author_id')
        .eq('id', articleId)
        .single();
      
      if (error) throw error;
      
      if (data && data.author_id === user?.id) {
        navigate(`/edit-article/${articleId}`);
      } else {
        console.error("You don't have permission to edit this article");
      }
    } catch (error) {
      console.error("Error checking article permissions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Only show edit button if user is logged in
  if (!user) {
    return null;
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleEdit}
      disabled={isLoading}
      aria-label="Editar artigo"
    >
      <Pencil className="h-4 w-4" />
    </Button>
  );
}
