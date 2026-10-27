import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { GitBranch, Search as SearchIcon, MapPin, MessageSquare, UserPlus } from 'lucide-react';
import { TimelineCard } from './FamilyTimelinePage';
import type { TimelineEntry } from '../types';

type ProfileTab = 'info' | 'connection' | 'timeline';

export function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ProfileTab>('info');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => api.get(`/users/${id}`).then(r => r.data.data),
    enabled: !!id,
  });

  const { data: pathData } = useQuery({
    queryKey: ['relationship-path', id],
    queryFn: () => api.get(`/relationships/path/${id}`).then(r => r.data.data),
    enabled: !!id && id !== currentUser?.id,
  });

  const { data: timeline } = useQuery({
    queryKey: ['timeline', 'user', id],
    queryFn: async () => {
      const res = await api.get(`/timeline/user/${id}`);
      return res.data.data as TimelineEntry[];
    },
    enabled: !!id && activeTab === 'timeline',
  });

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <div className="spinner" />
    </div>
  );

  if (!profile) return (
    <div className="page-body">
      <p style={{ color: 'var(--color-text-muted)' }}>User not found.</p>
    </div>
  );

  const isOwnProfile = id === currentUser?.id;
  const initials = profile.name
    ? profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const tabs: { id: ProfileTab; label: string; emoji: string }[] = [
    { id: 'info', label: 'Profile', emoji: '👤' },
    ...(!isOwnProfile ? [{ id: 'connection' as ProfileTab, label: 'Connection', emoji: '🔗' }] : []),
    { id: 'timeline', label: 'Family Timeline', emoji: '🌳' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ background: 'linear-gradient(180deg, rgba(37,81,47,0.2) 0%, transparent 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div
              className="avatar avatar-xl"
              style={profile.accountType === 'DUMMY' ? { background: 'var(--color-surface-700)' } : {}}
            >
              {initials}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <h1 style={{ fontSize: '1.75rem' }}>{profile.name}</h1>
                {profile.accountType === 'DUMMY' && (
                  <span className="badge badge-dummy">Dummy Profile</span>
                )}
              </div>
              {profile.familySurname && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  {profile.familySurname} Family
                </p>
              )}
              {pathData && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem',
                  background: 'rgba(58,133,81,0.1)', color: 'var(--color-brand-300)',
                  borderRadius: '6px', padding: '0.2rem 0.625rem', fontSize: '0.8rem', fontWeight: 500,
                }}>
                  🔗 {pathData.relationshipLabel}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                {profile.regionOfOrigin && (
                  <span className="badge badge-accepted">
                    <MapPin size={10} /> {profile.regionOfOrigin}
                  </span>
                )}
                {profile.motherTongue && (
                  <span className="badge badge-pending">
                    <MessageSquare size={10} /> {profile.motherTongue}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!isOwnProfile && (
              <>
                <Link to={`/how-related/${id}`} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <SearchIcon size={15} /> How Related?
                </Link>
                {pathData && (
                  <Link to="/family-tree" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <GitBranch size={15} /> Family Tree
                  </Link>
                )}
              </>
            )}
            {isOwnProfile && (
              <Link to="/profile/edit" className="btn btn-secondary">Edit Profile</Link>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', marginTop: '1.5rem', borderBottom: '1px solid rgba(58,133,81,0.15)', paddingBottom: '0' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.625rem 1.25rem',
                background: 'none', border: 'none', cursor: 'pointer',
                color: activeTab === tab.id ? 'var(--color-brand-300)' : 'var(--color-text-muted)',
                fontWeight: activeTab === tab.id ? 700 : 400,
                fontSize: '0.875rem',
                borderBottom: activeTab === tab.id ? '2px solid var(--color-brand-400)' : '2px solid transparent',
                marginBottom: '-1px', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-body">
        {/* Profile Info tab */}
        {activeTab === 'info' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
                Profile Information
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <ProfileField label="Full Name" value={profile.name} />
                <ProfileField label="Region of Origin" value={profile.regionOfOrigin} />
                <ProfileField label="Mother Tongue" value={profile.motherTongue} />
                <ProfileField label="Family Surname" value={profile.familySurname} />
              </div>
            </div>

            {profile.accountType === 'DUMMY' && !isOwnProfile && (
              <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(13,31,18,0.6)' }}>
                <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                  Claim This Profile
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', marginBottom: '1rem' }}>
                  If this dummy profile represents you, you can claim it to merge these family connections with your account.
                </p>
                <Link to="/dummy-profiles" className="btn btn-primary btn-sm">
                  Manage Dummy Profiles
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Connection tab */}
        {activeTab === 'connection' && !isOwnProfile && (
          <div className="glass-card" style={{ padding: '1.5rem', maxWidth: '480px' }}>
            <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
              Your Connection
            </h2>
            {pathData ? (
              <div>
                <div style={{
                  background: 'rgba(58,133,81,0.1)', border: '1px solid rgba(58,133,81,0.25)',
                  borderRadius: '10px', padding: '1rem', marginBottom: '1rem',
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Relationship</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brand-300)' }}>
                    {pathData.relationshipLabel}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    {pathData.nodes?.length - 1} step{pathData.nodes?.length !== 2 ? 's' : ''} away
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/how-related/${id}`} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                    <SearchIcon size={14} /> How Related?
                  </Link>
                  <Link to="/family-tree" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                    <GitBranch size={14} /> View in Tree
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginBottom: '1rem' }}>
                  No known connection path found.
                </p>
                <Link to="/search" className="btn btn-secondary btn-sm">
                  <UserPlus size={14} /> Connect
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Family Timeline tab */}
        {activeTab === 'timeline' && (
          <div>
            {!timeline ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <div className="spinner" />
              </div>
            ) : timeline.length === 0 ? (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🌱</div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', marginBottom: '0.5rem' }}>
                  No timeline entries yet
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  {isOwnProfile ? 'Start adding your family memories and milestones.' : `${profile.name} hasn't added any timeline entries yet.`}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {timeline.map(entry => (
                  <TimelineCard key={entry.id} entry={entry} showAuthor={false} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ borderBottom: '1px solid rgba(58,133,81,0.08)', paddingBottom: '0.75rem' }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ color: value ? 'var(--color-text-primary)' : 'var(--color-text-muted)', fontSize: '0.9rem' }}>
        {value || '—'}
      </div>
    </div>
  );
}
