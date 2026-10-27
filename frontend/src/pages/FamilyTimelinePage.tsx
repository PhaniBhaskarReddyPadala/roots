import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Heart, MessageSquare, Send, Loader2, Calendar, Plus, ChevronDown, ChevronUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import type { TimelineEntry, Comment, TimelineEntryType } from '../types';

// ── Entry type config ────────────────────────
const ENTRY_CONFIGS: Record<TimelineEntryType, { icon: string; label: string; color: string; bgColor: string }> = {
  POST: { icon: '📸', label: 'Memory', color: '#52a66e', bgColor: 'rgba(82,166,110,0.12)' },
  MILESTONE: { icon: '🎓', label: 'Milestone', color: '#f0b95e', bgColor: 'rgba(240,185,94,0.12)' },
  EVENT_MEMORY: { icon: '💍', label: 'Event Memory', color: '#a78bfa', bgColor: 'rgba(167,139,250,0.12)' },
};

function formatTimelineDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function groupByMonth(entries: TimelineEntry[]) {
  const groups: Record<string, TimelineEntry[]> = {};
  for (const entry of entries) {
    const date = new Date(entry.eventDate || entry.createdAt);
    const key = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  }
  return groups;
}

// ── Comment Section ──────────────────────────
function CommentSection({ entryId }: { entryId: string }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<{ content: string }>();

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', entryId],
    queryFn: async () => {
      const res = await api.get(`/timeline/${entryId}/comments`);
      return res.data.data as Comment[];
    },
  });

  const commentMutation = useMutation({
    mutationFn: (d: { content: string }) => api.post(`/timeline/${entryId}/comments`, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', entryId] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      reset();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to comment'),
  });

  return (
    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(58,133,81,0.12)' }}>
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
          <Loader2 size={18} className="animate-spin" style={{ color: 'var(--color-brand-400)' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
          {comments?.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: '0.625rem' }}>
              <div className="avatar avatar-sm" style={{ flexShrink: 0, width: '1.75rem', height: '1.75rem', fontSize: '0.65rem' }}>
                {c.author.name.charAt(0)}
              </div>
              <div style={{
                background: 'rgba(13,31,18,0.6)',
                borderRadius: '0 1rem 1rem 1rem',
                padding: '0.5rem 0.875rem',
                flex: 1,
                border: '1px solid rgba(58,133,81,0.1)',
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-brand-300)', marginBottom: '0.15rem' }}>
                  {c.author.name}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{c.content}</div>
              </div>
            </div>
          ))}
          {!comments?.length && (
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>No comments yet.</p>
          )}
        </div>
      )}
      <form onSubmit={handleSubmit(d => commentMutation.mutate(d))} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          {...register('content', { required: true })}
          placeholder="Write a comment…"
          disabled={commentMutation.isPending}
          style={{
            flex: 1, background: 'rgba(13,31,18,0.6)', border: '1px solid rgba(58,133,81,0.2)',
            borderRadius: '9999px', padding: '0.5rem 1rem', color: 'var(--color-text-primary)',
            fontSize: '0.875rem', outline: 'none',
          }}
        />
        <button type="submit" disabled={commentMutation.isPending} className="btn btn-primary btn-sm" style={{ borderRadius: '9999px', padding: '0.5rem 0.875rem' }}>
          {commentMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </form>
    </div>
  );
}

