/**
 * database.ts
 * Simula una base de datos persistente usando localStorage.
 * En producción (Vercel) los datos persisten en el navegador del usuario.
 * La estructura imita las tablas de una DB relacional (Neon/PostgreSQL).
 */

import { DEFAULT_MATERIALS, Material } from "../data/materials";
import { v4 as uuidv4 } from "uuid";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // en producción real: hash bcrypt
  company: string;
  phone: string;
  role: "admin" | "user";
  createdAt: string;
}

export interface QuoteItem {
  materialId: string;
  materialName: string;
  category: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

export interface Quote {
  id: string;
  userId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  projectName: string;
  projectDescription: string;
  items: QuoteItem[];
  laborCost: number;
  discountPercent: number;
  taxPercent: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  status: "borrador" | "enviada" | "aprobada" | "rechazada";
  validityDays: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ─── CLAVES LOCALSTORAGE ──────────────────────────────────────────────────────

const KEYS = {
  USERS: "eq_users",
  MATERIALS: "eq_materials",
  QUOTES: "eq_quotes",
  SESSION: "eq_session",
};

// ─── INICIALIZACIÓN ───────────────────────────────────────────────────────────

export function initDB() {
  // Materiales
  if (!localStorage.getItem(KEYS.MATERIALS)) {
    localStorage.setItem(KEYS.MATERIALS, JSON.stringify(DEFAULT_MATERIALS));
  }

  // Usuario admin por defecto
  if (!localStorage.getItem(KEYS.USERS)) {
    const admin: User = {
      id: uuidv4(),
      name: "Administrador",
      email: "admin@electroquote.com",
      password: "admin123",
      company: "ElectroQuote",
      phone: "0000-0000",
      role: "admin",
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(KEYS.USERS, JSON.stringify([admin]));
  }

  // Cotizaciones vacías
  if (!localStorage.getItem(KEYS.QUOTES)) {
    localStorage.setItem(KEYS.QUOTES, JSON.stringify([]));
  }
}

// ─── USUARIOS ─────────────────────────────────────────────────────────────────

export function getUsers(): User[] {
  return JSON.parse(localStorage.getItem(KEYS.USERS) || "[]");
}

export function getUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id);
}

export function createUser(data: Omit<User, "id" | "createdAt" | "role">): User {
  const users = getUsers();
  if (users.find((u) => u.email === data.email)) {
    throw new Error("El correo ya está registrado.");
  }
  const newUser: User = {
    ...data,
    id: uuidv4(),
    role: "user",
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  return newUser;
}

export function updateUser(id: string, data: Partial<User>): User {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error("Usuario no encontrado.");
  users[idx] = { ...users[idx], ...data };
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  return users[idx];
}

export function deleteUser(id: string) {
  const users = getUsers().filter((u) => u.id !== id);
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
}

export function login(email: string, password: string): User {
  const user = getUsers().find((u) => u.email === email && u.password === password);
  if (!user) throw new Error("Correo o contraseña incorrectos.");
  localStorage.setItem(KEYS.SESSION, user.id);
  return user;
}

export function logout() {
  localStorage.removeItem(KEYS.SESSION);
}

export function getSession(): User | null {
  const id = localStorage.getItem(KEYS.SESSION);
  if (!id) return null;
  return getUserById(id) || null;
}

// ─── MATERIALES ───────────────────────────────────────────────────────────────

export function getMaterials(): Material[] {
  return JSON.parse(localStorage.getItem(KEYS.MATERIALS) || "[]");
}

export function createMaterial(data: Omit<Material, "id">): Material {
  const mats = getMaterials();
  const m: Material = { ...data, id: uuidv4() };
  mats.push(m);
  localStorage.setItem(KEYS.MATERIALS, JSON.stringify(mats));
  return m;
}

export function updateMaterial(id: string, data: Partial<Material>): Material {
  const mats = getMaterials();
  const idx = mats.findIndex((m) => m.id === id);
  if (idx === -1) throw new Error("Material no encontrado.");
  mats[idx] = { ...mats[idx], ...data };
  localStorage.setItem(KEYS.MATERIALS, JSON.stringify(mats));
  return mats[idx];
}

export function deleteMaterial(id: string) {
  const mats = getMaterials().filter((m) => m.id !== id);
  localStorage.setItem(KEYS.MATERIALS, JSON.stringify(mats));
}

export function resetMaterials() {
  localStorage.setItem(KEYS.MATERIALS, JSON.stringify(DEFAULT_MATERIALS));
}

// ─── COTIZACIONES ─────────────────────────────────────────────────────────────

export function getQuotes(): Quote[] {
  return JSON.parse(localStorage.getItem(KEYS.QUOTES) || "[]");
}

export function getQuotesByUser(userId: string): Quote[] {
  return getQuotes().filter((q) => q.userId === userId);
}

export function getQuoteById(id: string): Quote | undefined {
  return getQuotes().find((q) => q.id === id);
}

export function createQuote(data: Omit<Quote, "id" | "createdAt" | "updatedAt">): Quote {
  const quotes = getQuotes();
  const q: Quote = {
    ...data,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  quotes.push(q);
  localStorage.setItem(KEYS.QUOTES, JSON.stringify(quotes));
  return q;
}

export function updateQuote(id: string, data: Partial<Quote>): Quote {
  const quotes = getQuotes();
  const idx = quotes.findIndex((q) => q.id === id);
  if (idx === -1) throw new Error("Cotización no encontrada.");
  quotes[idx] = { ...quotes[idx], ...data, updatedAt: new Date().toISOString() };
  localStorage.setItem(KEYS.QUOTES, JSON.stringify(quotes));
  return quotes[idx];
}

export function deleteQuote(id: string) {
  const quotes = getQuotes().filter((q) => q.id !== id);
  localStorage.setItem(KEYS.QUOTES, JSON.stringify(quotes));
}
