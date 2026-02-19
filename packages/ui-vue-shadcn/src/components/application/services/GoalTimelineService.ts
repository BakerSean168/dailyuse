export interface TimelineSnapshot {
  timestamp: number;
  reason?: string;
  data: {
    totalWeight: number;
    totalProgress: number;
    keyResults: Array<{
      uuid: string;
      title: string;
      weight: number;
      progress: number;
    }>;
  };
}

export interface TimelineData {
  snapshots: TimelineSnapshot[];
  stats: {
    totalSnapshots: number;
    totalChanges: number;
    avgWeightChange: number;
  };
}

export const formatTimelineTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};
