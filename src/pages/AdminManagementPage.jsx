import { useState } from 'react';
import { AlertCircle, CheckCircle2, ShieldCheck, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';

const EMPTY_FORM = {
  email: '',
  password: '',
  confirmPassword: '',
};

export default function AdminManagementPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');

  const validate = () => {
    const nextErrors = {};
    const normalizedEmail = form.email.trim().toLowerCase();

    if (!normalizedEmail) {
      nextErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.';
    } else if (form.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Confirm the password.';
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    return nextErrors;
  };

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setServerError('');
    setSuccess('');

    const email = form.email.trim().toLowerCase();
    const { data, error } = await supabase.functions.invoke('create-admin', {
      body: { email, password: form.password },
    });

    if (error) {
      let message = 'Failed to create administrator. Please try again.';

      if (error.context instanceof Response) {
        const responseBody = await error.context.json().catch(() => null);
        if (responseBody?.error) message = responseBody.error;
      } else if (error.message) {
        message = error.message;
      }

      setServerError(message);
      setSubmitting(false);
      return;
    }

    setSuccess(`Administrator ${data?.user?.email || email} created successfully.`);
    setForm(EMPTY_FORM);
    setErrors({});
    setSubmitting(false);
  };

  return (
    <div className="page">
      <div className="admin-management-grid">
        <section className="admin-form-card" aria-labelledby="create-admin-title">
          <div className="admin-card-heading">
            <div className="admin-card-icon">
              <UserPlus size={22} />
            </div>
            <div>
              <h2 id="create-admin-title">Create Administrator</h2>
              <p>Add another trusted person who can access and manage PharmaCare.</p>
            </div>
          </div>

          {serverError && (
            <div className="alert alert-error" role="alert">
              <AlertCircle size={16} />
              <span>{serverError}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="status">
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="admin-create-form" noValidate>
            <div className="form-group">
              <label htmlFor="admin-email" className="form-label">Administrator Email *</label>
              <input
                id="admin-email"
                type="email"
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                placeholder="newadmin@example.com"
                value={form.email}
                onChange={(event) => handleChange('email', event.target.value)}
                autoComplete="off"
                disabled={submitting}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="admin-password" className="form-label">Temporary Password *</label>
                <input
                  id="admin-password"
                  type="password"
                  className={`form-input ${errors.password ? 'input-error' : ''}`}
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={(event) => handleChange('password', event.target.value)}
                  autoComplete="new-password"
                  disabled={submitting}
                />
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="admin-confirm-password" className="form-label">Confirm Password *</label>
                <input
                  id="admin-confirm-password"
                  type="password"
                  className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Repeat the password"
                  value={form.confirmPassword}
                  onChange={(event) => handleChange('confirmPassword', event.target.value)}
                  autoComplete="new-password"
                  disabled={submitting}
                />
                {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
              </div>
            </div>

            <button
              id="create-admin-btn"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={submitting}
            >
              <UserPlus size={17} />
              <span>{submitting ? 'Creating Administrator…' : 'Create Administrator'}</span>
            </button>
          </form>
        </section>

        <aside className="admin-security-card">
          <ShieldCheck size={28} />
          <h3>Administrator access</h3>
          <p>
            The new account is confirmed immediately and can sign in with the email and password you provide.
          </p>
          <p>
            Share credentials privately. Every administrator has the same access to medicines, billing, and admin creation.
          </p>
        </aside>
      </div>
    </div>
  );
}
