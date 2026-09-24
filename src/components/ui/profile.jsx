// import { useEffect, useState } from "react";
import { useAuth } from "../../lib/authContext";
// import { vendorService } from "../../../lib/services/vendorService";
import ProfileForm from "../layout/profileForm";
// const role=""|""|""
export default function Profile() {
  const { user } = useAuth();

  // Admin profile data
  const adminProfile = {
    firstName:
      user?.firstName ||
      user?.first_name ||
      "Administrator",

    lastName:
      user?.lastName ||
      user?.last_name ||
      "",

    email:
      user?.email ||
      user?.email_address ||
      user?.user_email ||
      "",
    role: "admin",

    profileImage:
      user?.profileImage ||
      user?.profile_image ||
      null,
  };

  const handleSubmit = (data) => {
    console.log("Admin profile update:", data);
  };

  return (
    // <GeneralSettingsLayout role="admin">
    <div className="w-full  lg:w-[500px] xl:w-[700px]">
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-on-surface">
          Profile
        </h1>

        <p className="mt-1 text-sm text-on-surface-variant">
          Manage your personal information and profile photo.
        </p>
      </div>

      <ProfileForm
        initialData={adminProfile}
        onSubmit={handleSubmit()}
        role="admin"
      />
    </div>
    // </GeneralSettingsLayout>
  );
}
