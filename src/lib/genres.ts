export const GENRES = [
  'Science fiction',
  'Fantasy',
  'Non fiction',
  'Classics',
  'Historical',
  'Thriller',
  'Mystery',
  'Romance',
  'Biography',
  'Self improvement',
  'Horror',
  'Other',
] as const;

const RULES: [string, RegExp][] = [
  ['Science fiction', /science fiction|sci-?fi|dystopi|space opera|cyberpunk|time travel|extraterrestrial|androids?\b/],
  ['Fantasy', /fantasy|magic|wizard|dragon|fairy tale|elves|sword and sorcery/],
  ['Biography', /biograph|memoir|autobiograph/],
  ['Self improvement', /self-?help|self-?improvement|habit|motivation|personal development|success|productivity/],
  ['Classics', /classic/],
  ['Historical', /historical fiction|historical novel/],
  ['Thriller', /thriller|suspense|espionage|spy\b/],
  ['Mystery', /mystery|mysteries|detective|crime|murder/],
  ['Romance', /romance|love stor/],
  ['Horror', /horror|ghost|vampire|haunted|supernatural/],
  ['Non fiction', /non-?fiction|essays|philosoph|psycholog|economic|politic|science(?! fiction)|history|mathematic|technology|business|self-?awareness/],
];

/** Maps free text subjects (from Open Library) to at most three genres from the fixed list. Empty when unclear. */
export function mapSubjects(subjects: string[] = []): string[] {
  const counts = new Map<string, number>();
  for (const subject of subjects) {
    const text = subject.toLowerCase();
    for (const [genre, pattern] of RULES) {
      if (pattern.test(text)) counts.set(genre, (counts.get(genre) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([genre]) => genre);
}
