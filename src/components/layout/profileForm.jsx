import { useRef, useState } from "react";
import {
  // Camera,
  Upload,
} from "lucide-react";
import Input from "../ui/Input";
// import Select from "../ui/Select";

export default function ProfileForm({
  initialData,
  onSubmit,
  role,
  loading = false,
}) {
  const fileInputRef = useRef(null);
  const [errors, setErrors] = useState({});
  const data = initialData || {};
  // const options = [
  //   { value: "admin", label: "Admin" },
  //   { value: "vendor", label: "Vendor" },
  // ];
  const isVendor = role === "vendor";
  const isAdmin = role === "admin";
  const [formData, setFormData] = useState({
    firstName: data?.firstName || data?.first_name || "",
    lastName: data?.lastName || data?.last_name || "",
    email: data?.email || data?.email_address || data?.user_email || "",
    role: data?.role || "",
    phone: data.phone || data.phone_number || data.contact_phone || "",
  });

  const [profileImage, setProfileImage] = useState(
    data.profileImage || data.profile_image || null,
  );

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

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (isVendor && !formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    // Only validate role for admins
    if (isAdmin && !formData.role) {
      newErrors.role = "Role is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      ...formData,
      profileImage,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setProfileImage(URL.createObjectURL(file));
  };

  // const [previousInitialData, setPreviousInitialData] = useState(initialData);

  // if (initialData !== previousInitialData) {
  //   const nextData = initialData || {};

  //   setPreviousInitialData(initialData);
  //   setFormData({
  //     firstName: nextData.firstName || nextData.first_name || "",
  //     lastName: nextData.lastName || nextData.last_name || "",
  //     email: nextData.email || "",
  //     role: nextData.role || "",
  //   });
  //   setProfileImage(nextData.profileImage || nextData.profile_image || null);
  // }

  // const handleImageChange = (e) => {
  //   const file = e.target.files?.[0];

  //   if (!file) return;

  //   setProfileImage(URL.createObjectURL(file));
  // };

  // const getInitials = () => {
  //   const first = formData.firstName?.charAt(0) || "";
  //   const last = formData.lastName?.charAt(0) || "";

  //   return `${first}${last}`.toUpperCase() || "U";
  // };

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

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-2xl border border-outline-variant  p-5 sm:p-6 lg:p-8 bg-white"
    >
      {/* Profile photo */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-amber-600 flex items-center justify-center">
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-3xl sm:text-4xl font-semibold">
                {formData.firstName?.charAt(0)}
                {formData.lastName?.charAt(0)}
              </span>
            )}
          </div>

          {/* Small camera button */}
          {/* <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 lg:bottom-0 right-64 lg:right-0 w-8 h-8 rounded-full bg-white border border-outline-variant shadow-sm flex items-center justify-center text-on-surface hover:bg-surface-low transition-colors"
            aria-label="Change profile photo"
          >
            <Camera size={15} />
          </button> */}
        </div>

        {/* Upload */}
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-outline-variant bg-surface px-5 py-3 text-sm font-semibold text-on-surface hover:bg-surface-low transition-colors"
          >
            <Upload size={17} />
            Upload photo
          </button>

          <p className="text-sm text-on-surface-variant">
            JPG or PNG, at least 200×200px
          </p>

          {errors.profileImage && (
            <p className="text-xs text-error">{errors.profileImage}</p>
          )}
        </div>

        {/* Hidden file input */}
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleImageChange}
          className="hidden"
        />
      </div>

      {/* Form fields */}
      <div className="mt-8 space-y-6">
        {/* First + Last name */}
        <div className="grid grid-cols-1  gap-5">
          <Input
            label="fullname"
            name="firstName"
            value={formData.firstName + " " + formData.lastName}
            onChange={handleChange}
          />
          {/* <Input
            label="Last name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
          /> */}
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />

          {/* Role */}
          {isAdmin && (
            <Input
              label="Role"
              name="role"
              type="text"
              value={formData.email}
              onChange={handleChange}
              readOnly
            />
          )}
          {isVendor && (
            <Input
              label="Phone number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              // placeholder="+234 801 234 5678"
            />
          )}
          {/* <Select
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="">Select role</option>
            {options.map((r, index) => {
              <option key={index} value={r}>
                {r}
              </option>;
            })}
          </Select> */}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 pt-6 border-t border-outline-variant flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <button
          type="button"
          className="w-full sm:w-auto px-4 py-2 rounded-xl border border-on-primary-fixed-variant text-sm font-semibold text-on-surface hover:bg-surface-low transition-colors"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-on-primary-fixed-variant text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
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
