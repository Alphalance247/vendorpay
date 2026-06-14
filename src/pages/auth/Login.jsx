import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { extractErrorMessage } from '../../lib/utils';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    remember: false,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((f) => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const role = await login(form.email, form.password);

      localStorage.setItem('user_role', role);

      if (role === 'admin') {
        navigate('/vendorpay/admin/dashboard');
      } else {
        navigate('/vendorpay/vendor/dashboard');
      }
    } catch (err) {
      setError(extractErrorMessage(err));
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
              Welcome back
            </h2>

            <p className="text-on-surface-variant text-sm mt-1">
              Enter your details to access your corporate dashboard.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="name@company.com"
              required
              autoFocus
            />

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
                  Password
                </label>

                <button
                  type="button"
                  onClick={() => navigate('/vendorpay/forgot-password')}
                  className="text-xs text-emerald hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full rounded border border-outline-variant bg-white px-3 py-2 pr-10 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-emerald focus:border-emerald transition-colors"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant"
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
                className="w-4 h-4 rounded border-outline-variant accent-emerald"
              />

              <span className="text-sm text-on-surface-variant">
                Keep me signed in for 30 days
              </span>
            </label>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
              <ArrowRight size={16} />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-on-surface-variant">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/vendorpay/register')}
              className="text-emerald font-medium hover:underline"
            >
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}