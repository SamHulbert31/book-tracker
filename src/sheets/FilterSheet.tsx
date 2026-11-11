import { Sheet } from '../components/Sheet';
import { Button } from '../components/Button';
import { FieldGroup } from '../components/Field';
import { ChipChoice, ChipPicker } from '../components/Chips';
import { GENRES } from '../lib/genres';

export type SortKey = 'finished' | 'rating' | 'title' | 'author' | 'added';

export const SORT_LABELS: Record<SortKey, string> = {
  finished: 'date finished',
  rating: 'rating',
  title: 'title',
  author: 'author',
  added: 'date added',
};

export interface LibraryFilters {
  genres: string[];
  /** Show only books rated at least this much. 0 means any. */
  minRating: number;
}

export const NO_FILTERS: LibraryFilters = { genres: [], minRating: 0 };

const RATING_OPTIONS = [
  { value: 0, label: 'Any' },
  { value: 3, label: '3+' },
  { value: 3.5, label: '3.5+' },
  { value: 4, label: '4+' },
  { value: 4.5, label: '4.5+' },
  { value: 5, label: '5' },
];

interface FilterSheetProps {
  /** Sort choices that make sense for the current tab. */
  sortOptions: SortKey[];
  sort: SortKey;
  onSort: (sort: SortKey) => void;
  filters: LibraryFilters;
  onFilters: (filters: LibraryFilters) => void;
  /** Only finished books have ratings. */
  showRating: boolean;
  /** Genres that appear on at least one book, so the picker is not 12 mostly useless chips. */
  genresInUse: string[];
  onClose: () => void;
}

export function FilterSheet({ sortOptions, sort, onSort, filters, onFilters, showRating, genresInUse, onClose }: FilterSheetProps) {
  const known: readonly string[] = GENRES;
  const genreOptions = [...known.filter((g) => genresInUse.includes(g)), ...genresInUse.filter((g) => !known.includes(g))];
  const active = filters.genres.length > 0 || filters.minRating > 0;

  return (
    <Sheet
      title="Sort and filter"
      onClose={onClose}
      footer={
        <>
          <Button block onClick={onClose}>
            Done
          </Button>
          {active && (
            <Button block variant="quiet" onClick={() => onFilters(NO_FILTERS)}>
              Clear filters
            </Button>
          )}
        </>
      }
    >
      <FieldGroup label="Sort by">
        <ChipChoice<SortKey>
          label="Sort by"
          value={sort}
          onChange={onSort}
          options={sortOptions.map((key) => ({ value: key, label: SORT_LABELS[key][0].toUpperCase() + SORT_LABELS[key].slice(1) }))}
        />
      </FieldGroup>
      {genreOptions.length > 0 && (
        <FieldGroup label="Genre">
          <ChipPicker
            options={genreOptions}
            selected={filters.genres}
            onToggle={(g) =>
              onFilters({ ...filters, genres: filters.genres.includes(g) ? filters.genres.filter((x) => x !== g) : [...filters.genres, g] })
            }
          />
        </FieldGroup>
      )}
      {showRating && (
        <FieldGroup label="Rating">
          <ChipChoice<number> label="Minimum rating" value={filters.minRating} onChange={(minRating) => onFilters({ ...filters, minRating })} options={RATING_OPTIONS} />
        </FieldGroup>
      )}
    </Sheet>
  );
}
