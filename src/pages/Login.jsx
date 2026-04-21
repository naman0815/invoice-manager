import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { LogIn, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signIn, signUp } = useAuth()

  const handleAuth = async (type) => {
    setLoading(true)
    setError(null)
    const { error } = type === 'signin' 
      ? await signIn({ email, password })
      : await signUp({ email, password })
    
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <LogIn size={32} />
          </div>
          <h1>Invoice Manager</h1>
          <p>Secure business management</p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-text-muted)' }} />
            <input 
              type="email" 
              className="form-input" 
              style={{ paddingLeft: 40 }}
              placeholder="name@company.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
          <label className="form-label">Password</label>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-text-muted)' }} />
            <input 
              type="password" 
              className="form-input" 
              style={{ paddingLeft: 40 }}
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => handleAuth('signin')}
            disabled={loading || !email || !password}
          >
            {loading ? <Loader2 className="spinner" size={18} /> : 'Sign In'}
          </button>
          <button 
            className="btn btn-ghost" 
            onClick={() => handleAuth('signup')}
            disabled={loading || !email || !password}
          >
            Create Account
          </button>
        </div>

        <div className="login-footer">
          <p>© 2026 Admin Dashboard • Secure SSL Encrypted</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at top left, var(--color-primary-glow), transparent),
                      radial-gradient(circle at bottom right, rgba(0,0,0,0.5), transparent),
                      var(--color-bg);
          padding: var(--space-4);
        }
        .login-card {
          width: 100%;
          max-width: 400px;
          background: var(--color-card-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--color-border);
          border-radius: 24px;
          padding: var(--space-8) var(--space-6);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .login-header {
          text-align: center;
          margin-bottom: var(--space-8);
        }
        .login-logo {
          width: 64px;
          height: 64px;
          background: var(--color-primary);
          color: white;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto var(--space-4);
          box-shadow: 0 10px 15px -3px var(--color-primary-glow);
        }
        .login-header h1 {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.025em;
          margin: 0;
        }
        .login-header p {
          color: var(--color-text-muted);
          margin-top: var(--space-1);
        }
        .login-footer {
          margin-top: var(--space-8);
          text-align: center;
          font-size: 12px;
          color: var(--color-text-muted);
        }
        .alert {
          padding: var(--space-3) var(--space-4);
          border-radius: 12px;
          margin-bottom: var(--space-6);
          font-size: 14px;
        }
        .alert-danger {
          background: rgba(255, 107, 107, 0.1);
          color: #ff6b6b;
          border: 1px solid rgba(255, 107, 107, 0.2);
        }
      `}} />
    </div>
  )
}
