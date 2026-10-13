import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { authService } from '../../lib/services/authService';
import { MIN_PASSWORD_LENGTH } from '../../lib/utils';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import AuthLayout from '../../components/layout/AuthLayout';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const tooShort = password && password.length < MIN_PASSWORD_LENGTH;
  const mismatch = password && confirm && password !== confirm;
  const canSubmit = password.length >= MIN_PASSWORD_LENGTH && password === confirm;

  if (!token) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={22} className="text-error" />
          </div>
          <h2 className="font-headline-lg text-2xl font-semibold text-on-surface tracking-tight">
            Invalid link
          </h2>
          <p className="text-sm text-on-surface-variant mt-1.5">
            This password reset link is missing a token. Please request a new one.
          </p>
          <Button className="w-full mt-6" onClick={() => navigate('/forgot-password')}>
            Request New Link
          </Button>
        </div>
      </AuthLayout>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(detail ?? 'Reset link is invalid or has expired. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-success-container flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={22} className="text-success" />
          </div>
          <h2 className="font-headline-lg text-2xl font-semibold text-on-surface tracking-tight">
            Password updated
          </h2>
          <p className="text-sm text-on-surface-variant mt-1.5">
            Your password has been reset. You can now log in.
          </p>
          <Button className="w-full mt-6" onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="font-headline-lg text-2xl font-semibold text-on-surface tracking-tight">
          Set a new password
        </h2>
        <p className="text-on-surface-variant text-sm mt-1">
          Choose a new password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={MIN_PASSWORD_LENGTH}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters`}
          error={tooShort ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters` : undefined}
          autoFocus
        />

        <Input
          label="Confirm Password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          error={mismatch ? 'Passwords do not match' : undefined}
        />

        {error && (
          <div className="p-3 bg-error/5 border border-error/30 rounded text-error text-sm">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={loading || !canSubmit}>
          {loading ? 'Updating...' : 'Reset Password'}
        </Button>

        <p className="text-center text-sm text-on-surface-variant">
          <button type="button" className="text-secondary hover:underline" onClick={() => navigate('/login')}>
            Back to login
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
