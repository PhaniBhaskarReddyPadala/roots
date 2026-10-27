import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { TreePine, Eye, EyeOff, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  regionOfOrigin?: string;
  motherTongue?: string;
  familySurname?: string;
  surnameOrigin?: string;
}

const REGIONS = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bengal', 'Bihar',
  'Goa', 'Gujarat', 'Haryana', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu',
  'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'Other',
];

export function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showAdditional, setShowAdditional] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const password = watch('password');

  const registerMutation = useMutation({
    mutationFn: (data: RegisterForm) => {
      const { confirmPassword, ...payload } = data;
      return api.post('/auth/register', payload).then(r => r.data);
    },
    onSuccess: (data) => {
      setAuth(data.data.user, data.data.token);
      toast.success(`Welcome to Roots, ${data.data.user.name}!`);
      navigate('/dashboard');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.');
    },
  });

  return (
    <div className="auth-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div className="animate-fade-in" style={{ width: '100%', maxWidth: '480px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '3.5rem', height: '3.5rem',
            background: 'linear-gradient(135deg, #2d6a3f, #52a66e)',
            borderRadius: '16px',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: '0 0 24px rgba(58,133,81,0.4)',
          }}>
            <TreePine size={28} color="white" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
            Join Roots
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Start building your family network
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <form
            onSubmit={handleSubmit((data) => registerMutation.mutate(data))}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}
          >
            {/* Required fields */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name *</label>
              <input
                id="reg-name"
                type="text"
                className={`input-field ${errors.name ? 'error' : ''}`}
                placeholder="Your full name"
                {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
              />
              {errors.name && <span className="form-error">{errors.name.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email Address *</label>
              <input
                id="reg-email"
                type="email"
                className={`input-field ${errors.email ? 'error' : ''}`}
                placeholder="you@example.com"
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email && <span className="form-error">{errors.email.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input-field ${errors.password ? 'error' : ''}`}
                  placeholder="At least 8 characters"
                  style={{ paddingRight: '2.75rem' }}
                  {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'At least 8 characters' } })}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">Confirm Password *</label>
              <input
                id="reg-confirm"
                type="password"
                className={`input-field ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Repeat your password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: v => v === password || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword && <span className="form-error">{errors.confirmPassword.message}</span>}
            </div>

            {/* Optional profile fields toggle */}
            <button
              type="button"
              onClick={() => setShowAdditional(!showAdditional)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-brand-300)', fontSize: '0.85rem', fontWeight: 500,
                padding: '0.25rem 0',
              }}
            >
              {showAdditional ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showAdditional ? 'Hide' : 'Add'} family profile details (optional)
            </button>

            {showAdditional && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', background: 'rgba(13,31,18,0.4)', borderRadius: '8px', border: '1px solid rgba(58,133,81,0.15)' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  These fields are for your profile only. They are not used as proof of family relationships.
                </p>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-region">Region of Origin</label>
                  <select id="reg-region" className="input-field" {...register('regionOfOrigin')}>
                    <option value="">Select region...</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-tongue">Mother Tongue</label>
                  <input
                    id="reg-tongue"
                    type="text"
                    className="input-field"
                    placeholder="e.g. Telugu, Bengali, Punjabi"
                    {...register('motherTongue')}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-surname">Family Surname</label>
                  <input
                    id="reg-surname"
                    type="text"
                    className="input-field"
                    placeholder="e.g. Sharma, Rao, Singh"
                    {...register('familySurname')}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-surname-origin">Surname Origin (optional)</label>
                  <input
                    id="reg-surname-origin"
                    type="text"
                    className="input-field"
                    placeholder="Additional surname history"
                    {...register('surnameOrigin')}
                  />
                </div>
              </div>
            )}

            <button
              id="register-submit"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={registerMutation.isPending}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {registerMutation.isPending ? <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Creating account...</> : 'Create Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '1.25rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-brand-300)', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
