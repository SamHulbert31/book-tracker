import { Sheet } from '../components/Sheet';
import { ChipChoice } from '../components/Chips';

/** Pick which year the Stats screen shows. */
export function YearSheet({ years, value, onPick, onClose }: { years: number[]; value: number; onPick: (year: number) => void; onClose: () => void }) {
  return (
    <Sheet title="Choose a year" onClose={onClose}>
      <ChipChoice<number> label="Year" value={value} options={years.map((y) => ({ value: y, label: String(y) }))} onChange={onPick} />
    </Sheet>
  );
}
