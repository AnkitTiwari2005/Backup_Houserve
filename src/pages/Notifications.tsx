import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export default function Notifications() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchNotifications();

      // Realtime subscription
      const subscription = supabase
        .channel('public:notifications')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${profile.id}`
          }, 
          (payload) => {
            console.log('New notification received!', payload);
            setNotifications(prev => [payload.new, ...prev]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [profile]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setNotifications(data || []);
      
      // Mark all as read after fetching
      if (data && data.some(n => !n.is_read)) {
        markAllAsRead();
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', profile?.id)
        .eq('is_read', false);
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const dates = new Date(dateStr);
    const now = new Date();
    const diffInMs = now.getTime() - dates.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return 'Yesterday';
    return `${diffInDays}d ago`;
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'booking': return <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center shrink-0">📅</div>;
      case 'payment': return <div className="w-10 h-10 rounded-full bg-green-100 text-green-500 flex items-center justify-center shrink-0">💳</div>;
      case 'technician': return <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center shrink-0">👨‍🔧</div>;
      case 'promo': return <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-500 flex items-center justify-center shrink-0">🎉</div>;
      default: return <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">🔔</div>;
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (notification.booking_id) {
      navigate(`/bookings/${notification.booking_id}`);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="bg-surface px-6 pt-6 pb-4 shadow-sm sticky top-0 z-10 border-b border-border flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <h1 className="text-2xl font-syne font-bold text-accent">Notifications</h1>
      </div>

      <div className="space-y-1">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <div 
              key={notification.id} 
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 flex gap-4 ${notification.is_read ? 'bg-white' : 'bg-primary-light/40'} border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors`}
            >
              {getIconForType(notification.type)}
              <div className="flex-1">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className={`font-syne text-sm ${notification.is_read ? 'font-bold text-accent' : 'font-extrabold text-primary'}`}>
                    {notification.title}
                  </h3>
                  <span className="text-[10px] font-medium text-gray-400 shrink-0 mt-0.5">
                    {getTimeAgo(notification.created_at)}
                  </span>
                </div>
                <p className={`text-sm ${notification.is_read ? 'text-gray-500' : 'text-gray-700 font-medium'} leading-snug`}>
                  {notification.body}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-4xl mb-4">
              🔕
            </div>
            <h3 className="text-xl font-syne font-bold text-accent mb-2">No notifications yet</h3>
            <p className="text-text-secondary text-sm max-w-[250px]">
              When you book a service or receive an update, it will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
