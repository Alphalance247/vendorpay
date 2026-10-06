import { useState } from "react";
// import Modal from "./Modal";
import Input from "./Input";
import Button from "./Button";
import { authService } from "../../lib/services/authService";
import { Toast } from "../../pages/onboarding/Onboarding";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ChangePasswordForm from "./ChangePasswordForm";
const INITIAL_FORM = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const SecuritySection = () => {
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [justSaved, setJustSaved] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field error when user starts correcting it
    setErrors((prev) => ({
      ...prev,
      [name]: "",
      form: "",
    }));
  };

  const handleChangePassword = () => {
    setFormData(INITIAL_FORM);
    setErrors({});
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    if (loading) return;

    setOpenModal(false);
    setFormData(INITIAL_FORM);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (
      formData.currentPassword &&
      formData.newPassword &&
      formData.currentPassword === formData.newPassword
    ) {
      newErrors.newPassword =
        "New password must be different from your current password";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setErrors({});

      await authService.changePassword(
        formData.currentPassword,
        formData.newPassword,
      );

      // Success
      setOpenModal(false);
      setFormData(INITIAL_FORM);
      // setErrors({});
      // setJustSaved("Password changed successfully.");
      // Clear authentication
      authService.logout();
      // Redirect to login
      navigate("/login", { replace: true });

      setTimeout(() => setJustSaved(null), 3000);
    } catch (error) {
      console.error("Failed to change password:", error);

      const responseData = error?.response?.data;

      let message =
        "Unable to change password. Please check your current password and try again.";

      // Handle common FastAPI-style error responses
      if (typeof responseData?.detail === "string") {
        message = responseData.detail;
      } else if (Array.isArray(responseData?.detail)) {
        message = responseData.detail[0]?.msg || message;
      } else if (typeof responseData?.message === "string") {
        message = responseData.message;
      }

      setErrors({
        form: message,
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <Toast show={!!justSaved} message={justSaved} />
      {/* Password */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 mb-5">
        <h2 className="text-[15px] font-semibold text-gray-900">Password</h2>
        <p className="text-[13px] text-gray-500 mb-4">
          Last changed 3 months ago
        </p>
        <button
          onClick={handleChangePassword}
          className="w-full sm:w-auto text-[13.5px] font-medium text-gray-900 bg-white border border-gray-200 rounded-md px-4 py-2 hover:bg-gray-50 transition-colors"
        >
          Change password
        </button>
      </div>
      <ChangePasswordForm
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
          {errors.form && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5">
              <p className="text-sm text-red-700">{errors.form}</p>
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
          <div className="rounded-lg bg-surface-low border border-outline-variant px-3.5 py-3">
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
      </ChangePasswordForm>
    </div>
  );
};

export default SecuritySection;
