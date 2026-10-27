import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Heart, MessageSquare, Send, Loader2, Calendar,
  UserPlus, UserCircle, Image as ImageIcon, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

// ── Helpers ──────────────────────────────────
function timeAgo(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ── Comment Section ──────────────────────────
function CommentSection({ entryId }: { entryId: string }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<{ content: string }>();

  const { data: comments, isLoading } = useQuery({
    queryKey: ['feed-comments', entryId],
    queryFn: () => api.get(`/timeline/${entryId}/comments`).then(r => r.data.data),
  });

  const commentMutation = useMutation({
    mutationFn: (d: { content: string }) => api.post(`/timeline/${entryId}/comments`, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-comments', entryId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      reset();
    },
  });

  return (
    <div style={{ padding: '0 1rem 1rem' }}>
      {isLoading ? null : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {comments?.map((c: any) => (
            <div key={c.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <div className="avatar avatar-sm" style={{ width: '1.6rem', height: '1.6rem', fontSize: '0.6rem', flexShrink: 0 }}>
                {c.author.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-brand-200)', marginRight: '0.4rem' }}>{c.author.name}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>{c.content}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit(d => commentMutation.mutate(d))} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          {...register('content', { required: true })}
          placeholder="Add a comment…"
          style={{
            flex: 1, background: 'rgba(13,31,18,0.6)', border: '1px solid rgba(58,133,81,0.2)',
            borderRadius: '9999px', padding: '0.45rem 0.875rem',
            color: 'var(--color-text-primary)', fontSize: '0.85rem', outline: 'none',
          }}
        />
        <button type="submit" disabled={commentMutation.isPending}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-brand-400)', padding: '0 0.25rem' }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

// ── Post Card ────────────────────────────────
function PostCard({ entry }: { entry: any }) {
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);

  const likeMutation = useMutation({
    mutationFn: () => api.post(`/timeline/${entry.id}/like`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });

  return (
    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem' }}>
        <Link to={`/users/${entry.author.id}`}>
          <div className="avatar avatar-sm" style={{ width: '2.25rem', height: '2.25rem', fontSize: '0.85rem' }}>
            {entry.author.name.charAt(0)}
          </div>
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link to={`/users/${entry.author.id}`} style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)', textDecoration: 'none' }}>
            {entry.author.name}
          </Link>
          {entry.title && (
            <div style={{ fontSize: '0.78rem', color: 'var(--color-brand-300)', fontWeight: 600 }}>{entry.title}</div>
          )}
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
          {timeAgo(entry.eventDate || entry.createdAt)}
        </span>
      </div>

      {/* Image */}
      {entry.imageUrl && (
        <img src={entry.imageUrl} alt="Post" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', display: 'block' }} />
      )}

      {/* Caption */}
      {entry.content && (
        <div style={{ padding: '0.75rem 1rem 0.25rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          <span style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginRight: '0.4rem' }}>{entry.author.name}</span>
          {entry.content}
        </div>
      )}

      {/* Event date if present */}
      {entry.eventDate && entry.title && (
        <div style={{ padding: '0.25rem 1rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
          📅 {new Date(entry.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.625rem 1rem', borderTop: '1px solid rgba(58,133,81,0.08)' }}>
        <button onClick={() => likeMutation.mutate()} disabled={likeMutation.isPending}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: 'none', cursor: 'pointer', color: entry.hasLiked ? '#f87171' : 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.15s' }}>
          <Heart size={18} fill={entry.hasLiked ? '#f87171' : 'none'} strokeWidth={entry.hasLiked ? 2 : 1.5} />
          {entry._count.likes > 0 && <span>{entry._count.likes}</span>}
        </button>
        <button onClick={() => setShowComments(s => !s)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>
          <MessageSquare size={18} strokeWidth={1.5} />
          {entry._count.comments > 0 && <span>{entry._count.comments}</span>}
        </button>
        {entry._count.comments > 0 && !showComments && (
          <button onClick={() => setShowComments(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.78rem', marginLeft: 'auto' }}>
            View all {entry._count.comments} comments
          </button>
        )}
      </div>

      {showComments && <CommentSection entryId={entry.id} />}
    </div>
  );
}

// ── Event Card ───────────────────────────────
function EventCard({ entry }: { entry: any }) {
  const rsvpColors: Record<string, string> = {
    GOING: '#4ade80', INTERESTED: '#fbbf24', CANT_GO: '#f87171', PENDING: 'var(--color-text-muted)',
  };
  const rsvpLabels: Record<string, string> = {
    GOING: '✅ Going', INTERESTED: '⭐ Interested', CANT_GO: '❌ Can\'t Go', PENDING: '⏳ Awaiting RSVP',
  };

  return (
    <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(167,139,250,0.2)' }}>
      <div style={{ height: '3px', background: 'linear-gradient(90deg, #a78bfa, transparent)' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem' }}>
        <Link to={`/users/${entry.author.id}`}>
          <div className="avatar avatar-sm" style={{ width: '2.25rem', height: '2.25rem', fontSize: '0.85rem' }}>
            {entry.author.name.charAt(0)}
          </div>
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link to={`/users/${entry.author.id}`} style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)', textDecoration: 'none' }}>
              {entry.author.name}
            </Link>
            <span style={{ fontSize: '0.72rem', background: 'rgba(167,139,250,0.12)', color: '#a78bfa', borderRadius: '5px', padding: '0.1rem 0.45rem', fontWeight: 600 }}>
              🎉 created an event
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
            {timeAgo(entry.eventDate || entry.createdAt)}
          </div>
        </div>
        {entry.myRsvp && (
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: rsvpColors[entry.myRsvp] }}>
            {rsvpLabels[entry.myRsvp]}
          </span>
        )}
      </div>

      {/* Event body */}
      <div style={{ padding: '0 1rem 0.75rem' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--color-text-primary)', fontWeight: 700, marginBottom: '0.35rem' }}>
          {entry.title}
        </div>
        {entry.content && entry.content !== `${entry.author.name} created this event.` && (
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', lineHeight: 1.6 }}>{entry.content}</p>
        )}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            📅 {new Date(entry.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          {entry.familyEvent?.location && <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>📍 {entry.familyEvent.location}</span>}
          {entry.inviteCount > 0 && <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>👥 {entry.inviteCount} invited</span>}
        </div>
        <Link to={`/events/${entry.familyEventId}`} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Calendar size={13} /> View Event & RSVP
        </Link>
      </div>
    </div>
  );
}

// ── Suggestion Card ──────────────────────────
function SuggestionCard({ suggestion }: { suggestion: any }) {
  const [dismissed, setDismissed] = useState(false);
  const initials = suggestion.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  if (dismissed) return null;

  return (
    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1rem' }}>
        <Link to={`/users/${suggestion.userId}`}>
          <div className="avatar" style={{ width: '3rem', height: '3rem', fontSize: '1rem' }}>
            {initials}
          </div>
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link to={`/users/${suggestion.userId}`} style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)', textDecoration: 'none', display: 'block' }}>
            {suggestion.name}
          </Link>
          {/* Relationship: e.g. "He might be your Uncle" */}
          <div style={{ fontSize: '0.8rem', color: 'var(--color-brand-300)', marginTop: '0.1rem' }}>
            Might be your <strong>{suggestion.relationshipLabel}</strong>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>{suggestion.pathDescription}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flexShrink: 0 }}>
          <Link to={`/users/${suggestion.userId}`} className="btn btn-primary btn-sm" style={{ fontSize: '0.78rem', padding: '0.35rem 0.875rem' }}>
            View Profile
          </Link>
          <button onClick={() => setDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.72rem', textAlign: 'center' }}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create Post Box ──────────────────────────
function CreatePostBox({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuthStore();
  const [expanded, setExpanded] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const { register, handleSubmit, reset, watch } = useForm<{ content: string; title?: string; eventDate?: string }>();
  const content = watch('content');

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const entryType = data.title ? 'EVENT_MEMORY' : 'POST';
      return api.post('/timeline', { ...data, entryType, imageUrl: imageBase64 });
    },
    onSuccess: () => {
      toast.success('Posted! 🌳');
      reset();
      setImageBase64(null);
      setExpanded(false);
      onCreated();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to post'),
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <div className="glass-card" style={{ padding: '1rem', marginBottom: '0.5rem' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: expanded ? '0.75rem' : '0' }}>
        <div className="avatar avatar-sm" style={{ width: '2.25rem', height: '2.25rem', fontSize: '0.85rem', flexShrink: 0 }}>{initials}</div>

        {!expanded ? (
          /* Collapsed: show a single clickable row */
          <button
            onClick={() => setExpanded(true)}
            style={{
              flex: 1, textAlign: 'left', background: 'rgba(13,31,18,0.5)',
              border: '1px solid rgba(58,133,81,0.2)', borderRadius: '10px',
              padding: '0.7rem 1rem', color: 'var(--color-text-muted)',
              fontSize: '0.9rem', cursor: 'pointer',
            }}
          >
            Share a memory or event…
          </button>
        ) : (
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>Add Memory</span>
        )}

        {!expanded && (
          <label style={{ cursor: 'pointer', flexShrink: 0 }}>
            <div className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ImageIcon size={15} /> Photo
            </div>
            <input type="file" accept="image/*" onChange={(e) => { handleImageChange(e); setExpanded(true); }} style={{ display: 'none' }} />
          </label>
        )}
      </div>

      {expanded && (
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <textarea
              {...register('content', { required: true })}
              placeholder="What's the memory? Write a caption…"
              rows={3}
              autoFocus
              style={{
                width: '100%', background: 'rgba(13,31,18,0.5)',
                border: '1px solid rgba(58,133,81,0.2)', borderRadius: '10px',
                padding: '0.625rem 0.875rem', color: 'var(--color-text-primary)',
                fontSize: '0.9rem', outline: 'none', resize: 'none',
                fontFamily: 'var(--font-sans)',
              }}
            />

            <input
              {...register('title')}
              placeholder="Event name (optional, e.g. Rahul's Wedding)"
              style={{
                width: '100%', background: 'rgba(13,31,18,0.5)', border: '1px solid rgba(58,133,81,0.2)',
                borderRadius: '8px', padding: '0.5rem 0.75rem', color: 'var(--color-text-primary)',
                fontSize: '0.85rem', outline: 'none',
              }}
            />

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.2rem' }}>Date (optional)</label>
                <input type="date" {...register('eventDate')}
                  style={{
                    width: '100%', background: 'rgba(13,31,18,0.5)', border: '1px solid rgba(58,133,81,0.2)',
                    borderRadius: '8px', padding: '0.45rem 0.75rem', color: 'var(--color-text-primary)',
                    fontSize: '0.85rem', outline: 'none',
                  }}
                />
              </div>
              <label style={{ cursor: 'pointer', flexShrink: 0 }}>
                <div className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ImageIcon size={15} /> {imageBase64 ? 'Change' : 'Add Photo'}
                </div>
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              </label>
            </div>

            {imageBase64 && (
              <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(58,133,81,0.15)' }}>
                <img src={imageBase64} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} />
                <button onClick={() => setImageBase64(null)} style={{ position: 'absolute', top: '0.4rem', right: '0.4rem', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', cursor: 'pointer', color: 'white', display: 'flex', padding: '0.25rem' }}>
                  <X size={14} />
                </button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" onClick={() => { setExpanded(false); reset(); setImageBase64(null); }} className="btn btn-secondary btn-sm">Cancel</button>
              <button type="submit" disabled={createMutation.isPending || !content} className="btn btn-primary btn-sm">
                {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Post Memory'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Main Feed Page ───────────────────────────
export function FeedPage() {
  const queryClient = useQueryClient();

  // Fetch merged feed (own posts + family events from all family members)
  const { data: feedItems, isLoading } = useQuery({
    queryKey: ['feed'],
    queryFn: () => api.get('/timeline/me').then(r => r.data.data),
    refetchInterval: 60000,
  });

  // Fetch suggestions to inline into feed
  const { data: suggestions } = useQuery({
    queryKey: ['suggestions'],
    queryFn: () => api.get('/suggestions').then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  // Build interleaved feed with suggestions injected every ~5 posts
  const buildFeedWithSuggestions = () => {
    const items: { type: 'post' | 'event' | 'suggestion'; data: any }[] = [];
    if (!feedItems) return items;

    let suggestionIndex = 0;
    for (let i = 0; i < feedItems.length; i++) {
      const item = feedItems[i];
      items.push({ type: item._isEvent ? 'event' : 'post', data: item });

      // Inject a suggestion card every 5 items
      if ((i + 1) % 5 === 0 && suggestions && suggestionIndex < suggestions.length) {
        items.push({ type: 'suggestion', data: suggestions[suggestionIndex++] });
      }
    }
    // If feed is empty but we have suggestions, still show them
    if (feedItems.length === 0 && suggestions?.length > 0) {
      suggestions.slice(0, 3).forEach((s: any) => items.push({ type: 'suggestion', data: s }));
    }
    return items;
  };

  const feedWithSuggestions = buildFeedWithSuggestions();

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Create post box */}
      <CreatePostBox onCreated={() => queryClient.invalidateQueries({ queryKey: ['feed'] })} />

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-brand-400)' }} />
        </div>
      )}

      {/* Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginTop: '0.875rem' }}>
        {feedWithSuggestions.map((item, index) => {
          if (item.type === 'event') return <EventCard key={`event-${item.data.id}-${index}`} entry={item.data} />;
          if (item.type === 'suggestion') return (
            <div key={`suggestion-${item.data.userId}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <UserCircle size={13} style={{ color: 'var(--color-text-muted)' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>People you may know</span>
              </div>
              <SuggestionCard suggestion={item.data} />
            </div>
          );
          return <PostCard key={`post-${item.data.id}`} entry={item.data} />;
        })}

        {!isLoading && feedWithSuggestions.length === 0 && (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🌱</div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Your feed is empty</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Connect with family members to see their posts and events here.
            </p>
            <Link to="/search" className="btn btn-primary btn-sm">
              <UserPlus size={14} /> Find Family
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
