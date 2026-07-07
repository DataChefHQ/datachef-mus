import { useEffect, useRef, useState } from 'react'
import { MusProvider, FeedbackTarget, onDemoFeedback, type DemoEvent, type FeedbackTargetHandle } from '@datachef/mus'
import '@datachef/mus/styles.css'

interface ToastEntry {
  id: number
  type: string
  sectionName: string
}

const ACTION_LABELS: Record<string, string> = {
  support: '💬 Support channel opened',
  'thumbs-up': '👍 Thumbs up recorded',
  'thumbs-down': '👎 Thumbs down recorded',
  voice: '🎙️ Voice note submitted',
  video: '▶️ Video opened',
}

export default function PlaygroundDemo() {
  const [toasts, setToasts] = useState<ToastEntry[]>([])

  const summaryRef = useRef<FeedbackTargetHandle>(null)
  const forecastRef = useRef<FeedbackTargetHandle>(null)
  const rankingRef = useRef<FeedbackTargetHandle>(null)

  const handlePlaygroundMouseLeave = () => {
    summaryRef.current?.reset()
    forecastRef.current?.reset()
    rankingRef.current?.reset()
  }

  useEffect(() => {
    let nextId = 1
    return onDemoFeedback((event: DemoEvent) => {
      const id = nextId++
      const sectionName = String(event.payload.sectionName ?? 'Demo')
      setToasts((prev) => [...prev, { id, type: event.type, sectionName }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 4000)
    })
  }, [])

  return (
    <MusProvider
      config={{
        projectName: 'MUS Playground',
        demoMode: true,
        showWelcomeDialog: false,
        theme: 'dark',
        hoverDelay: 300,
        slack: {
          proxyUrl: '',
          supportTeamEmails: ['demo@datachef.co'],
          feedbackChannelId: 'DEMO',
        },
        user: {
          name: 'Demo User',
          email: 'demo@datachef.co',
        },
        actions: [
          { type: 'support' },
          { type: 'thumbs-down' },
          { type: 'thumbs-up' },
          { type: 'voice' },
          { type: 'video' },
        ],
      }}
    >
      <div className="playground-container">
      <div className="playground-mobile-notice">
        <span className="playground-mobile-notice-icon">🖥️</span>
        <div>
          <strong>Desktop only</strong>
          <p>The interactive demo requires a desktop browser. Open this page on your computer to try it.</p>
        </div>
      </div>

      <div className="playground-wrapper" onMouseLeave={handlePlaygroundMouseLeave}>
        <div className="playground-header">
          <div className="playground-dot dot-red" />
          <div className="playground-dot dot-yellow" />
          <div className="playground-dot dot-green" />
          <span className="playground-url">your-ai-app.com / dashboard</span>
        </div>

        <div className="playground-body">
          <p className="playground-hint">
            Hover over any card — then try voice feedback, thumbs, support, or video.
          </p>

          {/* Card 1 — AI-generated summary */}
          <FeedbackTarget ref={summaryRef} sectionId="ai-summary" sectionName="AI Summary">
            <div className="playground-card">
              <div className="playground-card-header">
                <span className="playground-tag">AI-generated</span>
                <span className="playground-card-title">Quarterly Performance Summary</span>
              </div>
              <p className="playground-card-body">
                Revenue grew <strong>17.4%</strong> quarter-over-quarter, driven primarily by
                expansion in the EU region. Customer churn dropped to <strong>2.1%</strong>,
                the lowest in eight quarters. The model recommends focusing the next campaign
                on the <strong>mid-market segment</strong>, where engagement signals are strongest.
              </p>
            </div>
          </FeedbackTarget>

          {/* Card 2 — Forecast */}
          <FeedbackTarget ref={forecastRef} sectionId="forecast" sectionName="Revenue Forecast">
            <div className="playground-card">
              <div className="playground-card-header">
                <span className="playground-tag">Forecast</span>
                <span className="playground-card-title">Next Quarter Prediction</span>
              </div>
              <ul className="playground-list">
                <li>
                  <span>Expected revenue</span>
                  <span className="playground-score">€ 2.4M</span>
                </li>
                <li>
                  <span>Confidence interval</span>
                  <span className="playground-score">87 %</span>
                </li>
                <li>
                  <span>Churn risk</span>
                  <span className="playground-score" style={{ color: '#f59e0b' }}>Medium</span>
                </li>
              </ul>
            </div>
          </FeedbackTarget>

          {/* Card 3 — Ranked recommendations */}
          <FeedbackTarget ref={rankingRef} sectionId="ranking" sectionName="Top Recommendations">
            <div className="playground-card">
              <div className="playground-card-header">
                <span className="playground-tag tag-blue">Ranked</span>
                <span className="playground-card-title">Top Market Segments</span>
              </div>
              <ul className="playground-list">
                <li>
                  <strong>Berlin Mitte</strong>
                  <span className="playground-score">94</span>
                </li>
                <li>
                  <strong>Kreuzberg</strong>
                  <span className="playground-score">92</span>
                </li>
                <li>
                  <strong>Prenzlauer Berg</strong>
                  <span className="playground-score">87</span>
                </li>
              </ul>
            </div>
          </FeedbackTarget>
        </div>
      </div>

      {/* Toast notifications */}
      <div className="playground-toasts">
        {toasts.map((toast) => (
          <div key={toast.id} className="playground-toast">
            <span className="playground-toast-icon">✓</span>
            <div className="playground-toast-body">
              <strong>{ACTION_LABELS[toast.type] ?? toast.type}</strong>
              <span>on "{toast.sectionName}"</span>
            </div>
          </div>
        ))}
      </div>
      </div>{/* end playground-container */}
    </MusProvider>
  )
}
