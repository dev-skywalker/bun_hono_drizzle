import { drizzle } from "drizzle-orm/d1";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { Context } from "hono";
import { sign } from "hono/jwt";
import { Env } from "../../config/env";

export const userRegister = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { email, password, role, isActive } = await c.req.json();
    // const body = await c.req.parseBody();

    // let email = body["email"].toString();
    // let password = body["password"].toString();
    // let role = body["role"].toString();
    // let isActive = (body["isActive"].toString() === "true");

    const hash = await hashPassword(password)
    // console.log(hash)

    // Validate the role
    const validRoles = ["admin", "user"];
    if (!validRoles.includes(role)) {
        c.status(400);
        return c.json({ message: 'Invalid role' });
    }

    const userExists = await db.select().from(users).where(eq(users.email, email));
    if (userExists[0]) {
        c.status(409);
        return c.json({ message: 'User already exists' });
    }
    const data = {
        email: email,
        password: hash,
        role: role,
        isActive: isActive,
        createdAt: Date.now(),
        updatedAt: Date.now()
    }

    // Insert new user
    const newUser: any = await db.insert(users).values(data).returning({ id: users.id, email: users.email, role: users.role });
    c.status(201);
    return c.json(newUser);
}

export const userLogin = async (c: Context) => {
    const { email, password } = await c.req.json();
    // const body = await c.req.parseBody();
    // console.log("Hey Now")
    // let email = body['email'].toString();
    // let password = body['password'].toString()

    const db = drizzle(c.env.DB);
    const user = await db.select().from(users).where(eq(users.email, email));
    console.log(user)

    if (!user[0]) {
        c.status(401);
        return c.json({ message: 'Invalid credentials' });
    }
    const validPassword = await verifyPassword(password, user[0].password);
    if (!validPassword) {
        c.status(401);
        return c.json({ message: 'Invalid credentials' });
    }

    const payload = {
        userId: user[0].id,
        email: user[0].email,
        role: user[0].role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
    };

    const token = await sign(payload, "jwt-secret");
    //setCookie(c, "token", token);
    return c.json({ token });
}

export const getAllUser = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const result = await db.select({
        id: users.id, email: users.email, role: users.role,
        isActive: users.isActive, createdAt: users.createdAt,
        updatedAt: users.updatedAt
    }).from(users).all();
    return c.json(result);
}

export const deleteUser = async (c: Context) => {
    const { id } = await c.req.json();
    //let id = Number(body['id']);
    const db = drizzle(c.env.DB);

    const query = await db.delete(users).where(eq(users.id, id)).returning({ deletedId: users.id });
    return c.json(query)
}

async function hashPassword(password: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'your-salt');
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(inputPassword: string, storedHash: string) {
    const inputHash = await hashPassword(inputPassword);
    return inputHash === storedHash;
}


export const deleteAllUsers = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const result = await db.select().from(users).all();
    result.map(async (i) => {
        await db.delete(users).where(eq(users.id, i.id));
    })
    return c.json({ message: "OK" });
}