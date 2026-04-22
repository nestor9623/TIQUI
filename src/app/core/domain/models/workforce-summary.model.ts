export interface WorkforceSummary {
  total: number;
  active: number;
  onPause: number;
  absent: number;
}

export interface WorkforceLocationPoint {
  id: string;
  lat: number;
  lng: number;
  city: string;
  country: string;
  total: number;
  active: number;
  onPause: number;
  absent: number;
  percentage: number;
}

export interface WorkforceDashboard {
  summary: WorkforceSummary;
  locations: WorkforceLocationPoint[];
}
