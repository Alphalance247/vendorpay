import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../lib/services/authService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function Register() {
  const navigate = useNavigate();

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

      navigate('/vendorpay/login');
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
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-md border rounded-lg p-8 shadow-sm">

        <h1 className="text-2xl font-semibold mb-2">
          Create Vendor Account
        </h1>

        <p className="text-sm text-gray-500 mb-6">
          Create your login credentials first.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <Input
            label="Email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading
              ? 'Creating Account...'
              : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/vendorpay/login')}
            className="text-emerald hover:underline"
          >
            Sign In
          </button>
        </div>

      </div>
    </div>
  );
}