/** Small fixed palette for books without a cover image. */
const PALETTE = ['#26432F', '#7C2F2B', '#4A5568', '#B5652E', '#8A6D1F', '#3B2F2F', '#35603F', '#2F4A66', '#6B2D3A'];

export function coverColour(title: string): string {
  let hash = 5381;
  for (const ch of title.trim().toLowerCase()) hash = ((hash << 5) + hash + ch.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}
