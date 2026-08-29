import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../../components/common';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        email: email.trim(),
        password,
      });

      if (rememberMe) {
        localStorage.setItem('sih_remember_email', email.trim());
      } else {
        localStorage.removeItem('sih_remember_email');
      }

      navigate(from, { replace: true });
    } catch (err) {
      setServerError(
        err?.message || 'Failed to sign in. Please check your credentials and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-fixed text-primary mb-4 shadow-sm border border-primary-fixed-dim">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
          Safety Intelligence Platform
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-on-surface-variant max-w-xs sm:max-w-sm mx-auto">
          AI-powered safety intelligence for identifying Serious Injury & Fatality precursors.
        </p>
      </div>

      {/* Main Form Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-surface-container-lowest py-8 px-6 sm:px-10 shadow-elevated rounded-2xl border border-outline-variant">
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {/* Server Error Alert */}
            {serverError && (
              <div
                role="alert"
                className="p-3.5 rounded-lg bg-error-container/30 border border-error/40 text-error flex items-start gap-3 animate-in fade-in duration-150"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-xs font-medium leading-relaxed">{serverError}</div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <Input
                label="Email"
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                }}
                placeholder="name@organization.com"
                icon={Mail}
                error={errors.email}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="relative flex flex-col gap-1">
                <label htmlFor="password" className="text-xs font-semibold text-on-surface">
                  Password
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 pointer-events-none text-outline">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                    }}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    className={`w-full bg-surface-container-lowest border rounded text-sm text-on-surface placeholder:text-outline/70 transition-all font-sans py-2 pl-9 pr-10 ${
                      errors.password
                        ? 'border-error focus:border-error focus:ring-1 focus:ring-error'
                        : 'border-outline-variant focus:border-primary-container focus:ring-2 focus:ring-primary-fixed'
                    } disabled:bg-surface-container-low disabled:opacity-60`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-outline hover:text-on-surface focus:outline-none p-0.5"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <span className="text-xs font-medium text-error">{errors.password}</span>
                )}
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-on-surface-variant">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isSubmitting}
                  className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary-fixed cursor-pointer"
                />
                <span>Remember me</span>
              </label>
            </div>

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-semibold shadow-sm"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Sign In
              </Button>
            </div>
          </form>

          {/* Bottom Footer / Links */}
          <div className="mt-6 pt-6 border-t border-outline-variant/60 text-center">
            <p className="text-xs text-on-surface-variant">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-bold text-primary hover:text-primary-container transition-colors focus:outline-none focus:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Confidentiality Notice */}
        <p className="mt-6 text-center text-[11px] text-outline">
          Enterprise HSE Safety Intelligence Portal &bull; Encrypted & Audit-Logged Session
        </p>
      </div>
    </div>
  );
}
