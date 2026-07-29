import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../../lib/services/authService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="max-w-sm mx-auto p-6 text-center space-y-3">
        <h2 className="text-xl font-semibold">Invalid Link</h2>
        <p className="text-sm text-gray-500">This password reset link is missing a token. Please request a new one.</p>
        <Button variant="secondary" onClick={() => navigate('/forgot-password')}>
          Request New Link
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
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
      <div className="max-w-sm mx-auto p-6 text-center space-y-3">
        <h2 className="text-xl font-semibold">Password Updated</h2>
        <p className="text-sm text-gray-500">Your password has been reset. You can now log in.</p>
        <Button onClick={() => navigate('/login')}>Go to Login</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto p-6 space-y-4">
      <h2 className="text-xl font-semibold">Set New Password</h2>

      <Input
        label="New Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
      />

      <Input
        label="Confirm Password"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Updating…' : 'Reset Password'}
      </Button>

      <p className="text-center text-sm text-gray-500">
        <button type="button" className="underline" onClick={() => navigate('/login')}>
          Back to login
        </button>
      </p>
    </form>
  );
}
