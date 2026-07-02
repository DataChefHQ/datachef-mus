export default function HowItWorks() {
  return (
    <div className="how-it-works" data-animate>
      <div className="how-it-works-header">
        <h2>How it works</h2>
      </div>
      <div className="hiw-steps">
        <div className="hiw-step">
          <div className="hiw-step-num">1</div>
          <div className="hiw-step-body">
            <h3>Wrap any section</h3>
            <p>Drop <code>{'<FeedbackTarget>'}</code> around any output in your app. That's the only code change required on the frontend.</p>
            <pre
              className="hiw-code"
              dangerouslySetInnerHTML={{ __html:
`<span class="tok-kw">import</span> { MusProvider, FeedbackTarget } <span class="tok-kw">from</span> <span class="tok-str">'@datachefhq/mus'</span>

<span class="tok-tag">&lt;MusProvider</span> <span class="tok-attr">config</span>={{ projectName: <span class="tok-str">'My App'</span>, ... }}<span class="tok-tag">&gt;</span>
  <span class="tok-tag">&lt;FeedbackTarget</span>
    <span class="tok-attr">sectionId</span>=<span class="tok-str">"revenue-chart"</span>
    <span class="tok-attr">sectionName</span>=<span class="tok-str">"Revenue Chart"</span>
  <span class="tok-tag">&gt;</span>
    <span class="tok-tag">&lt;RevenueChart</span> <span class="tok-tag">/&gt;</span>
  <span class="tok-tag">&lt;/FeedbackTarget&gt;</span>
<span class="tok-tag">&lt;/MusProvider&gt;</span>`
              }}
            />
          </div>
        </div>
        <div className="hiw-step">
          <div className="hiw-step-num">2</div>
          <div className="hiw-step-body">
            <h3>Users hover and react</h3>
            <p>A toolbar appears on hover. Voice notes, thumbs, support requests — no form, no context switch. The feedback is tied to that exact section automatically.</p>
          </div>
        </div>
        <div className="hiw-step">
          <div className="hiw-step-num">3</div>
          <div className="hiw-step-body">
            <h3>Feedback routes to your team</h3>
            <p>Slack, Discord, Teams, or any webhook. Or run the <code>mus-server</code> Docker sidecar alongside your app — no Node.js server to maintain, no backend to write.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
