import { useState } from 'react';

const ROLE_STYLES = {
    Owner: 'bg-[#E7F1EC] text-[#1F6F54]',
    Admin: 'bg-[#EAECFB] text-[#3538CD]',
    Member: 'bg-gray-100 text-gray-500',
};

function RoleBadge({ role }) {
    return (
        <span
            className={`inline-block text-[11.5px] font-medium rounded-full px-2.5 py-1 w-fit ${ROLE_STYLES[role]}`}
        >
            {role}
        </span>
    );
}

function MemberRow({ member, canManage, onRemove }) {
    return (
        <div className="flex flex-col sm:grid sm:grid-cols-[1fr_120px_100px] sm:items-center gap-2 sm:gap-0 px-5 py-4 border-b border-gray-200 last:border-b-0">
            <div>
                <p className="text-[13.5px] font-medium text-gray-900">{member.name}</p>
                <p className="text-[12px] text-gray-500">{member.email}</p>
            </div>

            <RoleBadge role={member.role} />

            {canManage && member.role !== 'Owner' ? (
                <button
                    onClick={() => onRemove(member.id)}
                    className="text-[13px] font-medium text-red-700 hover:underline text-left w-fit"
                >
                    Remove
                </button>
            ) : (
                <div />
            )}
        </div>
    );
}

export default function TeamAndPermissions() {
    // TODO: replace with real session/user context
    const currentUserRole = 'Owner'; // 'Owner' | 'Admin' | 'Member'
    const canManage = currentUserRole === 'Owner' || currentUserRole === 'Admin';

    const [members, setMembers] = useState([
        { id: 1, name: 'Adeola Okafor', email: 'adeola@vendorpay.com', role: 'Owner' },
        { id: 2, name: 'Tunde Bakare', email: 'tunde@vendorpay.com', role: 'Admin' },
        { id: 3, name: 'Chioma Eze', email: 'chioma@vendorpay.com', role: 'Member' },
    ]);


    const handleRemove = (memberId) => {
        // TODO: confirm dialog, then teamService.removeMember(memberId)
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
    };

    return (
        <div className="w-full lg:w-[500px] xl:w-[700px] ">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl sm:text-[20px] font-semibold text-gray-900 mb-1">
                        Team &amp; permissions
                    </h1>
                    <p className="text-[13.5px] text-gray-500">
                        Manage who has access and what they can do.
                    </p>
                </div>

                {/* {canManage && (
                    <button
                        onClick={handleInvite}
                        className="shrink-0 text-[13.5px] font-medium text-white bg-gray-900 rounded-md px-4 py-2.5 hover:opacity-85 transition-opacity w-full sm:w-auto"
                    >
                        Invite member
                    </button>
                )} */}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Column headers — desktop only, mobile rows are self-labeled by layout */}
                <div className="hidden sm:grid grid-cols-[1fr_120px_100px] px-5 py-3 text-[12px] font-medium text-gray-500 border-b border-gray-200">
                    <div>Member</div>
                    <div>Role</div>
                    <div />
                </div>

                {members.map((member) => (
                    <MemberRow
                        key={member.id}
                        member={member}
                        canManage={canManage}
                        onRemove={handleRemove}
                    />
                ))}
            </div>
        </div>
    );
}