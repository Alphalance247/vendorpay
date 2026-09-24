import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Zap,
  Mail,
  Building2,
} from "lucide-react";
import { useAuth } from "../../lib/authContext";
import { extractErrorMessage, dashboardPathForRole } from "../../lib/utils";
import { parseHost } from "../../lib/tenantResolver";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Logo from "../../components/ui/Logo";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const { role, companySlug, accessToken, refreshToken } = await login(
        form.email,
        form.password,
      );

      const { slug: currentSlug, rootDomain } = parseHost(
        window.location.hostname,
      );

      if (companySlug && companySlug !== currentSlug) {
        const port = window.location.port ? `:${window.location.port}` : "";
        const params = new URLSearchParams({
          access_token: accessToken,
          refresh_token: refreshToken,
          company_slug: companySlug,
        });
        window.location.href = `${window.location.protocol}//${companySlug}.${rootDomain}${port}${dashboardPathForRole(role)}?${params}`;
        return;
      }

      navigate(dashboardPathForRole(role));
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
              "linear-gradient(135deg, #0f1d29 0%, #1a3a52 50%, #0f1d29 100%)",
          }}
        />

        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,.1) 40px, rgba(255,255,255,.1) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,.1) 40px, rgba(255,255,255,.1) 41px)",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Logo variant="dark" onClick={() => navigate("/")} />

          <div className="space-y-6">
            <h1 className="text-white text-4xl font-bold leading-tight tracking-tight">
              Vendor Management, without the chaos.
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
          <Logo
            variant="light"
            className="mb-8 lg:hidden"
            onClick={() => navigate("/")}
          />

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
                  onClick={() => navigate("/forgot-password")}
                  className="text-xs text-emerald hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
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
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
              {loading ? "Signing in..." : "Sign in"}
              <ArrowRight size={16} />
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-outline-variant space-y-5">
            <div className="flex items-start gap-2.5 bg-surface-low border border-outline-variant rounded-lg px-3.5 py-3">
              <Mail
                size={15}
                className="mt-0.5 flex-shrink-0 text-on-surface-variant"
              />
              <p className="text-sm text-on-surface-variant">
                <span className="font-medium text-on-surface">
                  Invited to a workspace?
                </span>{" "}
                Check your email for the invite link from your company admin —
                that's how you'll set your password and get in.
              </p>
            </div>

            <div>
              <p className="text-center text-sm text-on-surface-variant mb-2">
                Setting up VendorPay for your company for the first time?
              </p>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => navigate("/signup-company")}
              >
                <Building2 size={16} />
                Set Up Your Company Workspace
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
