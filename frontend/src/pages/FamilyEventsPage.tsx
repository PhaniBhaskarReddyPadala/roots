import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { CalendarDays, MapPin, Clock, Plus, Loader2, ChevronRight, CheckCircle2, Circle, HelpCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import type { FamilyEvent, RsvpStatus } from '../types';

const RSVP_CONFIG = {
  GOING: { label: 'Going', icon: <CheckCircle2 size={15} />, color: '#52a66e', bg: 'rgba(82,166,110,0.12)' },
  INTERESTED: { label: 'Interested', icon: <HelpCircle size={15} />, color: '#f0b95e', bg: 'rgba(240,185,94,0.12)' },
  CANT_GO: { label: "Can't Go", icon: <XCircle size={15} />, color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  PENDING: { label: 'Pending', icon: <Circle size={15} />, color: 'var(--color-text-muted)', bg: 'transparent' },
};

function EventCard({ event }: { event: FamilyEvent }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isHost = event.hostId === user?.id;
  const eventDate = new Date(event.eventDate);
  const isPast = eventDate < new Date();

  const rsvpMutation = useMutation({
    mutationFn: (rsvpStatus: RsvpStatus) => api.patch(`/events/${event.id}/rsvp`, { rsvpStatus }),
    onSuccess: () => {
      toast.success('RSVP updated!');
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update RSVP'),
  });

  const myRsvp = event.myRsvp as string;
  const rsvpKeys = (['GOING', 'INTERESTED', 'CANT_GO'] as RsvpStatus[]);

  return (
    <div className="glass-card glass-card-hover" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      {/* Past event overlay */}
      {isPast && (
        <div style={{
          position: 'absolute', top: '0.75rem', right: '0.75rem',
          background: 'rgba(58,133,81,0.12)', color: 'var(--color-brand-400)',
          borderRadius: '6px', padding: '0.2rem 0.6rem', fontSize: '0.72rem', fontWeight: 600,
        }}>
          Past Event
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '0.25rem', color: 'var(--color-text-primary)' }}>
            {event.title}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--color-brand-400)', fontSize: '0.78rem', fontWeight: 500 }}>
              Hosted by {isHost ? 'You' : event.host.name}
            </span>
          </div>
        </div>
      </div>

      {/* Event details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          <CalendarDays size={15} style={{ color: 'var(--color-brand-400)', flexShrink: 0 }} />
          {eventDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        {event.eventTime && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            <Clock size={15} style={{ color: 'var(--color-brand-400)', flexShrink: 0 }} /> {event.eventTime}
          </div>
        )}
        {event.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            <MapPin size={15} style={{ color: 'var(--color-brand-400)', flexShrink: 0 }} /> {event.location}
          </div>
        )}
      </div>

      {/* RSVP counts */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {Object.entries(RSVP_CONFIG).filter(([k]) => k !== 'PENDING').map(([status, cfg]) => (
          <div key={status} style={{
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            color: cfg.color, fontSize: '0.8rem', fontWeight: 500,
          }}>
            {cfg.icon}
            {event.rsvpCounts[status as keyof typeof event.rsvpCounts]}
            <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* RSVP buttons (only for invitees, not host) */}
      {!isHost && !isPast && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {rsvpKeys.map(status => {
            const cfg = RSVP_CONFIG[status];
            const isSelected = myRsvp === status;
            return (
              <button
                key={status}
                onClick={() => rsvpMutation.mutate(status)}
                disabled={rsvpMutation.isPending}
                style={{
                  flex: 1, padding: '0.5rem 0.25rem', borderRadius: '8px',
                  border: `1.5px solid ${isSelected ? cfg.color : 'rgba(58,133,81,0.15)'}`,
                  background: isSelected ? cfg.bg : 'transparent',
                  color: isSelected ? cfg.color : 'var(--color-text-muted)',
                  cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                  transition: 'all 0.2s',
                }}
              >
                {cfg.icon} {cfg.label}
              </button>
            );
          })}
        </div>
      )}
      {isHost && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
          background: 'rgba(82,166,110,0.12)', color: 'var(--color-brand-300)',
          borderRadius: '6px', padding: '0.3rem 0.75rem', fontSize: '0.8rem', fontWeight: 500,
          marginBottom: '1rem',
        }}>
          <CheckCircle2 size={14} /> You are the host
        </div>
      )}

      <Link to={`/events/${event.id}`} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        View Event <ChevronRight size={14} />
      </Link>
    </div>
  );
}

// ── Create Event Form ────────────────────────
function CreateEventModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    title: string;
    eventDate: string;
    eventTime?: string;
    location?: string;
    description?: string;
  }>();
  const { data: relsData } = useQuery({
    queryKey: ['relationships'],
    queryFn: () => api.get('/relationships').then(r => r.data.data),
  });
  const [selectedInvitees, setSelectedInvitees] = useState<string[]>([]);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/events', { ...data, inviteeIds: selectedInvitees }),
    onSuccess: () => {
      toast.success('Event created! Invitations sent 🎉');
      reset();
      onCreated();
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create event'),
  });

  const toggleInvitee = (id: string) => {
    setSelectedInvitees(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem', overflowY: 'auto'
    }} onClick={onClose}>
      <div
        className="glass-card"
        style={{ maxWidth: '520px', width: '100%', padding: '2rem', margin: 'auto', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
          Create Family Event
        </h2>

        <form onSubmit={handleSubmit(d => createMutation.mutate(d))}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <input
              {...register('title', { required: 'Event name is required' })}
              placeholder="Event name (e.g. Rahul's Marriage)"
              className="input-field"
            />
            {errors.title && <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '-0.5rem' }}>{errors.title.message}</p>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.3rem' }}>Date *</label>
                <input type="date" {...register('eventDate', { required: true })} className="input-field" />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.3rem' }}>Time</label>
                <input {...register('eventTime')} placeholder="e.g. 7:00 PM" className="input-field" />
              </div>
            </div>

            <input {...register('location')} placeholder="Location (e.g. Hyderabad)" className="input-field" />
            <textarea {...register('description')} placeholder="Description (optional)" rows={2} className="input-field" style={{ resize: 'vertical' }} />

            {/* Invite family */}
            {relsData && relsData.length > 0 && (
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                  Invite Family Members
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {relsData.map((rel: any) => (
                    <label key={rel.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', padding: '0.5rem 0.75rem', borderRadius: '8px', background: selectedInvitees.includes(rel.relatedUser.id) ? 'rgba(58,133,81,0.1)' : 'transparent', transition: 'background 0.2s' }}>
                      <input
                        type="checkbox"
                        checked={selectedInvitees.includes(rel.relatedUser.id)}
                        onChange={() => toggleInvitee(rel.relatedUser.id)}
                        style={{ accentColor: 'var(--color-brand-400)' }}
                      />
                      <div className="avatar avatar-sm" style={{ width: '1.75rem', height: '1.75rem', fontSize: '0.7rem', flexShrink: 0 }}>
                        {rel.relatedUser.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>{rel.relatedUser.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{rel.relationshipType.toLowerCase()}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {selectedInvitees.length > 0 && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-brand-300)', marginTop: '0.5rem' }}>
                    {selectedInvitees.length} family member{selectedInvitees.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="btn btn-primary">
                {createMutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Creating…</> : 'Create Event'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────
export function FamilyEventsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await api.get('/events');
      return res.data.data as FamilyEvent[];
    },
  });

  const upcoming = events?.filter(e => new Date(e.eventDate) >= new Date()) ?? [];
  const past = events?.filter(e => new Date(e.eventDate) < new Date()) ?? [];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {showCreate && (
        <CreateEventModal
          onClose={() => setShowCreate(false)}
          onCreated={() => queryClient.invalidateQueries({ queryKey: ['events'] })}
        />
      )}

      {/* Header */}
      <div className="page-header" style={{ background: 'linear-gradient(180deg, rgba(37,81,47,0.2) 0%, transparent 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '2.75rem', height: '2.75rem', borderRadius: '12px',
              background: 'linear-gradient(135deg, #5b21b6, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
            }}>📅</div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', marginBottom: '0.1rem' }}>Family Events</h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                Organize gatherings and celebrations with your family
              </p>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> Create Event
          </button>
        </div>
      </div>

      <div className="page-body">
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-brand-400)' }} />
          </div>
        ) : (
          <>
            {/* Upcoming events */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                Upcoming Events ({upcoming.length})
              </h2>
              {upcoming.length === 0 ? (
                <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📅</div>
                  <p style={{ color: 'var(--color-text-muted)' }}>No upcoming events. Create one to gather the family!</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                  {upcoming.map(event => <EventCard key={event.id} event={event} />)}
                </div>
              )}
            </div>

            {/* Past events */}
            {past.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                  Past Events ({past.length})
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                  {past.map(event => <EventCard key={event.id} event={event} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
