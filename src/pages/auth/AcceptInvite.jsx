import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  PartyPopper,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Card from "../../components/ui/Card";
import Logo from "../../components/ui/Logo";
import { useAcceptInvite } from "../../hooks/useQueries/companyAuth/useAcceptInvite";
import { useInviteDetails } from "../../hooks/useQueries/companyAuth/useInviteDetails";
import { MIN_PASSWORD_LENGTH } from "../../lib/utils";

function Brand() {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-center mb-8">
      <Logo variant="light" onClick={() => navigate("/")} />
    </div>
  );
}

function InvalidInvite({ reason }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Brand />
        <Card className="text-center">
          <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={22} className="text-error" />
          </div>
          <h1 className="font-headline-lg text-xl font-semibold text-on-surface tracking-tight">
            Invite link invalid
          </h1>
          <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
            {reason}
          </p>
          <Button className="w-full mt-6" onClick={() => navigate("/login")}>
            Go to Login
          </Button>
        </Card>
      </div>
    </div>
  );
}

function LoadingInvite() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 py-12">
      <Brand />
      <Loader2 size={24} className="animate-spin text-secondary" />
      <p className="text-sm text-on-surface-variant mt-3">
        Loading your invite...
      </p>
    </div>
  );
}

function SuccessScreen() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <PartyPopper size={26} className="text-success" />
        </div>
        <h1 className="font-headline-lg text-2xl font-semibold text-on-surface tracking-tight">
          You're all set
        </h1>
        <p className="text-on-surface-variant text-sm mt-1.5">
          Your account has been created. Sign in to get started.
        </p>
        <Button
          size="lg"
          className="w-full mt-6"
          onClick={() => navigate("/login")}
        >
          Go to Login
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
    fullName: "",
  });

  const acceptInvite = useAcceptInvite();
  const inviteQuery = useInviteDetails(token);
  const invite = inviteQuery.data;
  const role = (invite?.role || "").toLowerCase();

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  if (!token) {
    return (
      <InvalidInvite reason="This invite link is missing its token. Ask whoever invited you to resend the invitation." />
    );
  }

  if (acceptInvite.isSuccess) {
    return <SuccessScreen />;
  }

  if (inviteQuery.isLoading) {
    return <LoadingInvite />;
  }

  if (inviteQuery.isError) {
    return (
      <InvalidInvite reason="This invite link is invalid or has expired. Ask whoever invited you to resend the invitation." />
    );
  }

  const mismatch =
    form.password &&
    form.confirmPassword &&
    form.password !== form.confirmPassword;
  const tooShort = form.password && form.password.length < MIN_PASSWORD_LENGTH;

  function validate() {
    return (
      form.password &&
      form.password.length >= MIN_PASSWORD_LENGTH &&
      form.password === form.confirmPassword &&
      form.fullName
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      setError("Please fill in all required fields before continuing.");
      return;
    }
    setError("");

    acceptInvite.mutate({
      token,
      password: form.password,
      full_name: form.fullName,
      company_name: invite?.company_name,
    });
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <Brand />

        <div className="mb-6 text-center">
          <h1 className="font-headline-lg text-2xl font-semibold text-on-surface tracking-tight">
            Accept your invite
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Set a password to activate your account.
          </p>
        </div>

        <div className="bg-surface-container border border-outline-variant rounded-lg px-4 py-3 mb-6">
          <p className="text-sm text-on-surface-variant">
            {invite?.invited_by_name && (
              <span className="font-medium text-on-surface">
                {invite.invited_by_name}
              </span>
            )}{" "}
            invited you to join{" "}
            <span className="font-semibold text-on-surface">
              {invite?.company_name}
            </span>
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center rounded-full bg-success/10 text-success text-xs font-semibold px-2.5 py-1 capitalize">
              {role || "Member"}
            </span>
            {invite?.email && (
              <span className="text-xs text-on-surface-variant">
                Invited as {invite.email}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error/5 border border-error/30 rounded text-error text-sm">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-outline-variant shadow-sm p-6 space-y-6"
        >
          <div className="space-y-4">
            <h2 className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
              Your account
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Input
                  label="Full Name"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Jane Smith"
                  required
                  autoFocus
                />
              </div>
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                // placeholder=""
                hint={`At least ${MIN_PASSWORD_LENGTH} characters`}
                error={
                  tooShort
                    ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
                    : undefined
                }
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
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                // placeholder=""
                error={mismatch ? "Passwords do not match" : undefined}
                required
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    className="text-outline hover:text-on-surface-variant"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full flex items-center justify-center gap-2"
            disabled={acceptInvite.isPending}
          >
            {acceptInvite.isPending ? (
              "Creating account..."
            ) : (
              <>
                <Check size={16} />
                Accept Invite
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
