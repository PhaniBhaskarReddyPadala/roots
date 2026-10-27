import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { ArrowRight, GitBranch, ArrowLeft } from 'lucide-react';

export function HowRelatedPage() {
  const { userId } = useParams<{ userId: string }>();

  const { data: pathData, isLoading } = useQuery({
    queryKey: ['relationship-path', userId],
    queryFn: () => api.get(`/relationships/path/${userId}`).then(r => r.data),
    enabled: !!userId,
  });

  const { data: targetUser } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => api.get(`/users/${userId}`).then(r => r.data.data),
    enabled: !!userId,
  });

  const path = pathData?.data;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
          <Link to={`/users/${userId}`} className="btn btn-ghost btn-sm">
            <ArrowLeft size={16} /> Back to Profile
          </Link>
        </div>
        <h1 style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>How Are We Related?</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Relationship path between you and {targetUser?.name || 'this person'}
        </p>
      </div>

      <div className="page-body" style={{ maxWidth: '700px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '1rem' }}>
            <div className="spinner" />
            <span style={{ color: 'var(--color-text-muted)' }}>Calculating relationship path...</span>
          </div>
        ) : !path ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔗</div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: '0.75rem' }}>
              No Connection Found
            </h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              There is no known relationship path between you and {targetUser?.name || 'this person'}.
              You may need to establish connections with intermediate family members first.
            </p>
            <Link to="/search" className="btn btn-primary">Search People</Link>
          </div>
        ) : (
          <>
            {/* Relationship Label Card */}
            <div className="glass-card" style={{
              padding: '2rem',
              textAlign: 'center',
              marginBottom: '1.5rem',
              background: 'linear-gradient(135deg, rgba(37,81,47,0.3), rgba(13,31,18,0.6))',
              border: '1px solid rgba(58,133,81,0.3)',
            }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Relationship
              </div>
              <div style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '2.2rem',
                fontWeight: 700,
                color: 'var(--color-brand-300)',
                marginBottom: '0.5rem',
              }}>
                {path.relationshipLabel}
              </div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>
                {path.sourceUser.name} → {path.targetUser.name}
              </p>
              <div style={{ marginTop: '1rem' }}>
                <Link to="/family-tree" className="btn btn-secondary">
                  <GitBranch size={15} /> View Relationship in Family Tree
                </Link>
              </div>
            </div>

            {/* Step-by-step path */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h2 style={{
                fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 600,
                color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase',
                marginBottom: '1.5rem',
              }}>
                Relationship Path ({path.nodes.length} people, {path.relationships.length} step{path.relationships.length !== 1 ? 's' : ''})
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {path.nodes.map((node: any, i: number) => (
                  <div key={node.id}>
                    {/* Node */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '0.75rem 1rem',
                      background: i === 0 || i === path.nodes.length - 1
                        ? 'rgba(58,133,81,0.1)' : 'transparent',
                      borderRadius: '8px',
                      border: i === 0 || i === path.nodes.length - 1
                        ? '1px solid rgba(58,133,81,0.25)' : '1px solid transparent',
                    }}>
                      <div className="avatar avatar-sm" style={{
                        background: i === 0
                          ? 'linear-gradient(135deg, #2d6a3f, #52a66e)'
                          : i === path.nodes.length - 1
                          ? 'linear-gradient(135deg, #c9a227, #d4b347)'
                          : node.accountType === 'DUMMY'
                          ? 'var(--color-surface-700)'
                          : 'linear-gradient(135deg, #1e2e22, #263a2b)',
                      }}>
                        {node.name[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>
                          {node.name}
                          {i === 0 && <span style={{ color: 'var(--color-brand-300)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>(You)</span>}
                          {node.accountType === 'DUMMY' && <span className="badge badge-dummy" style={{ marginLeft: '0.5rem' }}>Dummy</span>}
                        </div>
                        {node.familySurname && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {node.familySurname}
                          </div>
                        )}
                      </div>
                      <Link to={`/users/${node.id}`} className="btn btn-ghost btn-sm">
                        View
                      </Link>
                    </div>

                    {/* Edge connector */}
                    {i < path.relationships.length && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.5rem 0 0.5rem 2rem',
                      }}>
                        <div style={{
                          width: '2px', height: '24px',
                          background: 'linear-gradient(180deg, var(--color-brand-500), var(--color-gold-400))',
                          marginLeft: '0.5rem',
                        }} />
                        <div style={{
                          background: 'rgba(201,162,39,0.1)',
                          border: '1px solid rgba(201,162,39,0.25)',
                          borderRadius: '6px',
                          padding: '0.25rem 0.75rem',
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          fontSize: '0.78rem',
                          color: 'var(--color-gold-300)',
                          fontWeight: 500,
                        }}>
                          <ArrowRight size={12} />
                          {formatRelType(path.relationships[i].relationshipType)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function formatRelType(type: string): string {
  return type.charAt(0) + type.slice(1).toLowerCase();
}
