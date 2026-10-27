import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { Bell, Check, CheckCheck } from 'lucide-react';

const NOTIF_ICONS: Record<string, string> = {
  RELATIONSHIP_REQUEST: '🤝',
  REQUEST_ACCEPTED: '✅',
  REQUEST_REJECTED: '❌',
  RELATIONSHIP_VERIFIED: '🛡️',
  RELATIONSHIP_DISPUTED: '⚠️',
  DUMMY_PROFILE_CLAIMED: '👤',
  RELATIONSHIP_STATUS_UPDATE: '📋',
};

export function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data.data),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read.');
    },
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>Notifications</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              id="mark-all-read"
              className="btn btn-secondary btn-sm"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
            >
              <CheckCheck size={14} /> Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <Bell size={40} color="var(--color-brand-700)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', marginBottom: '0.5rem' }}>
              No notifications yet
            </h3>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Relationship updates will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {notifications.map((notif: any) => (
              <div
                key={notif.id}
                className="glass-card"
                style={{
                  padding: '1.1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  opacity: notif.read ? 0.7 : 1,
                  borderColor: notif.read ? 'rgba(58,133,81,0.1)' : 'rgba(58,133,81,0.3)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: '1.4rem', flexShrink: 0, lineHeight: 1 }}>
                  {NOTIF_ICONS[notif.type] || '🔔'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                    {notif.title}
                  </div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                    {notif.body}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                    {new Date(notif.createdAt).toLocaleString()}
                  </div>
                </div>
                {!notif.read && (
                  <button
                    id={`read-${notif.id}`}
                    className="btn btn-ghost btn-sm"
                    onClick={() => markReadMutation.mutate(notif.id)}
                    style={{ flexShrink: 0 }}
                    title="Mark as read"
                  >
                    <Check size={14} />
                  </button>
                )}
                {!notif.read && (
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: 'var(--color-gold-400)',
                    flexShrink: 0, marginTop: '0.35rem',
                  }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
