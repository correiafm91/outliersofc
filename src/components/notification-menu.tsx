
// Update the fetchNotifications function to use our new helper function:

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
