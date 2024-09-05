import { drizzle } from "drizzle-orm/d1";
import { eq, like, sql } from "drizzle-orm";
import { Context } from "hono";
import { Env } from "../../config/env";
import { brands } from "../../db/schema";

export const createBrand = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { name, description } = await c.req.json();

    const data = {
        name: name,
        description: description,
        createdAt: Date.now(),
        updatedAt: Date.now()
    }

    // Insert new user
    const newBrand: any = await db.insert(brands).values(data).returning({
        id: brands.id
    });

    if (newBrand.length === 0) {
        c.status(404);
        return c.json({ message: "Brand not found" });
    }
    c.status(201);
    return c.json(newBrand[0]);
}

export const updateBrand = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { id, name, description, createdAt } = await c.req.json();

    const data = {
        name: name,
        description: description,
        createdAt: createdAt,
        updatedAt: Date.now()
    }

    const updateBrand: any = await db.update(brands).set(data).where(eq(brands.id, id)).returning({
        id: brands.id
    });
    if (updateBrand.length === 0) {
        c.status(404);
        return c.json({ message: "Brand not found" });
    }
    c.status(200);
    return c.json(updateBrand[0]);
}

export const getAllBrands = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const result = await db.select().from(brands).all();
    return c.json(result);
}

export const deleteBrand = async (c: Context) => {
    const { id } = await c.req.json();
    const db = drizzle(c.env.DB);

    const query = await db.delete(brands).where(eq(brands.id, id)).returning({ deletedId: brands.id });
    if (query.length === 0) {
        c.status(404);
        return c.json({ message: "Brand not found" });
    }
    return c.json(query[0])
}


export const deleteAllBands = async (c: Context) => {
    const db = drizzle(c.env.DB);
    await db.delete(brands).execute();

    c.status(200);
    return c.json({ message: "All brands deleted successfully" });
}

export const getPaginateBrands = async (c: Context) => {
    const { filter, limit, offset, sortBy, sortOrder } = c.req.query();
    const db = drizzle(c.env.DB);

    // Base query
    let query: any = db.select().from(brands);

    // Apply filter if present
    if (filter) {
        query = query.where(like(brands.name, `%${filter}%`));
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
            que = sql`${brands.name} desc nulls first`;
        } else if (sortBy === "name" && sortOrder === "asc") {
            que = sql`${brands.name} asc nulls first`;
        } else if (sortBy === "id" && sortOrder === "desc") {
            que = sql`${brands.id} desc nulls first`;
        } else if (sortBy === "id" && sortOrder === "asc") {
            que = sql`${brands.id} asc nulls first`;
        } else {
            que = sql`${brands.id} asc nulls first`;
        }
    } else {
        que = sql`${brands.id} asc nulls first`;
    }

    // Apply sorting, limit, and offset
    query = query.orderBy(que)
        .limit(Number(limit))
        .offset(Number(offset));

    const results = await query.execute();

    return c.json({ totalRecords: totalRecords, data: results });
};


