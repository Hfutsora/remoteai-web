import { Globe, Home, Star, ArrowLeftRight, ChevronRight } from 'lucide-react';
import type { MarketText } from '../provider-market/i18n';
import { useBookmarks } from './bookmarks/context';
import './browserHome.css';

export function BrowserHome({ t, visit, bookmarks }: {
  t: MarketText; visit: (url: string) => void; bookmarks: () => void;
}) {
  const links = useBookmarks().entries.filter(entry => entry.kind === 'link');
  return <section className="browser-home" aria-label={t('market.browserHome')}>
    <header><Home size={30} /><h2>{t('market.browserHome')}</h2><p>{t('market.browserHomeHint')}</p></header>
    <section className="browser-home-card">
      <button className="browser-home-heading" onClick={bookmarks}>
        <Star size={20} /><strong>{t('market.bookmarkAll')}</strong><ChevronRight size={18} />
      </button>
      {!links.length && <p>{t('market.browserHomeBookmarksHint')}</p>}
      {links.map(entry => <button key={entry.id} className="browser-home-link" onClick={() => visit(entry.url)}>
        <Globe size={21} /><span><strong>{entry.title}</strong><small>{entry.url}</small></span>
      </button>)}
    </section>
    <section className="browser-home-card">
      <h3 className="browser-home-heading"><ArrowLeftRight size={20} />{t('market.browserHomeMappings')}</h3>
      <p>{t('market.browserHomeMappingsWebHint')}</p>
    </section>
  </section>;
}
