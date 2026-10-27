import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Users, GitBranch, Shield, AlertTriangle } from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  ACCEPTED: { label: 'Accepted', className: 'badge-accepted' },
  VERIFIED: { label: 'Verified', className: 'badge-verified' },
  DISPUTED: { label: 'Disputed', className: 'badge-disputed' },
  PENDING: { label: 'Pending', className: 'badge-pending' },
};

export function RelationshipsPage() {
  const { data: relationships, isLoading } = useQuery({
    queryKey: ['relationships'],
    queryFn: () => api.get('/relationships').then(r => r.data.data),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <div className="spinner" />
    </div>
  );

  const grouped = (relationships || []).reduce((acc: any, rel: any) => {
    if (!acc[rel.status]) acc[rel.status] = [];
    acc[rel.status].push(rel);
    return acc;
  }, {});

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>My Relatives</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          {relationships?.length || 0} family connections
        </p>
      </div>

      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Summary row */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <SummaryBadge icon={<Users size={16} />} label="Total" value={(relationships || []).length} />
          <SummaryBadge icon={<Shield size={16} />} label="Verified" value={(grouped.VERIFIED || []).length} color="var(--color-verified)" />
          <SummaryBadge icon={<AlertTriangle size={16} />} label="Disputed" value={(grouped.DISPUTED || []).length} color="var(--color-disputed)" />
        </div>

        {/* Quick link to tree */}
        <Link to="/family-tree" className="glass-card glass-card-hover" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', borderColor: 'rgba(58,133,81,0.3)' }}>
          <GitBranch size={20} color="var(--color-brand-300)" />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>View Family Tree</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Interactive visualization of all connections</div>
          </div>
        </Link>

        {/* Relationship list */}
        {(relationships || []).length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <Users size={40} color="var(--color-brand-700)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', marginBottom: '0.5rem' }}>No relationships yet</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Connect with relatives or add dummy profiles to start your family tree.
            </p>
            <Link to="/search" className="btn btn-primary">Search People</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(relationships || []).map((rel: any) => {
              const statusInfo = STATUS_LABELS[rel.status] || { label: rel.status, className: 'badge-pending' };
              return (
                <div key={rel.id} className="glass-card glass-card-hover" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="avatar avatar-md" style={{ background: rel.relatedUser.accountType === 'DUMMY' ? 'var(--color-surface-700)' : undefined }}>
                        {rel.relatedUser.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {rel.relatedUser.name}
                          </span>
                          {rel.relatedUser.accountType === 'DUMMY' && (
                            <span className="badge badge-dummy">Dummy</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                          Your {rel.relationshipType.charAt(0) + rel.relationshipType.slice(1).toLowerCase()}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className={`badge ${statusInfo.className}`}>{statusInfo.label}</span>
                      <Link to={`/users/${rel.relatedUser.id}`} className="btn btn-ghost btn-sm">View</Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryBadge({ icon, label, value, color = 'var(--color-brand-300)' }: {
  icon: React.ReactNode; label: string; value: number; color?: string;
}) {
  return (
    <div className="glass-card" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ color }}>{icon}</span>
      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{value}</span>
      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{label}</span>
    </div>
  );
}
