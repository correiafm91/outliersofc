
import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

type NotificationType = "follow" | "comment" | "like";

interface Notification {
  id: string;
  type: NotificationType;
  created_at: string;
  is_read: boolean;
  user_id: string;
  actor_id: string;
  article_id?: string;
  actor: {
    username: string;
    avatar_url: string | null;
  };
  article?: {
    id: string;
    title: string;
  };
}

export function NotificationMenu() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select(`
            *,
            actor:actor_id (
              username, 
              avatar_url
            ),
            article:article_id (
              id,
              title
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(15);
        
        if (error) {
          console.error("Erro ao carregar notificações:", error);
          return;
        }
        
        // Make sure we have valid actor data before setting notifications
        const validNotifications = data
          .filter(item => item.actor && typeof item.actor === 'object')
          .map(item => ({
            ...item,
            type: item.type as NotificationType,
            actor: {
              username: item.actor?.username || 'Usuário',
              avatar_url: item.actor?.avatar_url || null
            },
            article: item.article ? {
              id: item.article.id,
              title: item.article.title
            } : undefined
          }));
        
        setNotifications(validNotifications);
        setUnreadCount(validNotifications.filter(n => !n.is_read).length);
      } catch (err) {
        console.error("Exception loading notifications:", err);
      }
    };

    fetchNotifications();

    // Set up a realtime subscription for new notifications
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      if (error) {
        console.error("Erro ao marcar notificações como lidas:", error);
        return;
      }
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Exception marking notifications as read:", err);
    }
  };

  const markAsRead = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      
      if (error) {
        console.error("Erro ao marcar notificação como lida:", error);
        return;
      }
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, is_read: true } 
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Exception marking notification as read:", err);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setIsOpen(false);

    if (notification.type === 'follow') {
      // Navigate to profile
      // In a real app, this would go to the actor's profile
      // but for simplicity we just go to user profile for now
      navigate('/profile');
    } else if (notification.article) {
      // Navigate to article
      navigate(`/article/${notification.article.id}`);
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'follow':
        return "começou a seguir você";
      case 'like':
        return `curtiu seu artigo "${notification.article?.title || 'artigo'}"`;
      case 'comment':
        return `comentou em seu artigo "${notification.article?.title || 'artigo'}"`;
      default:
        return "interagiu com você";
    }
  };

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-zinc-900 border-zinc-800" align="end">
        <div className="flex items-center justify-between border-b border-zinc-800 p-3">
          <h3 className="font-medium">Notificações</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              className="text-xs h-auto py-1"
              onClick={markAllAsRead}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <div className="max-h-[400px] overflow-auto">
          {notifications.length > 0 ? (
            notifications.map(notification => (
              <div 
                key={notification.id}
                className={`p-3 border-b border-zinc-800 last:border-b-0 flex items-start gap-3 cursor-pointer hover:bg-zinc-800 transition-colors ${!notification.is_read ? 'bg-zinc-800/50' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={notification.actor.avatar_url || undefined} />
                  <AvatarFallback>{notification.actor.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{notification.actor.username}</span>{' '}
                    {getNotificationText(notification)}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                {!notification.is_read && (
                  <span className="h-2 w-2 rounded-full bg-blue-500 self-center mr-1"></span>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-zinc-400">
              <p>Nenhuma notificação ainda.</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
