const FALLBACK = [
  { link: '#', image: 'https://picsum.photos/seed/f1-racing-car-fast/800/500', title: 'F1 car at speed on circuit' },
  { link: '#', image: 'https://picsum.photos/seed/f1-pit-stop-crew/600/400', title: 'Pit crew performing lightning fast tyre change' },
  { link: '#', image: 'https://picsum.photos/seed/f1-night-race-bahrain/600/400', title: 'Night race illuminated circuit' },
  { link: '#', image: 'https://picsum.photos/seed/f1-overtake-wheel-to-wheel/700/500', title: 'Wheel-to-wheel racing battle' },
  { link: '#', image: 'https://picsum.photos/seed/monaco-grandstand-crowd/700/500', title: 'Monaco grandstand packed with fans' },
  { link: '#', image: 'https://picsum.photos/seed/f1-podium-celebration/600/400', title: 'Podium celebration with champagne' },
];

const RE = /<a[^>]*?class="[^"]*?ms-item--photo-gallery[^"]*?"[^>]*?href="([^"]+?)"[^>]*?>[\s\S]*?<img[^>]*?src="([^"]+?)"[^>]*?>[\s\S]*?<p[^>]*?class="ms-item__thumb-title"[^>]*?>\s*([\s\S]*?)\s*<\/p>/g;

async function fetchGalleryItems() {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 5000);
  try {
    const resp = await fetch('https://www.motorsport.com/f1/galleries/', { signal: ctrl.signal });
    const html = await resp.text();
    const items = [];
    let m;
    while ((m = RE.exec(html)) !== null) {
      if (items.length >= 6) break;
      let link = m[1];
      if (!link.startsWith('http')) link = 'https://www.motorsport.com' + link;
      let img = m[2].replace('/s200/', '/s800/').replace('/s300/', '/s800/');
      const title = m[3].replace(/<[^>]*>/g, '').trim();
      items.push({ link, image: img, title });
    }
    if (items.length === 0) throw new Error('no items parsed');
    return items;
  } finally {
    clearTimeout(t);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400');
  try {
    const items = await fetchGalleryItems();
    res.status(200).json(items);
  } catch {
    res.status(200).json(FALLBACK);
  }
}
