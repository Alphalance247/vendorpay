// import { useState } from "react";
// import Modal from "./Modal";
// import Input from "./Input";
// import Button from "./Button";
// import { authService } from "../../lib/services/authService";
// import { Toast } from "../../pages/onboarding/Onboarding";
// import { Eye, EyeOff } from "lucide-react";

import SecuritySection from "./SecuritySection";

// const INITIAL_FORM = {
//   currentPassword: "",
//   newPassword: "",
//   confirmPassword: "",
// };
export default function Security() {
  // const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  // const [openModal, setOpenModal] = useState(false);
  // const [loading, setLoading] = useState(false);
  // const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  // const [showNewPassword, setShowNewPassword] = useState(false);
  // const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  // const [formData, setFormData] = useState({
  //   currentPassword: "",
  //   newPassword: "",
  //   confirmPassword: "",
  // });

  // const [errors, setErrors] = useState({});
  // const [justSaved, setJustSaved] = useState(null);
  // const handleChange = (e) => {
  //   const { name, value } = e.target;

  //   setFormData((prev) => ({
  //     ...prev,
  //     [name]: value,
  //   }));

  //   if (errors[name]) {
  //     setErrors((prev) => ({
  //       ...prev,
  //       [name]: "",
  //     }));
  //   }
  // };

  // const handleChangePassword = () => {
  //   setFormData({
  //     currentPassword: "",
  //     newPassword: "",
  //     confirmPassword: "",
  //   });

  //   setErrors({});
  //   setOpenModal(true);
  // };

  // const handleCloseModal = () => {
  //   if (loading) return;

  //   setOpenModal(false);
  //   setErrors({});
  // };

  // const validateForm = () => {
  //   const newErrors = {};

  //   if (!formData.currentPassword.trim()) {
  //     newErrors.currentPassword = "Current password is required";
  //   }

  //   if (!formData.newPassword.trim()) {
  //     newErrors.newPassword = "New password is required";
  //   } else if (formData.newPassword.length < 8) {
  //     newErrors.newPassword = "Password must be at least 8 characters";
  //   }

  //   if (!formData.confirmPassword.trim()) {
  //     newErrors.confirmPassword = "Please confirm your new password";
  //   } else if (formData.newPassword !== formData.confirmPassword) {
  //     newErrors.confirmPassword = "Passwords do not match";
  //   }

  //   setErrors(newErrors);

  //   return Object.keys(newErrors).length === 0;
  // };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   if (!validateForm()) return;

  //   try {
  //     setLoading(true);

  //     // TODO: Replace with your actual API call
  //     // await authService.changePassword({
  //     //   current_password: formData.currentPassword,
  //     //   new_password: formData.newPassword,
  //     // });

  //     console.log("Change password:", formData);

  //     setOpenModal(false);

  //     setFormData({
  //       currentPassword: "",
  //       newPassword: "",
  //       confirmPassword: "",
  //     });

  //     setErrors({});
  //   } catch (error) {
  //     console.error("Failed to change password:", error);

  //     setErrors({
  //       form: "Unable to change password. Please try again.",
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  // const sessions = [
  //     { device: 'MacBook Pro', location: 'Lagos, NG', status: 'Current session' },
  //     { device: 'iPhone 15', location: 'Lagos, NG', status: 'Last active 2 days ago' },
  // ];

  // const handleSignOut = (device) => {
  //     // TODO: call sessionService.revoke(sessionId)
  //     console.log(`Signing out: ${device}`);
  // };

  // const handleToggle2FA = (next) => {
  //     setTwoFactorEnabled(next);
  //     // TODO: on enable, launch QR-code setup flow instead of just flipping state
  //     // authService.setTwoFactor(next)
  // };
  // const handleChange = (e) => {
  //   const { name, value } = e.target;

  //   setFormData((prev) => ({
  //     ...prev,
  //     [name]: value,
  //   }));

  //   // Clear field error when user starts correcting it
  //   setErrors((prev) => ({
  //     ...prev,
  //     [name]: "",
  //     form: "",
  //   }));
  // };

  // const handleChangePassword = () => {
  //   setFormData(INITIAL_FORM);
  //   setErrors({});
  //   setOpenModal(true);
  // };

  // const handleCloseModal = () => {
  //   if (loading) return;

  //   setOpenModal(false);
  //   setFormData(INITIAL_FORM);
  //   setErrors({});
  // };

  // const validateForm = () => {
  //   const newErrors = {};

  //   if (!formData.currentPassword.trim()) {
  //     newErrors.currentPassword = "Current password is required";
  //   }

  //   if (!formData.newPassword.trim()) {
  //     newErrors.newPassword = "New password is required";
  //   } else if (formData.newPassword.length < 8) {
  //     newErrors.newPassword = "Password must be at least 8 characters";
  //   }

  //   if (!formData.confirmPassword.trim()) {
  //     newErrors.confirmPassword = "Please confirm your new password";
  //   } else if (formData.newPassword !== formData.confirmPassword) {
  //     newErrors.confirmPassword = "Passwords do not match";
  //   }

  //   if (
  //     formData.currentPassword &&
  //     formData.newPassword &&
  //     formData.currentPassword === formData.newPassword
  //   ) {
  //     newErrors.newPassword =
  //       "New password must be different from your current password";
  //   }

  //   setErrors(newErrors);

  //   return Object.keys(newErrors).length === 0;
  // };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   if (!validateForm()) return;

  //   try {
  //     setLoading(true);
  //     setErrors({});

  //     await authService.changePassword(
  //       formData.currentPassword,
  //       formData.newPassword,
  //     );

  //     // Success
  //     setOpenModal(false);
  //     setFormData(INITIAL_FORM);
  //     setErrors({});
  //     setJustSaved("Password changed successfully.");

  //     setTimeout(() => setJustSaved(null), 3000);
  //   } catch (error) {
  //     console.error("Failed to change password:", error);

  //     const responseData = error?.response?.data;

  //     let message =
  //       "Unable to change password. Please check your current password and try again.";

  //     // Handle common FastAPI-style error responses
  //     if (typeof responseData?.detail === "string") {
  //       message = responseData.detail;
  //     } else if (Array.isArray(responseData?.detail)) {
  //       message = responseData.detail[0]?.msg || message;
  //     } else if (typeof responseData?.message === "string") {
  //       message = responseData.message;
  //     }

  //     setErrors({
  //       form: message,
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  return (
    <div className="w-full lg:w-[500px] xl:w-[700px] ">
      <h1 className="font-headline-lg text-xl sm:text-[20px] font-semibold text-on-surface mb-1">
        Security
      </h1>
      <p className="text-[13.5px] text-on-surface-variant mb-6">
        Manage how you sign in and protect your account.
      </p>
      <SecuritySection />
      {/* <Toast show={!!justSaved} message={justSaved} /> */}
      {/* Password */}
      {/* <div className="bg-white border border-outline-variant rounded-xl p-5 sm:p-6 mb-5">
        <h2 className="text-[15px] font-semibold text-on-surface">Password</h2>
        <p className="text-[13px] text-on-surface-variant mb-4">
          Last changed 3 months ago
        </p>
        <button
          onClick={handleChangePassword}
          className="w-full sm:w-auto text-[13.5px] font-medium text-on-surface bg-white border border-outline-variant rounded-md px-4 py-2 hover:bg-surface-container-low transition-colors"
        >
          Change password
        </button>
      </div> */}
      {/* <Modal
        open={openModal}
        onClose={handleCloseModal}
        title="Change password"
        subtitle="Update your password to keep your account secure."
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              form="change-password-form"
              loading={loading}
              disabled={loading}
            >
              Change password
            </Button>
          </>
        }
      >
        <form
          id="change-password-form"
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* General error */}
      {/* {errors.form && (
            <div className="rounded-md border border-error/30 bg-error/5 px-3 py-2.5">
              <p className="text-sm text-error">{errors.form}</p>
            </div>
          )}
          <div className="relative">
            <Input
              label="Current password"
              name="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              value={formData.currentPassword}
              onChange={handleChange}
              error={errors.currentPassword}
              placeholder="Enter your current password"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword((s) => !s)}
              className="absolute right-3 top-10 -translate-y-1/2 text-outline hover:text-on-surface-variant"
            >
              {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="relative">
            <Input
              label="New password"
              name="newPassword"
              type={showNewPassword ? "text" : "password"}
              value={formData.newPassword}
              onChange={handleChange}
              error={errors.newPassword}
              placeholder="Enter your new password"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((s) => !s)}
              className="absolute right-3 top-10 -translate-y-1/2 text-outline hover:text-on-surface-variant"
            >
              {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="relative">
            <Input
              label="Confirm new password"
              name="confirmPassword"
              type={showConfirmNewPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="Re-enter your new password"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmNewPassword((s) => !s)}
              className="absolute right-3 top-10 -translate-y-1/2 text-outline hover:text-on-surface-variant"
            >
              {showConfirmNewPassword ? (
                <EyeOff size={16} />
              ) : (
                <Eye size={16} />
              )}
            </button>
          </div>
          <div className="rounded-lg bg-surface-container border border-outline-variant px-3.5 py-3">
            <p className="text-xs font-medium text-on-surface mb-1">
              Password requirements
            </p>

            <ul className="text-xs text-on-surface-variant space-y-1">
              <li>• At least 8 characters</li>
              <li>• Use a combination of letters and numbers</li>
              <li>• Avoid using easily guessed information</li>
            </ul>
          </div>
        </form>
      </Modal> */}
      {/* Two-factor authentication */}
      {/* <div className="bg-white border border-outline-variant rounded-xl p-5 sm:p-6 mb-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-[15px] font-semibold text-on-surface">
                            Two-factor authentication
                        </h2>
                        <p className="text-[13px] text-on-surface-variant mt-0.5">
                            Require a code from your authenticator app when signing in
                        </p>
                    </div>
                    <Toggle checked={twoFactorEnabled} onChange={handleToggle2FA} />
                </div>
            </div> */}

      {/* Active sessions */}
      {/* <div className="bg-white border border-outline-variant rounded-xl p-5 sm:p-6">
                <h2 className="text-[15px] font-semibold text-on-surface mb-2">
                    Active sessions
                </h2>
                {sessions.map((s) => (
                    <Session
                        key={`${s.device}-${s.location}`}
                        device={s.device}
                        location={s.location}
                        status={s.status}
                        onSignOut={() => handleSignOut(s.device)}
                    />
                ))}
            </div> */}
    </div>
  );
}
