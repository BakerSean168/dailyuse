export interface SubtaskServer {
  id: string;
  name: string;
  isCompleted: boolean;
  order: number;
}

export interface SubtaskServerDTO {
  id: string;
  name: string;
  isCompleted: boolean;
  order: number;
}

export interface SubtaskPersistenceDTO {
    id: string;
    name: string;
    isCompleted: boolean;
    order: number;
}