import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { Search, UserPlus, MapPin, MessageSquare, X } from 'lucide-react';

const RELATIONSHIP_TYPES = [
  'FATHER', 'MOTHER', 'PARENT', 'SON', 'DAUGHTER',
  'BROTHER', 'SISTER', 'UNCLE', 'AUNT', 'GRANDFATHER', 'GRANDMOTHER',
  'SPOUSE', 'HUSBAND', 'WIFE',
] as const;

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [relType, setRelType] = useState('');
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: results, isFetching } = useQuery({
    queryKey: ['search', query],
    queryFn: () => api.get(`/users/search?q=${encodeURIComponent(query)}`).then(r => r.data.data),
    enabled: query.length >= 2,
  });

  const sendRequestMutation = useMutation({
    mutationFn: () => api.post('/relationships/requests', {
      recipientId: selectedUser.id,
      relationshipType: relType,
      message: message || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['family', 'graph'] });
      toast.success(`Request sent to ${selectedUser.name}!`);
      setSelectedUser(null);
      setRelType('');
      setMessage('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to send request.');
    },
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>Search People</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Find registered family members to connect with
        </p>
      </div>

      <div className="page-body">
        {/* Search Input */}
        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            id="search-input"
            type="text"
            className="input-field"
            style={{ paddingLeft: '2.75rem', fontSize: '1rem' }}
            placeholder="Search by name, email, or family surname..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {/* Results */}
        {query.length >= 2 && (
          <div>
            {isFetching ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <div className="spinner" />
              </div>
            ) : results?.length === 0 ? (
              <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-muted)' }}>No users found for "{query}"</p>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  You can <Link to="/dummy-profiles" style={{ color: 'var(--color-brand-300)' }}>create a dummy profile</Link> for relatives not on Roots.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {results?.map((user: any) => (
                  <div key={user.id} className="glass-card glass-card-hover" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="avatar avatar-md">
                        {user.name[0].toUpperCase()}
                      </div>
                      <div>
                        <Link to={`/users/${user.id}`} style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>
                          {user.name}
                        </Link>
                        {user.familySurname && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{user.familySurname} Family</div>
                        )}
                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem' }}>
                          {user.regionOfOrigin && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              <MapPin size={10} /> {user.regionOfOrigin}
                            </span>
                          )}
                          {user.motherTongue && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              <MessageSquare size={10} /> {user.motherTongue}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      id={`connect-${user.id}`}
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedUser(user)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                    >
                      <UserPlus size={14} /> Connect
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {query.length < 2 && (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <Search size={40} color="var(--color-brand-700)" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--color-text-muted)' }}>Type at least 2 characters to search</p>
          </div>
        )}
      </div>

      {/* Connection Request Modal */}
      {selectedUser && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(8,15,10,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, backdropFilter: 'blur(4px)',
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '2rem', margin: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem' }}>
                Connect with {selectedUser.name}
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedUser(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="rel-type">They are my...</label>
                <select
                  id="rel-type"
                  className="input-field"
                  value={relType}
                  onChange={e => setRelType(e.target.value)}
                >
                  <option value="">Select relationship type</option>
                  {RELATIONSHIP_TYPES.map(t => (
                    <option key={t} value={t}>
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="rel-message">Message (optional)</label>
                <input
                  id="rel-message"
                  type="text"
                  className="input-field"
                  placeholder="Add a personal message..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-ghost" onClick={() => setSelectedUser(null)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button
                  id="send-request-btn"
                  className="btn btn-primary"
                  onClick={() => sendRequestMutation.mutate()}
                  disabled={!relType || sendRequestMutation.isPending}
                  style={{ flex: 1 }}
                >
                  {sendRequestMutation.isPending ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
