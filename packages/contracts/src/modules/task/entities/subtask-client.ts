export interface SubtaskClient {
  id: string;
  name: string;
  isCompleted: boolean;
  order: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface SubtaskClientDTO {
  id: string;
  name: string;
  isCompleted: boolean;
  order: number;
  version: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

