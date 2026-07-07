export default function FinalCTA() {
  return (
    <div className="final-cta" data-animate>
      <h2>Add MUS in minutes</h2>
      <p className="final-cta-sub">Install the package, wrap a section, configure your destination. That's it.</p>
      <div className="final-cta-install">
        <span className="final-cta-install-label">npm</span>
        <span>npm install @datachef/mus</span>
      </div>
      <div className="final-cta-actions">
        <a href="/getting-started" className="final-cta-btn-primary">Get started →</a>
        <a
          href="https://github.com/DataChefHQ/datachef-mus"
          target="_blank"
          rel="noopener noreferrer"
          className="final-cta-btn-secondary"
        >
          GitHub ↗
        </a>
      </div>
    </div>
  )
}
