import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { KeyRound, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email.trim(), password);

    if (error) {
      setError('Invalid email or password.');
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  const handleFillDemo = () => {
    setEmail('fardinofficial69@gmail.com');
    setPassword('SoftWareEnginnering');
  };

  return (
    <div className="login-view">
      <div className="login-card-container">
        <div className="login-brand-header">
          <div className="login-logo-box">P</div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brand-pine)', letterSpacing: '-0.02em' }}>
            PharmaCare
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Pharmacy Administrator Portal
          </p>

          <button
            type="button"
            className="demo-autofill-btn"
            id="demo-fill-btn"
            onClick={handleFillDemo}
          >
            <KeyRound size={13} />
            <span>Use Demo Credentials</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} id="login-form">
          {error && (
            <div className="alert alert-error" id="login-error" style={{ marginBottom: '16px' }}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">Admin Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  placeholder="admin@pharmacy.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="login-password" className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              id="login-btn"
              disabled={loading}
              style={{ marginTop: '8px' }}
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign in to Dashboard</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Authorized Pharmacy Administrator Access Only
        </p>
      </div>
    </div>
  );
}
