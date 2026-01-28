import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export interface UserPayload {
    username: string;
    iat: number;
    exp: number;
}

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
    if (username !== ADMIN_USERNAME) return false;

    // For simplicity, direct comparison. In production, use hashed password
    return password === ADMIN_PASSWORD;
}

export function createToken(username: string): string {
    return jwt.sign(
        { username },
        JWT_SECRET,
        { expiresIn: '8h' }
    );
}

export function verifyToken(token: string): UserPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as UserPayload;
    } catch {
        return null;
    }
}

export async function getSession(): Promise<UserPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('db-monitor-token')?.value;

    if (!token) return null;
    return verifyToken(token);
}

export async function isAuthenticated(): Promise<boolean> {
    const session = await getSession();
    return session !== null;
}
