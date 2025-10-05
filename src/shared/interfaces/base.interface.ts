import { Timestamp } from 'typeorm';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface BaseService<T> {
  create(data: Partial<T>, userId?: string): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(filters?: any): Promise<T[]>;
  update(id: string, data: Partial<T>, userId?: string): Promise<T>;
  delete(id: string): Promise<boolean>;
}

export interface BaseRepository<T> {
  create(data: Partial<T>, userId?: string): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(filters?: any): Promise<T[]>;
  update(id: string, data: Partial<T>, userId?: string): Promise<T>;
  delete(id: string): Promise<boolean>;
  softDelete(id: string): Promise<boolean>;
}
