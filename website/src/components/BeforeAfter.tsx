const rows = [
  {
    before: 'The AI generated a summary. A user disagreed. There\'s no way to say so without opening a ticket.',
    after:  'The user reacts right on the summary — voice note, thumbs, or a direct message. All tied to that section.',
  },
  {
    before: 'Disagreements with AI outputs and reports surface in Slack, far from the actual content.',
    after:  'A voice note lands in your channel the moment it happens, attached to the exact output.',
  },
  {
    before: 'Frustrated users open a ticket. You find out days later.',
    after:  'One click opens a dedicated channel with full context already attached.',
  },
]

export default function BeforeAfter() {
  return (
    <div className="before-after-section" data-animate>
      <div className="before-after-grid">
        <div className="ba-col ba-before">
          <div className="ba-col-header">
            <span className="ba-badge ba-badge-before">Before</span>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="ba-row ba-row-before">
              <span className="ba-icon-before">✕</span>
              <p>{r.before}</p>
            </div>
          ))}
        </div>
        <div className="ba-col ba-after">
          <div className="ba-col-header">
            <span className="ba-badge ba-badge-after">With MUS</span>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="ba-row ba-row-after">
              <span className="ba-icon-after">✓</span>
              <p>{r.after}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
