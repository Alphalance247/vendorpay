import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle } from "lucide-react";
import ProfileForm from "../layout/profileForm";
import { adminService } from "../../lib/services/adminService";
import { extractErrorMessage } from "../../lib/utils";
import { useConfirm } from "../../hooks/useConfirm";
import { useToast } from "./Toast";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  // ProfileForm only seeds its fields from initialData on mount, so it can't
  // discard edits on its own — bumping this remounts it with the last-saved
  // `profile` values.
  const [resetKey, setResetKey] = useState(0);
  const queryClient = useQueryClient();
  const { confirm, confirmEl } = useConfirm();
  const { toast } = useToast();

  useEffect(() => {
    adminService
      .getProfile()
      .then(setProfile)
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = () => {
    setError("");
    setSaved(false);
    setResetKey((prev) => prev + 1);
  };

  // Runs immediately when a photo is picked in ProfileForm — the avatar has
  // its own endpoint, so it's not bundled into the full_name/company_name
  // submit below. adminService.uploadAvatar already builds the FormData
  // internally, so this just hands it the raw File.
  const handlePhotoUpload = async (file) => {
    const updated = await adminService.uploadAvatar(file);
    setProfile((prev) => ({ ...prev, ...updated }));
    // The sidebar and top bar read the avatar from the current-user query.
    await queryClient.invalidateQueries({ queryKey: ["current-user"] });
    toast("Profile photo updated.");
  };

  // Same flow as the vendor profile: confirm, delete, refresh the avatar
  // everywhere. Resolves true once removed, false if cancelled; the confirm
  // modal shows any API error itself and stays open for a retry.
  const handlePhotoRemove = async () => {
    const removed = await confirm({
      title: "Remove profile photo",
      message: "Remove your profile photo? Your initial will be shown instead.",
      confirmLabel: "Remove",
      variant: "danger",
      onConfirm: async () => {
        await adminService.removeAvatar();
        setProfile((prev) => ({ ...prev, avatar_url: null }));
        await queryClient.invalidateQueries({ queryKey: ["current-user"] });
      },
    });
    if (removed) toast("Profile photo removed.");
    return removed;
  };
  const handleSubmit = async (data) => {
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const updated = await adminService.updateProfile({
        full_name: data.full_name,
        company_name: data.company_name,
      });

      setProfile(updated);
      setSaved(true);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full  lg:w-[500px] xl:w-[700px]">
      {confirmEl}
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="font-headline-lg text-2xl sm:text-3xl font-semibold text-on-surface">
          Profile
        </h1>

        <p className="mt-1 text-sm text-on-surface-variant">
          Manage your personal information and profile photo.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-error/5 border border-error/30 rounded text-error text-sm">
          {error}
        </div>
      )}

      {saved && (
        <div className="mb-4 p-3 bg-success/10 border border-success/30 rounded text-success text-sm flex items-center gap-2">
          <CheckCircle size={15} /> Profile updated successfully.
        </div>
      )}

      {/* ProfileForm seeds its fields from initialData on mount only, so hold
          off rendering it until the profile has actually loaded. */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-on-surface-variant" />
        </div>
      ) : (
        <ProfileForm
          key={resetKey}
          initialData={{ ...profile, role: profile?.role || "admin" }}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onUploadPhoto={handlePhotoUpload}
          onRemovePhoto={handlePhotoRemove}
          loading={saving}
        />
      )}
    </div>
  );
}
