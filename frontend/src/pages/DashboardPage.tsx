import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { Users, GitBranch, Bell, UserPlus, TreePine, ArrowRight, Clock, CalendarDays, Sparkles } from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuthStore();

  const { data: relsData } = useQuery({
    queryKey: ['relationships'],
    queryFn: () => api.get('/relationships').then(r => r.data.data),
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => api.get('/notifications?unread=true').then(r => r.data.data),
  });

  const { data: requestsData } = useQuery({
    queryKey: ['requests', 'received'],
    queryFn: () => api.get('/relationships/requests?type=received').then(r => r.data.data),
  });

  const pendingRequests = requestsData?.filter((r: any) => r.status === 'PENDING') || [];
  const totalRelatives = relsData?.length || 0;
  const unreadNotifs = notifData?.unreadCount || 0;

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{
        background: 'linear-gradient(180deg, rgba(37,81,47,0.2) 0%, transparent 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="avatar avatar-xl animate-pulse-glow">{initials}</div>
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>
              Welcome, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              {user?.familySurname ? `${user.familySurname} Family Network` : 'Your Family Network'} · Roots
            </p>
          </div>
        </div>
      </div>

      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <StatCard
            icon={<Users size={22} />}
            label="Connected Relatives"
            value={totalRelatives}
            color="var(--color-brand-400)"
            link="/relationships"
          />
          <StatCard
            icon={<UserPlus size={22} />}
            label="Pending Requests"
            value={pendingRequests.length}
            color="var(--color-gold-400)"
            link="/relationships/requests"
            highlight={pendingRequests.length > 0}
          />
          <StatCard
            icon={<Bell size={22} />}
            label="Unread Notifications"
            value={unreadNotifs}
            color="#e05252"
            link="/notifications"
            highlight={unreadNotifs > 0}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '0.02em' }}>
            Quick Actions
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <ActionCard
              icon={<Clock size={24} />}
              title="My Family Timeline"
              description="Add memories, milestones, and moments"
              link="/timeline"
            />
            <ActionCard
              icon={<CalendarDays size={24} />}
              title="Family Events"
              description="Organize gatherings and invite relatives"
              link="/events"
            />
            <ActionCard
              icon={<GitBranch size={24} />}
              title="View Family Tree"
              description="Explore your family network visually"
              link="/family-tree"
            />
            <ActionCard
              icon={<Sparkles size={24} />}
              title="AI Suggestions"
              description="Discover potential relatives via graph"
              link="/suggestions"
              accentColor="#a78bfa"
            />
            <ActionCard
              icon={<UserPlus size={24} />}
              title="Add a Relative"
              description="Search and connect with family members"
              link="/search"
            />
            <ActionCard
              icon={<Bell size={24} />}
              title="Notifications"
              description="Check relationship and event updates"
              link="/notifications"
              badge={unreadNotifs > 0 ? unreadNotifs : undefined}
            />
          </div>
        </div>

        {/* Pending Requests Preview */}
        {pendingRequests.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                Pending Requests
              </h2>
              <Link to="/relationships/requests" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--color-brand-300)' }}>
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pendingRequests.slice(0, 3).map((req: any) => (
                <div key={req.id} className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="avatar avatar-sm">
                      {req.requester.name[0].toUpperCase()}
                    </div>
                    <div>
                      <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{req.requester.name}</span>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        {' '}wants to connect as your {req.relationshipType.toLowerCase()}
                      </span>
                    </div>
                  </div>
                  <Link to="/relationships/requests" className="btn btn-secondary btn-sm">Respond</Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state if no relatives */}
        {totalRelatives === 0 && (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <TreePine size={48} color="var(--color-brand-600)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: '0.5rem' }}>
              Start Building Your Family Tree
            </h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Search for relatives or create dummy profiles for family members not yet on Roots.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link to="/search" className="btn btn-primary">Search People</Link>
              <Link to="/dummy-profiles" className="btn btn-secondary">Add Dummy Profile</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, link, highlight = false }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  link: string;
  highlight?: boolean;
}) {
  return (
    <Link to={link} style={{ textDecoration: 'none' }}>
      <div className={`glass-card glass-card-hover ${highlight ? 'animate-pulse-glow' : ''}`} style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ color, background: `${color}20`, borderRadius: '8px', padding: '0.5rem', display: 'flex' }}>
            {icon}
          </div>
          <ArrowRight size={16} color="var(--color-text-muted)" />
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1, marginBottom: '0.25rem' }}>
          {value}
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
          {label}
        </div>
      </div>
    </Link>
  );
}

function ActionCard({ icon, title, description, link, badge, accentColor }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  badge?: number;
  accentColor?: string;
}) {
  const color = accentColor || 'var(--color-brand-300)';
  const bg = accentColor ? `${accentColor}20` : 'rgba(58,133,81,0.12)';
  return (
    <Link to={link} style={{ textDecoration: 'none' }}>
      <div className="glass-card glass-card-hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{
          color,
          background: bg,
          borderRadius: '10px',
          padding: '0.625rem',
          display: 'flex',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>{title}</span>
            {badge && (
              <span style={{
                background: 'var(--color-gold-500)', color: '#0d1f12',
                borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700,
                padding: '0.1rem 0.4rem',
              }}>
                {badge}
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{description}</p>
        </div>
      </div>
    </Link>
  );
}

