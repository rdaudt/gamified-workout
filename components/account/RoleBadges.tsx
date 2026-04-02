import type { UserRole } from '@/lib/types/domain'

const labelByRole: Record<UserRole, string> = {
  trainee: 'Trainee',
  coach: 'Coach',
  admin: 'Admin',
}

export function RoleBadges({ roles }: { roles: UserRole[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((role) => (
        <span
          key={role}
          className="rounded-full border border-line bg-panel px-3 py-1 text-xs uppercase tracking-[0.2em] text-signal"
        >
          {labelByRole[role]}
        </span>
      ))}
    </div>
  )
}
