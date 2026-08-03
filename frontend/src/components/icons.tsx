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
