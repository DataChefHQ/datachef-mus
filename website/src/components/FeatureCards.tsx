import { Clapperboard, Mic, MessageSquare } from 'lucide-react'

const cards = [
  {
    icon: Mic,
    title: 'React in the moment',
    body: 'Users leave a voice note, thumbs reaction, or support request right where it happened — on an AI output, a chart, a report row. No forms, no context switching.',
  },
  {
    icon: Clapperboard,
    title: 'Explain once, answer forever',
    body: 'Attach a video or written explanation directly to any section. It lives there permanently — available the moment a user asks "wait, why?"',
  },
  {
    icon: MessageSquare,
    title: 'A direct line when it matters',
    body: 'One click opens a dedicated channel between the user and your team. No tickets, no bots — a real conversation with full context already attached.',
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
