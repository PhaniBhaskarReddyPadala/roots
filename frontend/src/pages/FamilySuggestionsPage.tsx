import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Loader2, Sparkles, GitBranch, UserPlus, Search, ChevronRight, Users } from 'lucide-react';
import api from '../lib/api';
import type { FamilySuggestion } from '../types';

function SuggestionCard({ s }: { s: FamilySuggestion }) {
  const initials = s.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      {/* Subtle gradient top border */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg, #7c3aed, #52a66e, transparent)',
      }} />

      {/* AI badge */}
      <div style={{
        position: 'absolute', top: '0.875rem', right: '0.875rem',
        background: 'rgba(124,58,237,0.15)', color: '#a78bfa',
        borderRadius: '6px', padding: '0.2rem 0.5rem',
        fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem',
      }}>
        <Sparkles size={10} /> AI Suggestion
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{
          width: '3rem', height: '3rem', borderRadius: '50%',
          background: s.accountType === 'DUMMY'
            ? 'linear-gradient(135deg, #374151, #4b5563)'
            : 'linear-gradient(135deg, #1e4d2b, #2d6a3f)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', fontWeight: 700, color: 'white', flexShrink: 0,
          border: '2px solid rgba(58,133,81,0.3)',
        }}>
          {initials}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)' }}>{s.name}</h3>
            {s.accountType === 'DUMMY' && (
              <span className="badge badge-dummy" style={{ fontSize: '0.65rem' }}>Dummy</span>
            )}
          </div>
          {s.familySurname && (
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{s.familySurname} Family</div>
          )}
        </div>
      </div>

      {/* Relationship suggestion */}
      <div style={{
        background: 'rgba(124,58,237,0.08)',
        border: '1px solid rgba(124,58,237,0.2)',
        borderRadius: '10px', padding: '0.875rem 1rem',
        marginBottom: '1rem',
      }}>
        <div style={{ fontSize: '0.72rem', color: '#a78bfa', fontWeight: 600, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Possible Relationship
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>
          {s.relationshipLabel}
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
          {s.pathDescription}
        </div>
      </div>

      {/* Path chain */}
      {s.pathNames.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
            Connected through
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            {s.pathNames.map((name, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{
                  background: 'rgba(58,133,81,0.12)', color: 'var(--color-brand-300)',
                  borderRadius: '6px', padding: '0.2rem 0.5rem', fontSize: '0.8rem', fontWeight: 500,
                }}>
                  {name}
                </span>
                {i < s.pathNames.length - 1 && <ChevronRight size={12} style={{ color: 'var(--color-text-muted)' }} />}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Distance badge */}
      <div style={{ marginBottom: '1rem' }}>
        <span style={{
          background: 'rgba(58,133,81,0.1)', color: 'var(--color-brand-400)',
          borderRadius: '6px', padding: '0.2rem 0.6rem', fontSize: '0.78rem', fontWeight: 500,
        }}>
          {s.hopsAway} step{s.hopsAway !== 1 ? 's' : ''} away in family network
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.625rem' }}>
        <Link to={`/users/${s.userId}`} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
          <Search size={14} /> View Profile
        </Link>
        <Link to={`/how-related/${s.userId}`} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
          <GitBranch size={14} /> How Related?
        </Link>
      </div>
    </div>
  );
}

export function FamilySuggestionsPage() {
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['suggestions'],
    queryFn: async () => {
      const res = await api.get('/suggestions');
      return res.data.data as FamilySuggestion[];
    },
  });

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ background: 'linear-gradient(180deg, rgba(124,58,237,0.1) 0%, transparent 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '2.75rem', height: '2.75rem', borderRadius: '12px',
            background: 'linear-gradient(135deg, #5b21b6, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
          }}>🤖</div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', marginBottom: '0.1rem' }}>
              AI Family Suggestions
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
              People in your family network who may be related to you — based on the family relationship graph
            </p>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* How it works */}
        <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem', background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <Sparkles size={18} style={{ color: '#a78bfa', flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <h3 style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.95rem', marginBottom: '0.35rem' }}>
                How AI Suggestions Work
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                ROOTS analyzes your family relationship graph and identifies people who are connected to you through 2–4 hops (e.g., your father's brother's son).
                These are real relationships derived from the family tree — not invented. The AI helps explain and rank them clearly.
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div style={{ textAlign: 'center' }}>
              <Loader2 size={36} className="animate-spin" style={{ color: '#a78bfa', marginBottom: '1rem' }} />
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Analyzing your family network…</p>
            </div>
          </div>
        ) : !suggestions?.length ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <Users size={48} style={{ color: 'var(--color-brand-600)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: '0.5rem' }}>
              No Suggestions Yet
            </h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Connect with more family members to discover extended relatives.
              The more connections you have, the better suggestions we can find.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Link to="/search" className="btn btn-primary"><UserPlus size={15} /> Connect Family</Link>
              <Link to="/family-tree" className="btn btn-secondary"><GitBranch size={15} /> View Family Tree</Link>
            </div>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Found {suggestions.length} potential relative{suggestions.length !== 1 ? 's' : ''} in your family network
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
              {suggestions.map(s => <SuggestionCard key={s.userId} s={s} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
