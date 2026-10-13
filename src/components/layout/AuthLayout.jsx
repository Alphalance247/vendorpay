import { useNavigate } from "react-router-dom";
import { ShieldCheck, Zap } from "lucide-react";
import Logo from "../ui/Logo";

// Shared chrome for every unauthenticated auth screen (login, forgot
// password, reset password, ...) so the brand/trust signals stay
// identical across the whole flow instead of drifting per page.
export default function AuthLayout({ children }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(135deg, #0C111D 0%, #1D2939 50%, #0C111D 100%)",
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
            <h1 className="font-headline-lg text-white text-4xl font-bold leading-tight tracking-tight">
              Vendor Management, without the chaos.
            </h1>

            <p className="text-outline-variant text-base leading-relaxed">
              Streamline your vendor invoicing and treasury management with
              institutional-grade infrastructure.
            </p>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2 text-outline text-xs font-medium uppercase tracking-wider">
                <ShieldCheck size={14} className="text-brand-cyan" />
                SOC 2 Compliant
              </div>

              <div className="flex items-center gap-2 text-outline text-xs font-medium uppercase tracking-wider">
                <Zap size={14} className="text-brand-cyan" />
                256-bit Encryption
              </div>
            </div>
          </div>

          <p className="text-outline text-xs">
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

          {children}
        </div>
      </div>
    </div>
  );
}
