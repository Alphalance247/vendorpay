import { useState } from 'react';
import { authService } from '../../lib/services/authService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await authService.forgotPassword(email);
      setDone(true);
    } catch (err) {
      setError('Something went wrong. Try again.');
    }
  };

  if (done) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold">Check your email</h2>
        <p className="text-sm text-gray-500">
          Password reset link sent successfully.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto p-6 space-y-4">
      <h2 className="text-xl font-semibold">Reset Password</h2>

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Button type="submit" className="w-full">
        Send Reset Link
      </Button>
    </form>
  );
}