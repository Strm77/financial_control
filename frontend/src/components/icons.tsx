import type { SVGProps } from 'react'

function IconBase(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  )
}

export function IconDashboard(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
    </IconBase>
  )
}

export function IconIncome(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <polyline points="3 16.5 9.5 10 13.5 14 21 6.5" />
      <polyline points="15 6.5 21 6.5 21 12.5" />
    </IconBase>
  )
}

export function IconExpense(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <polyline points="3 7.5 9.5 14 13.5 10 21 17.5" />
      <polyline points="15 17.5 21 17.5 21 11.5" />
    </IconBase>
  )
}

export function IconDebt(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <rect x="2.2" y="5.5" width="19.6" height="13.5" rx="2.4" />
      <line x1="2.2" y1="9.8" x2="21.8" y2="9.8" />
      <line x1="5.5" y1="15" x2="9.5" y2="15" />
    </IconBase>
  )
}

export function IconPayments(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2.4" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
      <polyline points="8 15.3 10.6 17.8 16 12.6" />
    </IconBase>
  )
}

export function IconSettings(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <circle cx="9" cy="6" r="2" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <circle cx="15" cy="12" r="2" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="11" cy="18" r="2" />
    </IconBase>
  )
}

export function IconTrash(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7" />
      <path d="M6 7l1 13a1.5 1.5 0 0 0 1.5 1.4h7A1.5 1.5 0 0 0 17 20l1-13" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </IconBase>
  )
}

export function IconEdit(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M15.5 4.5l4 4L8 20H4v-4z" />
      <path d="M13.5 6.5l4 4" />
    </IconBase>
  )
}

export function IconUpload(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M12 16V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
    </IconBase>
  )
}

export function IconSun(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <line x1="12" y1="2.5" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="21.5" />
      <line x1="4.2" y1="4.2" x2="6" y2="6" />
      <line x1="18" y1="18" x2="19.8" y2="19.8" />
      <line x1="2.5" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="21.5" y2="12" />
      <line x1="4.2" y1="19.8" x2="6" y2="18" />
      <line x1="18" y1="6" x2="19.8" y2="4.2" />
    </IconBase>
  )
}

export function IconMoon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M20.5 14.5a8.5 8.5 0 1 1-9-13 7 7 0 0 0 9 13z" />
    </IconBase>
  )
}
