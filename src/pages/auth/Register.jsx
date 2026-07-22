import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, Zap } from 'lucide-react';
import { authService } from '../../lib/services/authService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function Register() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);

      await authService.register(
        form.email,
        form.password
      );

      navigate('/login');
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'Registration failed'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'linear-gradient(135deg, #0f1d29 0%, #1a3a52 50%, #0f1d29 100%)',
          }}
        />

        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,.1) 40px, rgba(255,255,255,.1) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,.1) 40px, rgba(255,255,255,.1) 41px)',
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald rounded flex items-center justify-center">
              <span className="text-white text-sm font-bold">VP</span>
            </div>

            <span className="text-white font-semibold text-lg">
              VendorPay
            </span>
          </div>

          <div className="space-y-6">
            <h1 className="text-white text-4xl font-bold leading-tight tracking-tight">
              Secure enterprise finance at the speed of business.
            </h1>

            <p className="text-slate-300 text-base leading-relaxed">
              Streamline your vendor invoicing and treasury management with
              institutional-grade infrastructure.
            </p>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider">
                <ShieldCheck size={14} className="text-emerald" />
                SOC 2 Compliant
              </div>

              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider">
                <Zap size={14} className="text-emerald" />
                256-bit Encryption
              </div>
            </div>
          </div>

          <p className="text-slate-500 text-xs">
            &copy; {new Date().getFullYear()} Alluvium Inc. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-navy rounded flex items-center justify-center">
              <span className="text-white text-sm font-bold">VP</span>
            </div>

            <span className="text-navy font-semibold text-lg">
              VendorPay
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-on-surface tracking-tight">
              Create Vendor Account
            </h2>

            <p className="text-on-surface-variant text-sm mt-1">
              Create your login credentials first.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="name@company.com"
              required
              autoFocus
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="text-outline hover:text-on-surface-variant"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <Input
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              suffix={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  className="text-outline hover:text-on-surface-variant"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-on-surface-variant">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-emerald font-medium hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
