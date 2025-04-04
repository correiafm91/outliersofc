
import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Notification {
  id: string;
  type: 'follow' | 'like' | 'comment';
  created_at: string;
  is_read: boolean;
  user_id: string;
  actor_id: string;
  actor: {
    username: string;
    avatar_url: string | null;
  } | null;
  article?: {
    id: string;
    title: string;
  } | null;
}

export function NotificationMenu() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch notifications
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      setIsLoading(true);
      
      try {
        // Get notifications with actor profiles directly with a join
        const { data, error } = await supabase
          .from('notifications')
          .select(`
            id,
            type,
            created_at,
            is_read,
            user_id,
            actor_id,
            article_id,
            profiles!notifications_actor_id_fkey (
              username,
              avatar_url
            ),
            articles (
              id,
              title
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
      
        if (error) {
          console.error("Error fetching notifications:", error);
        } else {
          // Format the notification data
          const formattedNotifications = data.map(item => ({
            id: item.id,
            type: item.type,
            created_at: item.created_at,
            is_read: item.is_read,
            user_id: item.user_id,
            actor_id: item.actor_id,
            actor: item.profiles ? {
              username: item.profiles.username,
              avatar_url: item.profiles.avatar_url,
            } : null,
            article: item.articles ? {
              id: item.articles.id,
              title: item.articles.title,
            } : null
          }));
          
          setNotifications(formattedNotifications);
          setUnreadCount((formattedNotifications || []).filter(n => !n.is_read).length);
        }
      } catch (err) {
        console.error("Exception when fetching notifications:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNotifications();
    
    // Subscribe to realtime notifications
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          fetchNotifications();
          toast({
            title: "Nova notificação",
            description: "Você recebeu uma nova notificação",
          });
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  // Mark notifications as read when opening the menu
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    
    if (open && unreadCount > 0 && user) {
      const unreadIds = notifications
        .filter(n => !n.is_read)
        .map(n => n.id);
      
      if (unreadIds.length > 0) {
        supabase
          .from('notifications')
          .update({ is_read: true })
          .in('id', unreadIds)
          .then(() => {
            setNotifications(prev => 
              prev.map(n => ({...n, is_read: true}))
            );
            setUnreadCount(0);
          });
      }
    }
  };

  const getNotificationText = (notification: Notification) => {
    const actorName = notification.actor?.username || 'Alguém';
    
    switch (notification.type) {
      case 'follow':
        return `${actorName} começou a seguir você`;
      case 'like':
        return `${actorName} curtiu seu artigo "${notification.article?.title || 'Um artigo'}"`;
      case 'comment':
        return `${actorName} comentou em seu artigo "${notification.article?.title || 'Um artigo'}"`;
      default:
        return 'Você recebeu uma notificação';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMinutes < 1) return 'agora';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('pt-BR');
  };

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] bg-red-500 border-none">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-zinc-900 border-zinc-800">
        <div className="p-3 border-b border-zinc-800">
          <h3 className="font-medium">Notificações</h3>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-6 w-6 bg-zinc-700 rounded-full"></div>
              <p className="mt-2 text-xs text-zinc-500">Carregando...</p>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-zinc-500">
            <p>Sem notificações</p>
          </div>
        ) : (
          <div className="max-h-[350px] overflow-y-auto">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={cn(
                  "flex items-start gap-3 p-3 hover:bg-zinc-800/50 transition-colors",
                  !notification.is_read && "bg-zinc-800/30"
                )}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={notification.actor?.avatar_url || undefined} />
                  <AvatarFallback className="bg-zinc-700 text-zinc-300">
                    {notification.actor?.username.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300">
                    {getNotificationText(notification)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {formatDate(notification.created_at)}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 self-center"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
