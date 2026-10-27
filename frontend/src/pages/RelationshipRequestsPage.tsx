import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { Check, X, Clock, Send } from 'lucide-react';

export function RelationshipRequestsPage() {
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['requests', tab],
    queryFn: () => api.get(`/relationships/requests?type=${tab}`).then(r => r.data.data),
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACCEPTED' | 'REJECTED' }) =>
      api.patch(`/relationships/requests/${id}`, { status }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['relationships'] });
      queryClient.invalidateQueries({ queryKey: ['family', 'graph'] });
      toast.success(vars.status === 'ACCEPTED' ? 'Request accepted!' : 'Request declined.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to respond to request.');
    },
  });

  const pendingReceived = (requests || []).filter((r: any) => r.status === 'PENDING');
  const processedReceived = (requests || []).filter((r: any) => r.status !== 'PENDING');

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>Relationship Requests</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Manage incoming and outgoing family connection requests
        </p>
      </div>

      <div className="page-body">
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(13,31,18,0.4)', padding: '0.25rem', borderRadius: '10px', width: 'fit-content' }}>
          <button
            className={`btn ${tab === 'received' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            onClick={() => setTab('received')}
          >
            <Clock size={14} /> Received
          </button>
          <button
            className={`btn ${tab === 'sent' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            onClick={() => setTab('sent')}
          >
            <Send size={14} /> Sent
          </button>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" />
          </div>
        ) : (requests || []).length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>
              No {tab} requests
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Pending first */}
            {tab === 'received' && pendingReceived.length > 0 && (
              <div>
                <h2 style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                  Awaiting Response
                </h2>
                {pendingReceived.map((req: any) => (
                  <RequestCard
                    key={req.id}
                    req={req}
                    type="received"
                    onAccept={() => respondMutation.mutate({ id: req.id, status: 'ACCEPTED' })}
                    onReject={() => respondMutation.mutate({ id: req.id, status: 'REJECTED' })}
                    isLoading={respondMutation.isPending}
                  />
                ))}
              </div>
            )}

            {/* Rest */}
            {(tab === 'sent' ? requests : processedReceived).map((req: any) => (
              <RequestCard key={req.id} req={req} type={tab} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCard({ req, type, onAccept, onReject, isLoading }: {
  req: any;
  type: 'received' | 'sent';
  onAccept?: () => void;
  onReject?: () => void;
  isLoading?: boolean;
}) {
  const person = type === 'received' ? req.requester : req.recipient;
  const statusColors: Record<string, string> = {
    PENDING: 'badge-pending',
    ACCEPTED: 'badge-accepted',
    REJECTED: 'badge-disputed',
    DISPUTED: 'badge-disputed',
  };

  return (
    <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="avatar avatar-md">{person.name[0].toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{person.name}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              {type === 'received'
                ? `Wants to connect as your ${req.relationshipType.toLowerCase()}`
                : `You requested as their ${req.relationshipType.toLowerCase()}`
              }
            </div>
            {req.message && (
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.3rem', fontStyle: 'italic' }}>
                "{req.message}"
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {type === 'received' && req.status === 'PENDING' ? (
            <>
              <button
                id={`reject-${req.id}`}
                className="btn btn-danger btn-sm"
                onClick={onReject}
                disabled={isLoading}
              >
                <X size={14} /> Decline
              </button>
              <button
                id={`accept-${req.id}`}
                className="btn btn-primary btn-sm"
                onClick={onAccept}
                disabled={isLoading}
              >
                <Check size={14} /> Accept
              </button>
            </>
          ) : (
            <span className={`badge ${statusColors[req.status] || 'badge-pending'}`}>
              {req.status.charAt(0) + req.status.slice(1).toLowerCase()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
