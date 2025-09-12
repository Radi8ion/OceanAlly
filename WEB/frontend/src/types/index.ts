// This is now the single, authoritative definition for a Hotspot
export interface Hotspot {
  center: [number, number]; // [latitude, longitude]
  report_count: number;
  report_ids: string[];
}