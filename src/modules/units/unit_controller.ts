import { drizzle } from "drizzle-orm/d1";
import { units } from "../../db/schema";
import { eq } from "drizzle-orm";
import { Context } from "hono";
import { Env } from "../../config/env";

export const createUnit = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { name } = await c.req.json();
    // const body = await c.req.parseBody();

    const data = {
        name: name,
        createdAt: Date.now(),
        updatedAt: Date.now()
    }

    // Insert new user
    const newUnit: any = await db.insert(units).values(data).returning({
        id: units.id, name: units.name, createdAt: units.createdAt, updatedAt: units.updatedAt
    });
    c.status(201);
    return c.json(newUnit);
}

export const getAllUnits = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const result = await db.select().from(units).all();
    return c.json(result);
}

export const deleteUnit = async (c: Context) => {
    const { id } = await c.req.json();
    const db = drizzle(c.env.DB);

    const query = await db.delete(units).where(eq(units.id, id)).returning({ deletedId: units.id });
    return c.json(query)
}


export const deleteAllUnits = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const result = await db.select().from(units).all();
    result.map(async (i) => {
        await db.delete(units).where(eq(units.id, i.id));
    })
    return c.json({ message: "OK" });
}
