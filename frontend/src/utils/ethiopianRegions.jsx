/**
 * Ethiopian administrative divisions
 * Federal Democratic Republic of Ethiopia
 * Includes all regional states and city administrations
 */

export const ETHIOPIAN_REGIONS = [
  // City Administrations
  { value: 'Addis Ababa',        label: 'Addis Ababa',        amharic: 'አዲስ አበባ',        type: 'city'   },
  { value: 'Dire Dawa',          label: 'Dire Dawa',          amharic: 'ድሬ ዳዋ',          type: 'city'   },
  // Regional States
  { value: 'Afar',               label: 'Afar',               amharic: 'አፋር',            type: 'region' },
  { value: 'Amhara',             label: 'Amhara',             amharic: 'አማራ',            type: 'region' },
  { value: 'Benishangul-Gumuz',  label: 'Benishangul-Gumuz',  amharic: 'ቤኒሻንጉል-ጉምዝ',   type: 'region' },
  { value: 'Central Ethiopia',   label: 'Central Ethiopia',   amharic: 'መካከለኛ ኢትዮጵያ',  type: 'region' },
  { value: 'Gambela',            label: 'Gambela',            amharic: 'ጋምቤላ',           type: 'region' },
  { value: 'Harari',             label: 'Harari',             amharic: 'ሐረሪ',            type: 'region' },
  { value: 'Oromia',             label: 'Oromia',             amharic: 'ኦሮሚያ',           type: 'region' },
  { value: 'Sidama',             label: 'Sidama',             amharic: 'ሲዳማ',            type: 'region' },
  { value: 'Somali',             label: 'Somali',             amharic: 'ሶማሌ',            type: 'region' },
  { value: 'South Ethiopia',     label: 'South Ethiopia',     amharic: 'ደቡብ ኢትዮጵያ',    type: 'region' },
  { value: 'Southwest Ethiopia', label: 'Southwest Ethiopia', amharic: 'ደቡብ ምዕራብ ኢትዮጵያ', type: 'region' },
  { value: 'Tigray',             label: 'Tigray',             amharic: 'ትግራይ',           type: 'region' },
];

/**
 * Render a <select> with Ethiopian regions grouped by city/region.
 * Use this in any form that needs a region field.
 *
 * Example:
 *   <RegionSelect value={form.region} onChange={e => setForm({...form, region: e.target.value})} />
 */
export function RegionSelect({ value, onChange, className, style, id, required }) {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      className={className}
      style={style}
      required={required}
    >
      <option value="">— Select region —</option>

      <optgroup label="City Administrations">
        {ETHIOPIAN_REGIONS.filter(r => r.type === 'city').map(r => (
          <option key={r.value} value={r.value}>
            {r.label} — {r.amharic}
          </option>
        ))}
      </optgroup>

      <optgroup label="Regional States">
        {ETHIOPIAN_REGIONS.filter(r => r.type === 'region').map(r => (
          <option key={r.value} value={r.value}>
            {r.label} — {r.amharic}
          </option>
        ))}
      </optgroup>
    </select>
  );
}
