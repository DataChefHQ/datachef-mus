import { MousePointerClick, Video, Webhook } from 'lucide-react'

const pillars = [
  {
    icon: MousePointerClick,
    label: 'React',
    description: 'Users hover and leave feedback right where it happened — on an AI output, a chart, a report row, anything.',
  },
  {
    icon: Video,
    label: 'Explain',
    description: 'Attach video or written context to any section. It lives there permanently, not in a docs tab.',
  },
  {
    icon: Webhook,
    label: 'Route',
    description: 'Lands in Slack, Discord, Teams, or your own webhook. No backend to write.',
  },
]

export default function ThreePillars() {
  return (
    <div className="three-pillars">
      {pillars.map(({ icon: Icon, label, description }) => (
        <div key={label} className="pillar">
          <span className="pillar-icon"><Icon size={20} strokeWidth={1.75} /></span>
          <strong className="pillar-label">{label}</strong>
          <p className="pillar-desc">{description}</p>
        </div>
      ))}
    </div>
  )
}