// ── Event Timeline Card ───────────────────────
function EventTimelineCard({ entry }: { entry: any }) {
  const rsvpColors: Record<string, string> = {
    GOING: '#4ade80', INTERESTED: '#fbbf24', CANT_GO: '#f87171', PENDING: 'var(--color-text-muted)',
  };
  const rsvpLabels: Record<string, string> = {
    GOING: '✅ Going', INTERESTED: '⭐ Interested', CANT_GO: '❌ Can\'t Go', PENDING: '⏳ Awaiting RSVP',
  };
  return (
    <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden', border: '1px solid rgba(167,139,250,0.2)' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #a78bfa, transparent)' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to={`/users/${entry.author.id}`}>
            <div className="avatar avatar-sm">{entry.author.name.charAt(0)}</div>
          </Link>
          <div>
            <Link to={`/users/${entry.author.id}`} style={{ fontWeight: 600, color: 'var(--color-brand-200)', fontSize: '0.9rem', textDecoration: 'none' }}>
              {entry.author.name}
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
              <span style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa', borderRadius: '6px', padding: '0.2rem 0.5rem', fontSize: '0.72rem', fontWeight: 600 }}>
                🎉 Family Event
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {formatTimelineDate(entry.eventDate || entry.createdAt)}
              </span>
            </div>
          </div>
        </div>
        {entry.myRsvp && (
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: rsvpColors[entry.myRsvp] }}>
            {rsvpLabels[entry.myRsvp]}
          </span>
        )}
      </div>

      {/* Event Name */}
      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
        {entry.title}
      </h3>

      {/* Description */}
      {entry.content && entry.content !== `${entry.author.name} created this event.` && (
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '0.75rem', whiteSpace: 'pre-wrap' }}>
          {entry.content}
        </p>
      )}

      {/* Meta info */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {entry.familyEvent?.location && (
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>📍 {entry.familyEvent.location}</span>
        )}
        {entry.inviteCount > 0 && (
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>👥 {entry.inviteCount} invited</span>
        )}
      </div>

      {/* View Event button */}
      <Link
        to={`/events/${entry.familyEventId}`}
        className="btn btn-secondary btn-sm"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
      >
        <Calendar size={13} /> View Event & RSVP
      </Link>
    </div>
  );
}

