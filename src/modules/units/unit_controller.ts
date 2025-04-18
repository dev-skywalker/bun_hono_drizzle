import { drizzle } from "drizzle-orm/d1";
import { units } from "../../db/schema";
import { eq, like, sql } from "drizzle-orm";
import { Context } from "hono";
import { Env } from "../../config/env";

export const createUnit = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { name, description } = await c.req.json();

    const data = {
        name: name,
        description: description,
        createdAt: Date.now(),
        updatedAt: Date.now()
    }

    // Insert new user
    const newUnit: any = await db.insert(units).values(data).returning({
        id: units.id
    });

    if (newUnit.length === 0) {
        c.status(404);
        return c.json({ message: "Unit not found" });
    }

    c.status(201);
    return c.json(newUnit[0]);
}
export const getHello = async (c: Context<{ Bindings: Env }>) => {
    return c.json({ "sutatus": "ok" })
}
export const updateUnit = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { id, name, description, createdAt } = await c.req.json();
    // const body = await c.req.parseBody();

    const data = {
        name: name,
        description: description,
        createdAt: createdAt,
        updatedAt: Date.now()
    }

    const updateUnit: any = await db.update(units).set(data).where(eq(units.id, id)).returning({
        id: units.id
    });

    if (updateUnit.length === 0) {
        c.status(404);
        return c.json({ message: "Unit not found" });
    }

    c.status(200);
    return c.json(updateUnit[0]);
}

export const getAllUnits = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const result = await db.select().from(units).all();
    return c.json(result);
}

export const getUnit = async (c: Context) => {
    const { id } = c.req.param();
    const db = drizzle(c.env.DB);

    const query = await db.select().from(units).where(eq(units.id, Number(id)));
    if (query.length === 0) {
        c.status(404);
        return c.json({ message: "Unit not found" });
    }
    return c.json(query[0])
}

export const deleteUnit = async (c: Context) => {
    const { id } = await c.req.json();
    const db = drizzle(c.env.DB);

    const query = await db.delete(units).where(eq(units.id, id)).returning({ deletedId: units.id });

    if (query.length === 0) {
        c.status(404);
        return c.json({ message: "Unit not found" });
    }
    return c.json(query[0])
}


export const deleteAllUnits = async (c: Context) => {
    const db = drizzle(c.env.DB);
    await db.delete(units).execute();

    c.status(200);
    return c.json({ message: "All unit deleted successfully" });
}

export const getPaginateUnits = async (c: Context) => {
    const { filter, limit, offset, sortBy, sortOrder } = c.req.query();
    const db = drizzle(c.env.DB);

    // Base query
    let query: any = db.select().from(units);

    // Apply filter if present
    if (filter) {
        query = query.where(like(units.name, `%${filter}%`));
    }

    // Get the total number of filtered records
    const subQuery = query.as("sub");
    const totalRecordsQuery = db
        .select({ total: sql<number>`count(*)` })
        .from(subQuery);
    const totalRecordsResult = await totalRecordsQuery.execute();
    const totalRecords = Number(totalRecordsResult[0].total);

    // Sorting
    let que;
    if (sortBy && sortOrder) {
        if (sortBy === "name" && sortOrder === "desc") {
            que = sql`${units.name} desc nulls first`;
        } else if (sortBy === "name" && sortOrder === "asc") {
            que = sql`${units.name} asc nulls first`;
        } else if (sortBy === "id" && sortOrder === "desc") {
            que = sql`${units.id} desc nulls first`;
        } else if (sortBy === "id" && sortOrder === "asc") {
            que = sql`${units.id} asc nulls first`;
        } else {
            que = sql`${units.id} asc nulls first`;
        }
    } else {
        que = sql`${units.id} asc nulls first`;
    }

    // Apply sorting, limit, and offset
    query = query.orderBy(que)
        .limit(Number(limit))
        .offset(Number(offset));

    const results = await query.execute();

    // Transform data
    // const transformedData: any = {
    //     totalRecords: totalRecords,
    //     data: results.map((item: any) => ({
    //         id: item.units.id,
    //         name: item.units.name

    //     })),
    // };

    return c.json({ totalRecords: totalRecords, data: results });
};


