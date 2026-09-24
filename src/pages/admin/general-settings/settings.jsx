import { useState } from "react";

import Profile from "../../../components/ui/profile";
import Security from "../../../components/ui/security";
import Company from "../../../components/ui/company";
import TeamsAndPermissions from "../../../components/ui/teamsAndPermissions";
import SettingsLayout from "../../../components/layout/GeneralSettingsLayout";
import PayoutRails from "../../../components/ui/PayoutRails";
import PayoutLimit from "../../../components/ui/PayoutLimit";

export default function Settings() {
  const [activePage, setActivePage] = useState("profile");

  const pages = {
    profile: <Profile />,
    security: <Security />,
    company: <Company />,
    "teams-and-permissions": <TeamsAndPermissions />,
    "banking-and-payout-rails": <PayoutRails />,
    "payout-limit": <PayoutLimit />,
  };

  return (
    <SettingsLayout
      role="admin"
      activePage={activePage}
      onPageChange={setActivePage}
    >
      {pages[activePage] || <Profile />}
    </SettingsLayout>
  );
}
