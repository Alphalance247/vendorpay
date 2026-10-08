import { useEffect, useRef, useState } from "react";
import {
  // Camera,
  Upload,
} from "lucide-react";
import Input from "../ui/Input";
import { resolveMediaUrl } from "../../lib/apiClient";
// import Select from "../ui/Select";

const MAX_PHOTO_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_LOGO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg"
];
export default function ProfileForm({
  initialData,
  onSubmit,
  onCancel,
  onUploadPhoto,
  loading = false,
}) {
  const fileInputRef = useRef(null);
  const [errors, setErrors] = useState({});
  const data = initialData || {};

  const [formData, setFormData] = useState({
    full_name: data?.full_name || "",
    email: data?.email || data?.email_address || data?.user_email || "",
    role: data?.role || "",
    phone: data.phone || data.phone_number || data.contact_phone || "",
    company_name: data.company_name || "",
    avatar_url: data.avatar_url || ""
  });

  const [profileImage, setProfileImage] = useState(
    resolveMediaUrl(data.avatar_url)
  );
  const [photoError, setPhotoError] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Revoke the local preview URL whenever it's replaced or the component
  // unmounts (only blob: URLs are ours to revoke — the initial value may be
  // a real server URL).
  useEffect(() => {
    return () => {
      if (profileImage?.startsWith("blob:")) {
        URL.revokeObjectURL(profileImage);
      }
    };
  }, [profileImage]);
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Fullname is required";
    }



    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }



    // Only validate role for admins
    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };


  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];

    e.target.value = "";

    if (!file) return;

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setPhotoError(
        "Please upload a JPG, PNG, or WebP image."
      );
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      setPhotoError("Image must be smaller than 5MB.");
      return;
    }

    setPhotoError("");

    // Create local preview
    const previewUrl = URL.createObjectURL(file);

    console.log("LOCAL PREVIEW:", previewUrl);

    setProfileImage(previewUrl);

    if (!onUploadPhoto) return;

    setUploadingPhoto(true);

    try {
      const response = await onUploadPhoto(file);

      console.log("UPLOAD RESPONSE:", response);

      // IMPORTANT:
      // Don't change profileImage yet.
      // Keep the local blob preview while we debug.
    } catch (error) {
      console.error("UPLOAD ERROR:", error);
      setPhotoError("Failed to upload photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-2xl border border-outline-variant  p-5 sm:p-6 lg:p-8 bg-white"
    >
      {/* Profile photo */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className={profileImage ? "w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-outline-variant bg-surface-container-low flex items-center justify-center" : "border border-primary-fixed-dim bg-primary w-16 h-16 sm:w-20 sm:h-20 rounded-full"}>
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
                onLoad={() => {
                  console.log("✅ IMAGE LOADED:", profileImage);
                }}
                onError={(e) => {
                  console.log("❌ IMAGE FAILED:", profileImage);
                  console.log("Image element:", e.currentTarget);
                }}
              />
            ) : (
              <span className="text-white text-3xl sm:text-4xl font-semibold uppercase">
                {formData.full_name?.charAt(0)}
              </span>
            )}
          </div>


        </div>

        {/* Upload */}
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-outline-variant bg-surface px-5 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={17} />
            {uploadingPhoto ? "Uploading..." : "Upload photo"}
          </button>

          <p className="text-sm text-on-surface-variant">
            JPG or PNG, at least 200×200px
          </p>

          {photoError && <p className="text-xs text-error">{photoError}</p>}
        </div>

        {/* Hidden file input */}
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleImageChange}
          className="hidden"
        />
      </div>

      {/* Form fields */}
      <div className="mt-8 space-y-6">
        {/* First + Last name */}
        <div className="grid grid-cols-1  gap-5">
          <Input
            label="Full name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            error={errors.full_name}
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
          <Input
            label="Company name"
            name="company_name"
            type="text"
            value={formData.company_name}
            onChange={handleChange}
          />
          {/* Role */}
          {/* {isAdmin && ( */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold tracking-wide text-on-surface-variant uppercase">
              Role
            </label>
            <div className="relative">
              <input
                readOnly
                value={formData.role}
                className="w-full rounded border border-outline-variant bg-surface-container px-3 py-2 text-sm text-on-surface-variant cursor-not-allowed select-none capitalize"
              />
            </div>
          </div>
          {/* )} */}


        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 pt-6 border-t border-outline-variant flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <button
          onClick={onCancel}
          type="button"
          className="w-full sm:w-auto px-4 py-2 rounded-xl border border-primary text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}

/* --------------------------------
   Reusable Form Field
-------------------------------- */
