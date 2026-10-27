import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  CalendarDays, MapPin, Clock, Loader2, CheckCircle2, HelpCircle, XCircle, Circle, ArrowLeft, Users
} from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import type { FamilyEvent, RsvpStatus } from '../types';

const RSVP_CONFIG = {
  GOING: { label: 'Going', icon: <CheckCircle2 size={16} />, color: '#52a66e', bg: 'rgba(82,166,110,0.15)' },
  INTERESTED: { label: 'Interested', icon: <HelpCircle size={16} />, color: '#f0b95e', bg: 'rgba(240,185,94,0.15)' },
  CANT_GO: { label: "Can't Go", icon: <XCircle size={16} />, color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
  PENDING: { label: 'Pending', icon: <Circle size={16} />, color: 'var(--color-text-muted)', bg: 'transparent' },
};

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const res = await api.get(`/events/${id}`);
      return res.data.data as FamilyEvent;
    },
    enabled: !!id,
  });

  const rsvpMutation = useMutation({
    mutationFn: (rsvpStatus: RsvpStatus) => api.patch(`/events/${id}/rsvp`, { rsvpStatus }),
    onSuccess: () => {
      toast.success('RSVP updated!');
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update RSVP'),
  });

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-brand-400)' }} />
    </div>
  );

  if (!event) return (
    <div className="page-body">
      <p style={{ color: 'var(--color-text-muted)' }}>Event not found.</p>
    </div>
  );

  const isHost = event.hostId === user?.id;
  const eventDate = new Date(event.eventDate);
  const isPast = eventDate < new Date();
  const myRsvp = event.myRsvp as string;
  const rsvpKeys = (['GOING', 'INTERESTED', 'CANT_GO'] as RsvpStatus[]);

  const goingList = event.invitees.filter(i => i.rsvpStatus === 'GOING');
  const interestedList = event.invitees.filter(i => i.rsvpStatus === 'INTERESTED');
  const cantGoList = event.invitees.filter(i => i.rsvpStatus === 'CANT_GO');
  const pendingList = event.invitees.filter(i => i.rsvpStatus === 'PENDING');

  return (
    <div className="animate-fade-in" style={{ maxWidth: '760px', margin: '0 auto' }}>
      {/* Back */}
      <div className="page-header">
        <Link to="/events" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', textDecoration: 'none', marginBottom: '1.25rem' }}>
          <ArrowLeft size={15} /> Back to Events
        </Link>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
              {isPast ? '📸' : '📅'}
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '0.5rem' }}>
              {event.title}
            </h1>
            <p style={{ color: 'var(--color-brand-300)', fontSize: '0.88rem' }}>
              Hosted by {isHost ? 'You' : event.host.name}
            </p>
          </div>

          {isPast && (
            <div style={{
              background: 'rgba(58,133,81,0.12)', color: 'var(--color-brand-400)',
              borderRadius: '8px', padding: '0.4rem 0.875rem', fontSize: '0.82rem', fontWeight: 600,
            }}>
              Past Event — Memory
            </div>
          )}
        </div>
      </div>

      <div className="page-body" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Main column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Event info card */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              Event Details
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-secondary)' }}>
                <CalendarDays size={18} style={{ color: 'var(--color-brand-400)', flexShrink: 0 }} />
                <span>{eventDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              {event.eventTime && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  <Clock size={18} style={{ color: 'var(--color-brand-400)', flexShrink: 0 }} />
                  <span>{event.eventTime}</span>
                </div>
              )}
              {event.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  <MapPin size={18} style={{ color: 'var(--color-brand-400)', flexShrink: 0 }} />
                  <span>{event.location}</span>
                </div>
              )}
            </div>

            {event.description && (
              <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(58,133,81,0.1)' }}>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>
                  {event.description}
                </p>
              </div>
            )}
          </div>

          {/* RSVP section */}
          {!isHost && !isPast && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
                Your RSVP
              </h2>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {rsvpKeys.map(status => {
                  const cfg = RSVP_CONFIG[status];
                  const isSelected = myRsvp === status;
                  return (
                    <button
                      key={status}
                      onClick={() => rsvpMutation.mutate(status)}
                      disabled={rsvpMutation.isPending}
                      style={{
                        flex: 1, padding: '0.75rem 0.5rem', borderRadius: '10px',
                        border: `1.5px solid ${isSelected ? cfg.color : 'rgba(58,133,81,0.15)'}`,
                        background: isSelected ? cfg.bg : 'transparent',
                        color: isSelected ? cfg.color : 'var(--color-text-muted)',
                        cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                        transition: 'all 0.2s',
                      }}
                    >
                      {cfg.icon} {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* RSVP summary */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={14} /> Invited — {event.invitees.length} family members</div>
            </h2>

            {[
              { label: 'Going', list: isHost ? [{ id: 'host', userId: event.hostId, rsvpStatus: 'GOING' as RsvpStatus, user: event.host }, ...goingList] : goingList, color: '#52a66e' },
              { label: 'Interested', list: interestedList, color: '#f0b95e' },
              { label: "Can't Go", list: cantGoList, color: '#f87171' },
              { label: 'Pending', list: pendingList, color: 'var(--color-text-muted)' },
            ].filter(g => g.list.length > 0).map(group => (
              <div key={group.label} style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: group.color, marginBottom: '0.5rem' }}>
                  {group.label} · {group.list.length}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {group.list.map((inv: any) => (
                    <Link key={inv.id} to={`/users/${inv.userId}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: 'rgba(13,31,18,0.5)', border: '1px solid rgba(58,133,81,0.12)',
                        borderRadius: '9999px', padding: '0.3rem 0.625rem 0.3rem 0.375rem', cursor: 'pointer',
                      }}>
                        <div className="avatar avatar-sm" style={{ width: '1.5rem', height: '1.5rem', fontSize: '0.65rem', flexShrink: 0 }}>
                          {inv.user.name.charAt(0)}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{inv.user.name}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: RSVP counts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.entries(RSVP_CONFIG).filter(([k]) => k !== 'PENDING').map(([status, cfg]) => (
            <div key={status} className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ color: cfg.color, background: cfg.bg, borderRadius: '8px', padding: '0.5rem', display: 'flex' }}>
                {cfg.icon}
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>
                  {event.rsvpCounts[status as keyof typeof event.rsvpCounts]}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{cfg.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
