import { getDb, generateId, now, hashPassword } from "./db";
import type { User, Session } from "./types";

export async function registerUser(
  username: string,
  email: string,
  password: string
): Promise<User> {
  const db = await getDb();
  const existing = await db.query<{ username: string; email: string }>(
    "SELECT username, email FROM users WHERE username = $1 OR email = $2",
    [username, email]
  );
  if (existing.rows.length > 0) {
    if (existing.rows[0].username === username)
      throw new Error("Username already taken");
    throw new Error("Email already registered");
  }

  const id = generateId();
  const ts = now();
  const hash = await hashPassword(password);
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
  const avatarColor = colors[Math.floor(Math.random() * colors.length)];

  await db.query(
    `INSERT INTO users (id, username, email, password_hash, display_name, bio, avatar_color, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [id, username, email, hash, username, "", avatarColor, ts, ts]
  );

  return getUserById(id) as Promise<User>;
}

export async function loginUser(
  identifier: string,
  password: string
): Promise<User> {
  const db = await getDb();
  const hash = await hashPassword(password);
  const result = await db.query<User>(
    "SELECT * FROM users WHERE (username = $1 OR email = $1) AND password_hash = $2",
    [identifier, hash]
  );
  if (result.rows.length === 0) throw new Error("Invalid credentials");
  return result.rows[0];
}

export async function getUserById(id: string): Promise<User | null> {
  const db = await getDb();
  const result = await db.query<User>("SELECT * FROM users WHERE id = $1", [id]);
  return result.rows[0] || null;
}

export async function updateUser(
  id: string,
  updates: Partial<Pick<User, "display_name" | "bio" | "avatar_color">>
): Promise<User> {
  const db = await getDb();
  const ts = now();
  await db.query(
    `UPDATE users SET display_name = $2, bio = $3, avatar_color = $4, updated_at = $5 WHERE id = $1`,
    [id, updates.display_name ?? "", updates.bio ?? "", updates.avatar_color ?? "#3b82f6", ts]
  );
  const user = await getUserById(id);
  return user!;
}

const SESSION_KEY = "cms-session";

export function saveSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
