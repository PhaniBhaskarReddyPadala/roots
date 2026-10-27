import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { Edit, MapPin, MessageSquare, Users, Shield } from 'lucide-react';

export function ProfilePage() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => api.get('/users/me').then(r => r.data.data),
  });

  const { data: relsData } = useQuery({
    queryKey: ['relationships'],
    queryFn: () => api.get('/relationships').then(r => r.data.data),
  });

  if (isLoading) return <LoadingState />;

  const profile = data || user;
  const initials = profile?.name
    ? profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const verifiedCount = relsData?.filter((r: any) => r.status === 'VERIFIED').length || 0;
  const totalCount = relsData?.length || 0;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{
        background: 'linear-gradient(180deg, rgba(37,81,47,0.25) 0%, transparent 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div className="avatar avatar-xl" style={{ fontSize: '2rem' }}>{initials}</div>
            <div>
              <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{profile?.name}</h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                {profile?.familySurname ? `${profile.familySurname} Family` : 'Member'} · Roots
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                {profile?.regionOfOrigin && (
                  <span className="badge badge-accepted">
                    <MapPin size={10} /> {profile.regionOfOrigin}
                  </span>
                )}
                {profile?.motherTongue && (
                  <span className="badge badge-pending">
                    <MessageSquare size={10} /> {profile.motherTongue}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Link to="/profile/edit" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Edit size={16} /> Edit Profile
          </Link>
        </div>
      </div>

      <div className="page-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Profile Info */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
            Profile Information
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <ProfileField label="Full Name" value={profile?.name} />
            <ProfileField label="Email" value={profile?.email} />
            <ProfileField label="Region of Origin" value={profile?.regionOfOrigin} />
            <ProfileField label="Mother Tongue" value={profile?.motherTongue} />
            <ProfileField label="Family Surname" value={profile?.familySurname} />
            <ProfileField label="Surname Origin" value={profile?.surnameOrigin} />
          </div>
        </div>

        {/* Network Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
              Family Network
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <NetworkStat icon={<Users size={18} />} value={totalCount} label="Total Relatives" color="var(--color-brand-400)" />
              <NetworkStat icon={<Shield size={18} />} value={verifiedCount} label="Verified" color="var(--color-verified)" />
            </div>
            <Link to="/family-tree" className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}>
              View Family Tree
            </Link>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Privacy Note
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              Your caste/subcaste and other sensitive information are private by default and are not used as proof of family relationships.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ borderBottom: '1px solid rgba(58,133,81,0.08)', paddingBottom: '0.75rem' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem', fontWeight: 500 }}>{label}</div>
      <div style={{ color: value ? 'var(--color-text-primary)' : 'var(--color-text-muted)', fontSize: '0.9rem' }}>
        {value || '—'}
      </div>
    </div>
  );
}

function NetworkStat({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(13,31,18,0.4)', borderRadius: '8px' }}>
      <div style={{ color, marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{label}</div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <div className="spinner" />
    </div>
  );
}
