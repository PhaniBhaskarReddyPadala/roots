import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { BookUser, Plus, X, Loader2, UserCheck } from 'lucide-react';

const RELATIONSHIP_TYPES = [
  'FATHER', 'MOTHER', 'PARENT', 'SON', 'DAUGHTER',
  'BROTHER', 'SISTER', 'UNCLE', 'AUNT', 'GRANDFATHER', 'GRANDMOTHER',
  'SPOUSE', 'HUSBAND', 'WIFE',
] as const;

interface CreateDummyForm {
  name: string;
  regionOfOrigin: string;
  motherTongue: string;
  familySurname: string;
  relationshipType: string;
}

export function DummyProfilesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [claimId, setClaimId] = useState('');
  const queryClient = useQueryClient();

  const { data: relationships, isLoading } = useQuery({
    queryKey: ['relationships'],
    queryFn: () => api.get('/relationships').then(r => r.data.data),
  });

  const dummyRelatives = (relationships || []).filter((r: any) => r.relatedUser.accountType === 'DUMMY');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateDummyForm>();

  const createMutation = useMutation({
    mutationFn: (data: CreateDummyForm) => api.post('/dummy-profiles', data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationships'] });
      queryClient.invalidateQueries({ queryKey: ['family', 'graph'] });
      toast.success('Dummy profile created!');
      setShowCreate(false);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to create dummy profile.');
    },
  });

  const claimMutation = useMutation({
    mutationFn: (dummyId: string) => api.post(`/dummy-profiles/${dummyId}/claim`).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationships'] });
      queryClient.invalidateQueries({ queryKey: ['family', 'graph'] });
      toast.success('Profile claimed! Relationships have been transferred to your account.');
      setClaimId('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to claim profile.');
    },
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>Dummy Profiles</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Represent relatives who are not yet on Roots
            </p>
          </div>
          <button
            id="create-dummy-btn"
            className="btn btn-primary"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={16} /> Add Dummy Relative
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Info box */}
        <div style={{
          background: 'rgba(13,31,18,0.5)',
          border: '1px solid rgba(58,133,81,0.2)',
          borderRadius: '10px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          fontSize: '0.83rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6,
        }}>
          <strong style={{ color: 'var(--color-brand-300)' }}>What are dummy profiles?</strong> A dummy profile lets you represent a relative in your family tree even if they haven't joined Roots yet. When they join, they can claim the dummy profile and their relationships will automatically be preserved.
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" />
          </div>
        ) : dummyRelatives.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <BookUser size={40} color="var(--color-brand-700)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', marginBottom: '0.5rem' }}>
              No dummy profiles yet
            </h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Add relatives who aren't on Roots yet to include them in your family tree.
            </p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Add First Dummy Relative
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {dummyRelatives.map((rel: any) => (
              <div key={rel.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="avatar avatar-md" style={{ background: 'var(--color-surface-700)' }}>
                    {rel.relatedUser.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {rel.relatedUser.name}
                      <span className="badge badge-dummy">Dummy</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      Your {rel.relationshipType.charAt(0) + rel.relationshipType.slice(1).toLowerCase()}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    id={`claim-${rel.relatedUser.id}`}
                    className="btn btn-secondary btn-sm"
                    onClick={() => setClaimId(rel.relatedUser.id)}
                  >
                    <UserCheck size={14} /> Claim This Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,15,10,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '460px', padding: '2rem', margin: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem' }}>Add Dummy Relative</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit(data => createMutation.mutate(data))} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="dummy-name">Full Name *</label>
                <input id="dummy-name" type="text" className={`input-field ${errors.name ? 'error' : ''}`}
                  placeholder="Relative's full name"
                  {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
                />
                {errors.name && <span className="form-error">{errors.name.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="dummy-rel-type">They are my... *</label>
                <select id="dummy-rel-type" className={`input-field ${errors.relationshipType ? 'error' : ''}`}
                  {...register('relationshipType', { required: 'Relationship type is required' })}
                >
                  <option value="">Select relationship</option>
                  {RELATIONSHIP_TYPES.map(t => (
                    <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                  ))}
                </select>
                {errors.relationshipType && <span className="form-error">{errors.relationshipType.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="dummy-region">Region of Origin</label>
                <input id="dummy-region" type="text" className="input-field" placeholder="Optional" {...register('regionOfOrigin')} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="dummy-tongue">Mother Tongue</label>
                <input id="dummy-tongue" type="text" className="input-field" placeholder="Optional" {...register('motherTongue')} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="dummy-surname">Family Surname</label>
                <input id="dummy-surname" type="text" className="input-field" placeholder="Optional" {...register('familySurname')} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)} style={{ flex: 1 }}>Cancel</button>
                <button id="create-dummy-submit" type="submit" className="btn btn-primary" disabled={createMutation.isPending} style={{ flex: 1 }}>
                  {createMutation.isPending ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Plus size={16} />}
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claim confirm modal */}
      {claimId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,15,10,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem', margin: '1rem', textAlign: 'center' }}>
            <UserCheck size={40} color="var(--color-brand-400)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', marginBottom: '0.75rem' }}>Claim This Profile?</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              All family relationships connected to this dummy profile will be transferred to your account. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-ghost" onClick={() => setClaimId('')} style={{ flex: 1 }}>Cancel</button>
              <button
                id="confirm-claim-btn"
                className="btn btn-primary"
                onClick={() => claimMutation.mutate(claimId)}
                disabled={claimMutation.isPending}
                style={{ flex: 1 }}
              >
                {claimMutation.isPending ? 'Claiming...' : 'Confirm Claim'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
