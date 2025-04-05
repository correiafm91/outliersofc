
import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase, getNotificationsWithActors, Notification } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function NotificationMenu() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch notifications on mount and when dropdown opens
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Set up realtime notifications
  useEffect(() => {
    if (!user) return;

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

  const fetchNotifications = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const notifications = await getNotificationsWithActors(user.id);
      setNotifications(notifications);
      
      // Count unread notifications
      const unreadCount = notifications.filter(notif => !notif.is_read).length;
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .is('is_read', false);

      if (error) throw error;

      // Update local state
      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
      setUnreadCount(0);

    } catch (error) {
      console.error("Erro ao marcar notificações como lidas:", error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .is('is_read', false);

      if (error) throw error;

      // Update local state
      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  };

  const handleDropdownOpen = (open: boolean) => {
    setIsOpen(open);
    // Mark all as read when opening the dropdown
    if (open && unreadCount > 0) {
      markAllAsRead();
    }
  };

  // Get notification text based on type
  const getNotificationText = (notification: Notification) => {
    const actorName = notification.actor?.username || "Alguém";
    
    switch (notification.type) {
      case 'follow':
        return `${actorName} começou a seguir você`;
      case 'like':
        return `${actorName} curtiu seu artigo "${notification.article?.title || 'um artigo'}"`;
      case 'comment':
        return `${actorName} comentou em "${notification.article?.title || 'seu artigo'}"`;
      case 'comment_like':
        return `${actorName} curtiu seu comentário`;
      case 'comment_reply':
        return `${actorName} respondeu ao seu comentário`;
      case 'comment_mention':
        return `${actorName} mencionou você em um comentário`;
      default:
        return `Nova notificação de ${actorName}`;
    }
  };

  // Get notification link based on type
  const getNotificationLink = (notification: Notification) => {
    switch (notification.type) {
      case 'follow':
        return `/user/${notification.actor_id}`;
      case 'like':
      case 'comment':
      case 'comment_like':
      case 'comment_reply':
      case 'comment_mention':
        return notification.article?.id ? `/article/${notification.article.id}` : '/';
      default:
        return '/';
    }
  };

  const formatNotificationDate = (date: string) => {
    return format(new Date(date), "dd MMM 'às' HH:mm", { locale: ptBR });
  };

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 bg-zinc-900 border-zinc-800" align="end">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="font-medium">Notificações</h3>
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs hover:bg-zinc-800"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        
        <DropdownMenuGroup className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin h-5 w-5 border-2 border-zinc-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-sm text-zinc-400">Carregando notificações...</p>
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <Link 
                key={notification.id} 
                to={getNotificationLink(notification)} 
                onClick={() => markAsRead(notification.id)}
              >
                <DropdownMenuItem className={`flex p-4 border-b border-zinc-800 cursor-pointer ${!notification.is_read ? 'bg-zinc-800/40' : ''}`}>
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarImage src={notification.actor?.avatar_url || undefined} />
                    <AvatarFallback className="bg-zinc-700">
                      {notification.actor?.username?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{getNotificationText(notification)}</p>
                    <p className="text-xs text-zinc-500">
                      {formatNotificationDate(notification.created_at)}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="h-2 w-2 rounded-full bg-blue-500 ml-2"></div>
                  )}
                </DropdownMenuItem>
              </Link>
            ))
          ) : (
            <div className="p-6 text-center">
              <p className="text-zinc-400">Você não tem notificações</p>
            </div>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
