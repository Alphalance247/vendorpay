import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, CheckCircle } from 'lucide-react';
import { authService } from '../../lib/services/authService';
import { extractErrorMessage } from '../../lib/utils';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import AuthLayout from '../../components/layout/AuthLayout';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setDone(true);
    } catch (err) {
      setError(extractErrorMessage(err));
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
            Check your email
          </h2>
          <p className="text-sm text-on-surface-variant mt-1.5">
            If an account exists for <span className="font-medium text-on-surface">{email}</span>,
            we've sent a password reset link to it.
          </p>
          <Button className="w-full mt-6" onClick={() => navigate('/login')}>
            Back to Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="font-headline-lg text-2xl font-semibold text-on-surface tracking-tight">
          Reset your password
        </h2>
        <p className="text-on-surface-variant text-sm mt-1">
          Enter the email address on your account and we'll send you a link
          to reset your password.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-error/5 border border-error/30 rounded text-error text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          required
          autoFocus
        />

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
          {!loading && <Mail size={16} />}
        </Button>
      </form>

      <p className="text-center text-sm text-on-surface-variant mt-6">
        <button type="button" className="text-secondary hover:underline" onClick={() => navigate('/login')}>
          Back to login
        </button>
      </p>
    </AuthLayout>
  );
}