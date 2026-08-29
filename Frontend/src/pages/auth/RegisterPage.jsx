import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building,
  MapPin,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Select } from '../../components/common';

const ROLE_OPTIONS = [
  { value: 'HSE_OFFICER', label: 'HSE Officer (Default)' },
  { value: 'ADMIN', label: 'System Administrator (ADMIN)' },
  { value: 'REVIEWER', label: 'SIF Precursor Reviewer' },
  { value: 'VIEWER', label: 'Safety Viewer' },
];

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'HSE_OFFICER',
    site: 'Enterprise Command Center',
    department: 'HSE Operations',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Full name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (formData.password.length > 128) {
      newErrors.password = 'Password cannot exceed 128 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        site: formData.site.trim() || 'All Sites',
        department: formData.department.trim() || 'HSE',
      };

      const result = await register(payload);

      // Handle backend response dynamically:
      // If token & user returned, AuthContext authenticates and we go to '/'
      // If no token returned, redirect to '/login'
      if (result?.token || result?.user) {
        navigate('/', { replace: true });
      } else {
        navigate('/login', {
          state: { message: 'Account registered successfully. Please sign in.' },
          replace: true,
        });
      }
    } catch (err) {
      setServerError(
        err?.message || 'Registration failed. Please review your details and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-fixed text-primary mb-4 shadow-sm border border-primary-fixed-dim">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
          Create Enterprise HSE Account
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto">
          Join the Safety Intelligence Platform for AI-driven SIF precursor risk identification.
        </p>
      </div>

      {/* Main Form Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="bg-surface-container-lowest py-8 px-6 sm:px-10 shadow-elevated rounded-2xl border border-outline-variant">
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
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

            {/* Name & Email Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Sarah Jenkins"
                icon={UserIcon}
                error={errors.name}
                disabled={isSubmitting}
                required
              />

              <Input
                label="Work Email"
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@organization.com"
                icon={Mail}
                error={errors.email}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Password & Confirm Password Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
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
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
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

              {/* Confirm Password */}
              <div className="relative flex flex-col gap-1">
                <label htmlFor="confirmPassword" className="text-xs font-semibold text-on-surface">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 pointer-events-none text-outline">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    disabled={isSubmitting}
                    className={`w-full bg-surface-container-lowest border rounded text-sm text-on-surface placeholder:text-outline/70 transition-all font-sans py-2 pl-9 pr-10 ${
                      errors.confirmPassword
                        ? 'border-error focus:border-error focus:ring-1 focus:ring-error'
                        : 'border-outline-variant focus:border-primary-container focus:ring-2 focus:ring-primary-fixed'
                    } disabled:bg-surface-container-low disabled:opacity-60`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 text-outline hover:text-on-surface focus:outline-none p-0.5"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="text-xs font-medium text-error">{errors.confirmPassword}</span>
                )}
              </div>
            </div>

            {/* Role & Site Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Role"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                options={ROLE_OPTIONS}
                icon={Briefcase}
                disabled={isSubmitting}
              />

              <Input
                label="Site / Unit Location"
                type="text"
                id="site"
                name="site"
                value={formData.site}
                onChange={handleChange}
                placeholder="e.g. Offshore Rig 4"
                icon={MapPin}
                disabled={isSubmitting}
              />
            </div>

            {/* Department */}
            <div>
              <Input
                label="Department / Team"
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. HSE Operations"
                icon={Building}
                disabled={isSubmitting}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-semibold shadow-sm"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Complete Registration
              </Button>
            </div>
          </form>

          {/* Bottom Link */}
          <div className="mt-6 pt-6 border-t border-outline-variant/60 text-center">
            <p className="text-xs text-on-surface-variant">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-primary hover:text-primary-container transition-colors focus:outline-none focus:underline"
              >
                Sign In instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
