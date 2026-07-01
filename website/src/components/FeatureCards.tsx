import { Clapperboard, Mic, MessageSquare } from 'lucide-react'

const cards = [
  {
    icon: Clapperboard,
    title: 'Contextual video insight',
    body: 'Attach an explainer video directly to any section. Users get clarity right where confusion happens, with no redirects and no docs tab.',
  },
  {
    icon: Mic,
    title: 'Frictionless voice feedback',
    body: 'Testers react immediately at the exact point of judgment, in their own voice. No forms. No references. No detours.',
  },
  {
    icon: MessageSquare,
    title: 'One-click support channel',
    body: 'A dedicated Slack channel opens instantly for urgent matters. Developers are reachable exactly where the issue surfaced.',
  },
]

export default function FeatureCards() {
  return (
    <div className="feature-cards" style={{ display: 'flex', alignItems: 'stretch', gap: '1rem' }}>
      {cards.map(({ icon: Icon, title, body }) => (
        <div key={title} className="feature-card" style={{ flex: '1 1 0', alignSelf: 'stretch' }}>
          <div className="feature-card-header">
            <span className="feature-card-icon">
              <Icon size={18} strokeWidth={1.75} />
            </span>
            <strong>{title}</strong>
          </div>
          <p>{body}</p>
        </div>
      ))}
    </div>
  )
}
