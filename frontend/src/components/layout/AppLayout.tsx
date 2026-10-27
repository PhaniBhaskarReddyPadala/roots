import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import {
  Home, Users, GitBranch, Bell, Search, UserPlus,
  LogOut, TreePine, UserCircle, BookUser, CalendarDays
} from 'lucide-react';

export function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => api.get('/notifications?unread=true').then(r => r.data.data),
    refetchInterval: 30000,
  });

  const unreadCount = notifData?.unreadCount || 0;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(58,133,81,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.25rem', height: '2.25rem',
              background: 'linear-gradient(135deg, #2d6a3f, #52a66e)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TreePine size={18} color="white" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>
                Roots
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Family Network
              </div>
            </div>
          </div>
        </div>

        {/* User card */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(58,133,81,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="avatar avatar-md">{initials}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                {user?.familySurname ? `${user.familySurname} family` : 'My profile'}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>

          {/* Home Feed */}
          <NavLink to="/feed" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Home size={18} /> Feed
          </NavLink>

          <div style={{ height: '1px', background: 'rgba(58,133,81,0.1)', margin: '0.4rem 0' }} />
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.25rem' }}>
            Family
          </div>

          {/* Events */}
          <NavLink to="/events" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <CalendarDays size={18} /> Family Events
          </NavLink>

          <div style={{ height: '1px', background: 'rgba(58,133,81,0.1)', margin: '0.4rem 0' }} />
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.25rem' }}>
            Network
          </div>

          <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <UserCircle size={18} /> My Profile
          </NavLink>
          <NavLink to="/search" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Search size={18} /> Search People
          </NavLink>
          <NavLink to="/relationships" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Users size={18} /> My Relatives
          </NavLink>
          <NavLink to="/relationships/requests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <UserPlus size={18} /> Requests
          </NavLink>
          <NavLink to="/dummy-profiles" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <BookUser size={18} /> Dummy Profiles
          </NavLink>

          <div style={{ height: '1px', background: 'rgba(58,133,81,0.1)', margin: '0.4rem 0' }} />
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.25rem' }}>
            Family Tree
          </div>

          <NavLink to="/family-tree" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <GitBranch size={18} /> Family Tree
          </NavLink>

          <div style={{ height: '1px', background: 'rgba(58,133,81,0.1)', margin: '0.4rem 0' }} />

          <NavLink to="/notifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ position: 'relative' }}>
            <Bell size={18} /> Notifications
            {unreadCount > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: 'var(--color-gold-500)',
                color: '#0d1f12',
                borderRadius: '9999px',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.1rem 0.5rem',
                minWidth: '1.25rem',
                textAlign: 'center',
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
        </nav>

        {/* Logout */}
        <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid rgba(58,133,81,0.1)' }}>
          <button className="nav-item btn-danger" onClick={handleLogout} style={{ color: '#e05252' }}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
