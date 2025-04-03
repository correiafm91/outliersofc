
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UserFollowButtonProps {
  userId: string;
  username: string;
  onFollowChange?: (isFollowing: boolean) => void;
  className?: string;
}

export function UserFollowButton({ userId, username, onFollowChange, className }: UserFollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.id === userId) return;

    const checkFollowStatus = async () => {
      const { data, error } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error checking follow status:", error);
      } else {
        setIsFollowing(!!data);
        if (onFollowChange) onFollowChange(!!data);
      }
    };

    checkFollowStatus();
  }, [user, userId, onFollowChange]);

  const handleFollowAction = async () => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa fazer login para seguir este usuário",
        variant: "destructive",
      });
      return;
    }

    if (user.id === userId) return;

    setIsLoading(true);
    
    try {
      if (isFollowing) {
        // Unfollow user
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
        
        if (error) throw error;
        
        setIsFollowing(false);
        if (onFollowChange) onFollowChange(false);
        
        toast({
          title: "Deixou de seguir",
          description: `Você deixou de seguir ${username}`,
        });
      } else {
        // Follow user
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
            following_id: userId,
          });
        
        if (error) throw error;
        
        setIsFollowing(true);
        if (onFollowChange) onFollowChange(true);
        
        // Create notification
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            actor_id: user.id,
            type: 'follow'
          });
        
        toast({
          title: "Seguindo",
          description: `Você agora está seguindo ${username}`,
        });
      }
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
      toast({
        title: "Erro",
        description: "Não foi possível completar a ação",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.id === userId) return null;

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      onClick={handleFollowAction}
      disabled={isLoading}
      className={className}
    >
      {isFollowing ? "Seguindo" : "Seguir"}
    </Button>
  );
}
