'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Logo from '@/components/layout/Logo';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { loginUser } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const errs = {};
    if (!isReset && isSignUp && !form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'At least 6 characters';
    
    if (isReset) {
      if (form.password !== form.confirmPassword) {
        errs.confirmPassword = 'Passwords do not match';
      }
    }
    
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    
    setLoading(true);
    setErrors({}); // clear previous errors
    setSuccessMsg('');
    
    try {
      const endpoint = isReset ? '/api/auth/reset' : (isSignUp ? '/api/auth/signup' : '/api/auth/login');
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setErrors({ form: data.error || 'Authentication failed' });
        setLoading(false);
        return;
      }
      
      if (isReset) {
        setSuccessMsg('Password reset successfully! Please log in.');
        setIsReset(false);
        setForm({ ...form, password: '', confirmPassword: '' });
        setLoading(false);
        return;
      }
      
      loginUser(data.user.email, data.user.name);
      
      // Hard redirect to ensure AppContext remounts and fetches the correct user's tasks
      window.location.href = '/dashboard';
    } catch (err) {
      setErrors({ form: 'An unexpected error occurred. Please try again.' });
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    if (provider === 'google') {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        const firstName = user.displayName ? user.displayName.split(' ')[0] : 'User';
        loginUser(user.email, firstName);
        router.push('/dashboard');
      } catch (error) {
        console.error("Error signing in with Google:", error);
        alert("Failed to sign in with Google. Check console for details.");
      }
    } else {
      // Mock for other providers
      loginUser(`${provider.toLowerCase()}.user@example.com`, `${provider} User`);
      router.push('/dashboard');
    }
  };

  return (
    <div className={styles.loginPage}>
      {/* Animated background */}
      <div className={styles.bgOrbs}>
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
        <div className={`${styles.orb} ${styles.orb3}`} />
      </div>

      <div className={styles.loginContainer}>
        {/* Brand */}
        <div className={styles.brand}>
          <Logo size={96} className={styles.brandIcon} />
          <h1 className={styles.brandName}>ProductivityAI</h1>
          <p className={styles.brandSub}>Your intelligent productivity companion</p>
        </div>

        {/* Card */}
        <div className={styles.card}>
          {/* Tabs */}
          {!isReset && (
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${!isSignUp ? styles.tabActive : ''}`}
                onClick={() => setIsSignUp(false)}
              >
                Log In
              </button>
              <button
                className={`${styles.tab} ${isSignUp ? styles.tabActive : ''}`}
                onClick={() => setIsSignUp(true)}
              >
                Sign Up
              </button>
            </div>
          )}
          
          {isReset && (
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Reset Password</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Enter your email and a new password</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form} autoComplete="off">
            {successMsg && (
              <div className={styles.formSuccess} style={{ 
                color: 'var(--accent-teal)', 
                background: 'rgba(20, 184, 166, 0.1)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(20, 184, 166, 0.3)',
                fontSize: '0.85rem',
                textAlign: 'center'
              }}>
                {successMsg}
              </div>
            )}
            
            {errors.form && (
              <div className={styles.formError} style={{ 
                color: 'var(--accent-rose)', 
                background: 'rgba(244, 63, 94, 0.1)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                fontSize: '0.85rem',
                textAlign: 'center'
              }}>
                {errors.form}
              </div>
            )}
            
            {!isReset && isSignUp && (
              <div className="input-group">
                <label className="input-label" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className={`input ${errors.name ? 'input-error' : ''}`}
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                />
                {errors.name && <span className="input-error-text">{errors.name}</span>}
              </div>
            )}

            <div className="input-group">
              <label className="input-label" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="off"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email && <span className="input-error-text">{errors.email}</span>}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="password">{isReset ? 'New Password' : 'Password'}</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`input ${errors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  style={{ paddingRight: '40px', width: '100%' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.1rem' }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <span className="input-error-text">{errors.password}</span>}
            </div>

            {isReset && (
              <div className="input-group">
                <label className="input-label" htmlFor="confirmPassword">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    style={{ paddingRight: '40px', width: '100%' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.1rem' }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.confirmPassword && <span className="input-error-text">{errors.confirmPassword}</span>}
              </div>
            )}

            {!isReset && !isSignUp && (
              <div className={styles.formOptions}>
                <label className={styles.remember}>
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <button type="button" onClick={() => { setIsReset(true); setErrors({}); setSuccessMsg(''); }} className={styles.forgot} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Forgot password?</button>
              </div>
            )}
            
            {isReset && (
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-2)' }}>
                <button type="button" onClick={() => { setIsReset(false); setErrors({}); setSuccessMsg(''); }} className={styles.forgot} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Back to Login</button>
              </div>
            )}

            <button
              type="submit"
              className={`btn btn-primary btn-lg w-full ${styles.submitBtn}`}
              disabled={loading}
            >
              {loading ? (
                <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              ) : (
                isReset ? 'Reset Password' : (isSignUp ? 'Create Account' : 'Log In')
              )}
            </button>
          </form>

          {!isReset && (
            <>
              {/* Divider */}
              <div className={styles.divider}>
                <span>or continue with</span>
              </div>

              {/* OAuth */}
              <div className={styles.oauthRow}>
                <button
                  className={`btn btn-secondary ${styles.oauthBtn}`}
                  onClick={() => handleOAuth('google')}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
