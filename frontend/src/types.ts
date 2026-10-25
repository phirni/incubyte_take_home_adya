export type Role = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: Role;
}

export interface Session {
  token: string;
  user: User;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  category: string;
  priceCents: number;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleInput {
  make: string;
  model: string;
  category: string;
  priceCents: number;
  quantity: number;
}

export interface Filters {
  make: string;
  model: string;
  category: string;
  minPrice: string; // dollars, as typed
  maxPrice: string;
}
