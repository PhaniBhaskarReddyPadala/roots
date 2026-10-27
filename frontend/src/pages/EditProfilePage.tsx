import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { Loader2, ArrowLeft, Save } from 'lucide-react';

const REGIONS = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bengal', 'Bihar',
  'Goa', 'Gujarat', 'Haryana', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu',
  'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'Other',
];

interface EditForm {
  name: string;
  regionOfOrigin: string;
  motherTongue: string;
  familySurname: string;
  surnameOrigin: string;
  casteSubcaste: string;
}

export function EditProfilePage() {
  const navigate = useNavigate();
  const { updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => api.get('/users/me').then(r => r.data.data),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<EditForm>({
    values: profile ? {
      name: profile.name || '',
      regionOfOrigin: profile.regionOfOrigin || '',
      motherTongue: profile.motherTongue || '',
      familySurname: profile.familySurname || '',
      surnameOrigin: profile.surnameOrigin || '',
      casteSubcaste: profile.casteSubcaste || '',
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: (data: EditForm) => {
      const payload = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== '')
      );
      return api.patch('/users/me', payload).then(r => r.data.data);
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully!');
      navigate('/profile');
    },
    onError: () => {
      toast.error('Failed to update profile. Please try again.');
    },
  });

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/profile')}>
            <ArrowLeft size={16} /> Back
          </button>
        </div>
        <h1 style={{ fontSize: '1.6rem' }}>Edit Profile</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
          Update your family network profile information
        </p>
      </div>

      <div className="page-body" style={{ maxWidth: '600px' }}>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <form
            onSubmit={handleSubmit((data) => updateMutation.mutate(data))}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            {/* Basic */}
            <div className="form-group">
              <label className="form-label" htmlFor="edit-name">Full Name</label>
              <input id="edit-name" type="text" className={`input-field ${errors.name ? 'error' : ''}`}
                {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
              />
              {errors.name && <span className="form-error">{errors.name.message}</span>}
            </div>

            <hr className="divider" />
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', background: 'rgba(13,31,18,0.4)', padding: '0.75rem 1rem', borderRadius: '8px', lineHeight: 1.6 }}>
              ⓘ The fields below are for your family profile only. They are not used as proof of family relationships.
            </p>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-region">Region of Origin</label>
              <select id="edit-region" className="input-field" {...register('regionOfOrigin')}>
                <option value="">Select region...</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-tongue">Mother Tongue</label>
              <input id="edit-tongue" type="text" className="input-field"
                placeholder="e.g. Telugu, Bengali, Punjabi"
                {...register('motherTongue')}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-surname">Family Surname</label>
              <input id="edit-surname" type="text" className="input-field"
                placeholder="e.g. Sharma, Rao, Singh"
                {...register('familySurname')}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-surname-origin">Surname Origin</label>
              <input id="edit-surname-origin" type="text" className="input-field"
                placeholder="Additional surname history"
                {...register('surnameOrigin')}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-caste">
                Caste / Subcaste
                <span style={{ marginLeft: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 400 }}>
                  (private — not shown to others)
                </span>
              </label>
              <input id="edit-caste" type="text" className="input-field"
                placeholder="Optional and private"
                {...register('casteSubcaste')}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/profile')}>
                Cancel
              </button>
              <button id="save-profile" type="submit" className="btn btn-primary" disabled={updateMutation.isPending} style={{ flex: 1 }}>
                {updateMutation.isPending ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Saving...</> : <><Save size={16} /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
