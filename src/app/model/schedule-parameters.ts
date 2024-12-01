export interface ScheduleParameters {
  dates: string[];
  people: string[];
  minDutiesPerPerson: number[];
  maxDutiesPerPerson: number[];
  availabilities: boolean[][];
}
