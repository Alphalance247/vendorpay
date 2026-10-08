import { useState } from 'react';

const ROLE_STYLES = {
    Owner: 'bg-primary-fixed text-primary',
    Admin: 'bg-secondary-container text-secondary',
    Member: 'bg-surface-container text-on-surface-variant',
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
        <div className="flex flex-col sm:grid sm:grid-cols-[1fr_120px_100px] sm:items-center gap-2 sm:gap-0 px-5 py-4 border-b border-outline-variant last:border-b-0">
            <div>
                <p className="text-[13.5px] font-medium text-on-surface">{member.name}</p>
                <p className="text-[12px] text-on-surface-variant">{member.email}</p>
            </div>

            <RoleBadge role={member.role} />

            {canManage && member.role !== 'Owner' ? (
                <button
                    onClick={() => onRemove(member.id)}
                    className="text-[13px] font-medium text-error hover:underline text-left w-fit"
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
                    <h1 className="font-headline-lg text-xl sm:text-[20px] font-semibold text-on-surface mb-1">
                        Team &amp; permissions
                    </h1>
                    <p className="text-[13.5px] text-on-surface-variant">
                        Manage who has access and what they can do.
                    </p>
                </div>

                {/* {canManage && (
                    <button
                        onClick={handleInvite}
                        className="shrink-0 text-[13.5px] font-medium text-white bg-inverse-surface rounded-md px-4 py-2.5 hover:opacity-85 transition-opacity w-full sm:w-auto"
                    >
                        Invite member
                    </button>
                )} */}
            </div>

            <div className="bg-white border border-outline-variant rounded-xl overflow-hidden">
                {/* Column headers — desktop only, mobile rows are self-labeled by layout */}
                <div className="hidden sm:grid grid-cols-[1fr_120px_100px] px-5 py-3 text-[12px] font-medium text-on-surface-variant border-b border-outline-variant">
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