// ── Timeline Entry Card ──────────────────────
function TimelineCard({ entry, showAuthor = false }: { entry: any; showAuthor?: boolean }) {
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);

  // Event entries get their own card
  if (entry._isEvent) return <EventTimelineCard entry={entry} />;

  const cfg = ENTRY_CONFIGS[entry.entryType as TimelineEntryType] || ENTRY_CONFIGS.POST;

  const likeMutation = useMutation({
    mutationFn: () => api.post(`/timeline/${entry.id}/like`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timeline'] }),
  });

  return (
    <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      {/* Entry type ribbon */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: `linear-gradient(90deg, ${cfg.color}, transparent)`,
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {showAuthor && (
            <Link to={`/users/${entry.author.id}`}>
              <div className="avatar avatar-sm">{entry.author.name.charAt(0)}</div>
            </Link>
          )}
          <div>
            {showAuthor && (
              <Link to={`/users/${entry.author.id}`} style={{ fontWeight: 600, color: 'var(--color-brand-200)', fontSize: '0.9rem', textDecoration: 'none' }}>
                {entry.author.name}
              </Link>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                background: cfg.bgColor, color: cfg.color,
                borderRadius: '6px', padding: '0.2rem 0.5rem',
                fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem',
              }}>
                {cfg.icon} {cfg.label}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {formatTimelineDate(entry.eventDate || entry.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Title (for milestone / event memory) */}
      {entry.title && (
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
          {entry.title}
        </h3>
      )}

      {/* Event link */}
      {entry.familyEvent && (
        <Link to={`/events/${entry.familyEvent.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#a78bfa', marginBottom: '0.75rem', textDecoration: 'none' }}>
          <Calendar size={13} /> {entry.familyEvent.title}
        </Link>
      )}

      {/* Content */}
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
        {entry.content}
      </p>

      {/* Image */}
      {entry.imageUrl && (
        <div style={{ marginBottom: '1rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(58,133,81,0.15)' }}>
          <img src={entry.imageUrl} alt="Memory" style={{ width: '100%', maxHeight: '360px', objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', paddingTop: '0.875rem', borderTop: '1px solid rgba(58,133,81,0.1)' }}>
        <button
          onClick={() => likeMutation.mutate()}
          disabled={likeMutation.isPending}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'none', border: 'none', cursor: 'pointer',
            color: entry.hasLiked ? '#f87171' : 'var(--color-text-muted)',
            fontSize: '0.875rem', fontWeight: 500,
            transition: 'color 0.2s',
          }}
        >
          <Heart size={16} fill={entry.hasLiked ? '#f87171' : 'none'} />
          {entry._count.likes}
        </button>
        <button
          onClick={() => setShowComments(s => !s)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: 500,
          }}
        >
          <MessageSquare size={16} />
          {entry._count.comments}
          {showComments ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {showComments && <CommentSection entryId={entry.id} />}
    </div>
  );
}

// ── Create Entry Form ────────────────────────
function CreateEntryForm({ onCreated }: { onCreated: () => void }) {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm<{
    content: string;
    title?: string;
    eventDate?: string;
  }>();

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      // Automatically determine entry type based on whether a title is provided
      const entryType = data.title ? 'EVENT_MEMORY' : 'POST';
      return api.post('/timeline', { ...data, entryType, imageUrl: imageBase64 });
    },
    onSuccess: () => {
      toast.success('Added to your Family Timeline! 🌳');
      reset();
      setImageBase64(null);
      onCreated();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create entry'),
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--color-text-primary)' }}>
        Add to Family Timeline
      </h2>

      <form onSubmit={handleSubmit(d => createMutation.mutate(d))}>
        <input
          {...register('title')}
          placeholder="Event name (e.g. Rahul's Marriage) - Optional"
          style={{
            width: '100%', marginBottom: '0.75rem', padding: '0.625rem 0.875rem',
            background: 'rgba(13,31,18,0.6)', border: '1px solid rgba(58,133,81,0.2)',
            borderRadius: '8px', color: 'var(--color-text-primary)', fontSize: '0.9rem', outline: 'none',
          }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.3rem' }}>Date (Optional)</label>
            <input
              type="date"
              {...register('eventDate')}
              style={{
                width: '100%', padding: '0.625rem 0.875rem',
                background: 'rgba(13,31,18,0.6)', border: '1px solid rgba(58,133,81,0.2)',
                borderRadius: '8px', color: 'var(--color-text-primary)', fontSize: '0.9rem', outline: 'none',
              }}
            />
          </div>
        </div>

        <textarea
          {...register('content', { required: true })}
          placeholder="Share a family memory or describe an event..."
          rows={3}
          style={{
            width: '100%', marginBottom: '0.75rem', padding: '0.625rem 0.875rem',
            background: 'rgba(13,31,18,0.6)', border: '1px solid rgba(58,133,81,0.2)',
            borderRadius: '8px', color: 'var(--color-text-primary)', fontSize: '0.9rem', outline: 'none',
            resize: 'vertical', fontFamily: 'var(--font-sans)',
          }}
        />

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.3rem' }}>Photo (Optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{
              width: '100%', padding: '0.625rem 0.875rem',
              background: 'rgba(13,31,18,0.6)', border: '1px solid rgba(58,133,81,0.2)',
              borderRadius: '8px', color: 'var(--color-text-primary)', fontSize: '0.875rem', outline: 'none',
            }}
          />
          {imageBase64 && (
            <div style={{ marginTop: '0.5rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(58,133,81,0.15)' }}>
              <img src={imageBase64} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={createMutation.isPending} className="btn btn-primary">
            {createMutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><Plus size={15} /> Add to Timeline</>}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Main Page ────────────────────────────────
export function FamilyTimelinePage() {
  const queryClient = useQueryClient();

  const { data: entries, isLoading } = useQuery({
    queryKey: ['timeline', 'me'],
    queryFn: async () => {
      const res = await api.get('/timeline/me');
      return res.data.data as TimelineEntry[];
    },
  });

  const grouped = entries ? groupByMonth(entries) : {};
  const months = Object.keys(grouped);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ background: 'linear-gradient(180deg, rgba(37,81,47,0.2) 0%, transparent 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: '2.75rem', height: '2.75rem', borderRadius: '12px',
            background: 'linear-gradient(135deg, #2d6a3f, #52a66e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
          }}>🌳</div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', marginBottom: '0.1rem' }}>
              My Family Timeline
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
              Your posts, milestones, and memories — all part of your family history
            </p>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Create form */}
        <CreateEntryForm onCreated={() => queryClient.invalidateQueries({ queryKey: ['timeline', 'me'] })} />

        {/* Timeline */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-brand-400)' }} />
          </div>
        ) : months.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌱</div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: '0.5rem' }}>
              Your timeline is empty
            </h3>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Start adding your family memories, milestones, and moments above.
            </p>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Timeline spine */}
            <div style={{
              position: 'absolute', left: '1.1rem', top: 0, bottom: 0,
              width: '2px', background: 'linear-gradient(180deg, rgba(82,166,110,0.4), rgba(82,166,110,0.05))',
            }} />

            {months.map(month => (
              <div key={month} style={{ marginBottom: '2rem' }}>
                {/* Month label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '2.25rem', height: '2.25rem', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2d6a3f, #52a66e)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, zIndex: 1,
                  }}>
                    <Calendar size={12} color="white" />
                  </div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-brand-300)', letterSpacing: '0.03em' }}>
                    {month}
                  </h2>
                </div>

                {/* Entries for this month */}
                <div style={{ marginLeft: '3.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {grouped[month].map(entry => (
                    <TimelineCard key={entry.id} entry={entry} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { TimelineCard };
