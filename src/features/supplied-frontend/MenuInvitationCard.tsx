import { fullMenu, fullMenuCount } from '../../data/fullMenu'
import { authenticPhoto } from './authentic-photos'
import { SavedLink } from './integration'

export function MenuInvitationCard() {
  const photo = authenticPhoto('menu-invitation')
  return <SavedLink
    to="/menu"
    className="menu-invitation-card poster-card"
    aria-label={`Browse the full Mangosteen menu: ${fullMenuCount} dishes in ${fullMenu.length} categories`}
  >
    <div className="menu-invitation-photo">
      <img src={photo.src} srcSet={photo.srcSet} sizes="(max-width: 639px) 76vw, 350px" alt={photo.alt} loading="lazy" decoding="async"/>
      <span className="menu-invitation-kicker">The complete menu</span>
    </div>
    <div className="menu-invitation-copy">
      <h3>Find your next <em>favourite.</em></h3>
      <p>Explore {fullMenuCount} dishes across {fullMenu.length} categories.</p>
      <span className="menu-invitation-action">
        Browse the menu
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </span>
    </div>
  </SavedLink>
}
