import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';

interface UserStatus {
  id: string;
  status: 'ONLINE' | 'OFFLINE' | 'AWAY' | 'BUSY' | 'DO_NOT_DISTURB';
  lastActive?: string;
}

export function useUserStatus() {
  const { data: session } = useSession();
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch current user status
  const fetchUserStatus = async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        const newStatus = {
          id: data.id,
          status: data.status || 'ONLINE', // Default to ONLINE if no status
          lastActive: data.lastActive,
        };
        setUserStatus(newStatus);
        return newStatus;
      }
    } catch (error) {
      console.error('Failed to fetch user status:', error);
      // Set default status if fetch fails
      setUserStatus({
        id: session.user.id,
        status: 'ONLINE',
        lastActive: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update user status
  const updateUserStatus = async (status: UserStatus['status']) => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/profile/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserStatus({
          id: data.id,
          status: data.status,
        });
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update user status:', error);
      throw error;
    }
  };

  // Auto-fetch status when session changes and set to ONLINE
  useEffect(() => {
    if (session?.user?.id) {
      fetchUserStatus().then(() => {
        // Automatically set user to ONLINE when they become active
        updateUserStatus('ONLINE');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // Auto-refresh status every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchUserStatus, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // Auto-set user online when window is focused/active
  useEffect(() => {
    const handleFocus = () => {
      if (session?.user?.id) {
        updateUserStatus('ONLINE');
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && session?.user?.id) {
        updateUserStatus('ONLINE');
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  return {
    userStatus,
    updateUserStatus,
    isLoading,
    refreshStatus: fetchUserStatus,
  };
}
