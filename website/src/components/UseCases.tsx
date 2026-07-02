import { BarChart3, Sparkles, BookOpen, Wrench } from 'lucide-react'

const tiles = [
  {
    icon: BarChart3,
    title: 'Dashboards & analytics',
    description: 'Charts and data that users question, compare, and debate. MUS puts the conversation on the chart.',
  },
  {
    icon: Sparkles,
    title: 'AI-powered products',
    description: 'AI generates. Users question. MUS captures that disagreement right on the output — voice note, thumbs, or a direct escalation to your team.',
  },
  {
    icon: BookOpen,
    title: 'E-learning platforms',
    description: 'Lessons and content that learners react to. Attach explanations, collect reactions, without redirecting away.',
  },
  {
    icon: Wrench,
    title: 'Internal tools',
    description: 'Reports and outputs your team questions in meetings. Surface that feedback before the meeting.',
  },
]

export default function UseCases() {
  return (
    <div className="use-cases" data-animate>
      <div className="use-cases-header">
        <h2>Built for any product where output matters</h2>
      </div>
      <div className="use-cases-grid">
        {tiles.map(({ icon: Icon, title, description }) => (
          <div key={title} className="use-case-tile">
            <div className="use-case-icon">
              <Icon size={20} strokeWidth={1.75} />
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
