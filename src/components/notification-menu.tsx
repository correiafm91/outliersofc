
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, tablesWithoutTypes, Notification } from "@/integrations/supabase/client";

type NotificationType = "like" | "follow" | "comment";

export function NotificationMenu() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const { data: notificationsData, error } = await tablesWithoutTypes.notifications()
          .select(`
            *,
            actor:actor_id(username, avatar_url)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error) {
          console.error("Erro ao buscar notificações:", error);
          return;
        }

        // If we have notification with article_id, fetch article details
        const notificationsWithArticleIds = notificationsData.filter(
          n => n.article_id !== null && n.type !== 'follow'
        );
        
        if (notificationsWithArticleIds.length > 0) {
          const articleIds = notificationsWithArticleIds.map(n => n.article_id);
          
          const { data: articlesData, error: articlesError } = await supabase
            .from('articles')
            .select('id, title')
            .in('id', articleIds.filter(Boolean) as string[]);
          
          if (!articlesError && articlesData) {
            // Create a map for quick lookup
            const articlesMap = articlesData.reduce(
              (acc, article) => ({...acc, [article.id]: article}),
              {} as Record<string, {id: string, title: string}>
            );
            
            // Add article data to notifications
            const notificationsWithArticles = notificationsData.map(notification => {
              if (notification.article_id && articlesMap[notification.article_id]) {
                return {
                  ...notification,
                  article: articlesMap[notification.article_id]
                };
              }
              return notification;
            });
            
            setNotifications(notificationsWithArticles as Notification[]);
          } else {
            setNotifications(notificationsData as Notification[]);
          }
        } else {
          setNotifications(notificationsData as Notification[]);
        }
        
        // Count unread notifications
        const unreadNotifications = notificationsData.filter(n => !n.is_read);
        setUnreadCount(unreadNotifications.length);
      } catch (err) {
        console.error("Erro ao buscar notificações:", err);
      }
    };

    fetchNotifications();

    // Set up a polling interval to check for new notifications
    const interval = setInterval(fetchNotifications, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [user]);

  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;
    
    try {
      const { error } = await tablesWithoutTypes.notifications()
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      if (error) {
        console.error("Erro ao marcar notificações como lidas:", error);
        return;
      }
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Erro ao marcar notificações como lidas:", err);
    }
  };

  const toggleMenu = () => {
    setIsOpen(prev => !prev);
    if (!isOpen && unreadCount > 0) {
      markAllAsRead();
    }
  };

  const getNotificationText = (notification: Notification) => {
    const actorName = notification.actor?.username || "Alguém";
    
    switch (notification.type as NotificationType) {
      case "like":
        return `${actorName} curtiu seu artigo`;
      case "follow":
        return `${actorName} começou a seguir você`;
      case "comment":
        return `${actorName} comentou no seu artigo`;
      default:
        return `Nova notificação`;
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button 
        className="relative p-2 rounded-full hover:bg-zinc-800"
        onClick={toggleMenu}
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-xs">
            {unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-md shadow-lg z-50">
          <div className="p-3 border-b border-zinc-800 flex justify-between items-center">
            <h3 className="font-medium">Notificações</h3>
            {notifications.length > 0 && (
              <button 
                className="text-xs text-zinc-400 hover:text-white"
                onClick={markAllAsRead}
              >
                Marcar todas como lidas
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              <ul>
                {notifications.map((notification) => {
                  const notificationText = getNotificationText(notification);
                  const timeAgo = new Date(notification.created_at).toLocaleDateString('pt-BR');
                  
                  let linkTo = '';
                  if (notification.type === 'follow') {
                    linkTo = `/profile/${notification.actor_id}`;
                  } else if (notification.article_id && notification.article) {
                    linkTo = `/article/${notification.article_id}`;
                  }
                  
                  return (
                    <li 
                      key={notification.id}
                      className={`p-3 border-b border-zinc-800 hover:bg-zinc-800 ${
                        !notification.is_read ? 'bg-zinc-800/50' : ''
                      }`}
                    >
                      <Link to={linkTo} className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={notification.actor?.avatar_url || ''} alt={notification.actor?.username || ''} />
                          <AvatarFallback>{(notification.actor?.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{notificationText}</p>
                          {notification.article && (
                            <p className="text-xs text-zinc-400 truncate">"{notification.article.title}"</p>
                          )}
                          <p className="text-xs text-zinc-500 mt-1">{timeAgo}</p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="p-6 text-center">
                <p className="text-zinc-400">Nenhuma notificação</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
