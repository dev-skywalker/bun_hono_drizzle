import { drizzle } from "drizzle-orm/d1";
import { category } from "../../db/schema";
import { eq, like, sql } from "drizzle-orm";
import { Context } from "hono";
import { Env } from "../../config/env";

export const createCategory = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { name, description } = await c.req.json();
    const data = {
        name: name,
        description: description,
        createdAt: Date.now(),
        updatedAt: Date.now()
    }

    // Insert new user
    const newCategory: any = await db.insert(category).values(data).returning({
        id: category.id
    });
    if (newCategory.length === 0) {
        c.status(404);
        return c.json({ message: "Category not found" });
    }
    c.status(201);
    return c.json(newCategory[0]);
}

export const updateCategory = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { id, name, description, createdAt } = await c.req.json();

    const data = {
        name: name,
        description: description,
        createdAt: createdAt,
        updatedAt: Date.now()
    }

    const updateCategory: any = await db.update(category).set(data).where(eq(category.id, id)).returning({
        id: category.id
    });
    if (updateCategory.length === 0) {
        c.status(404);
        return c.json({ message: "Category not found" });
    }
    c.status(200);
    return c.json(updateCategory[0]);
}

export const getCategory = async (c: Context) => {
    const { id } = c.req.param();
    const db = drizzle(c.env.DB);

    const query = await db.select().from(category).where(eq(category.id, Number(id)));
    if (query.length === 0) {
        c.status(404);
        return c.json({ message: "Category not found" });
    }
    return c.json(query[0])
}

export const getAllCategory = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const result = await db.select().from(category).all();
    return c.json(result);
}

export const deleteCategory = async (c: Context) => {
    const { id } = await c.req.json();
    const db = drizzle(c.env.DB);

    const query = await db.delete(category).where(eq(category.id, id)).returning({ deletedId: category.id });
    if (query.length === 0) {
        c.status(404);
        return c.json({ message: "Category not found" });
    }
    return c.json(query)
}


export const deleteAllCategory = async (c: Context) => {
    const db = drizzle(c.env.DB);
    await db.delete(category).execute();

    c.status(200);
    return c.json({ message: "All category deleted successfully" });
}

export const getPaginateCategory = async (c: Context) => {
    const { filter, limit, offset, sortBy, sortOrder } = c.req.query();
    const db = drizzle(c.env.DB);

    // Base query
    let query: any = db.select().from(category);

    // Apply filter if present
    if (filter) {
        query = query.where(like(category.name, `%${filter}%`));
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
            que = sql`${category.name} desc nulls first`;
        } else if (sortBy === "name" && sortOrder === "asc") {
            que = sql`${category.name} asc nulls first`;
        } else if (sortBy === "id" && sortOrder === "desc") {
            que = sql`${category.id} desc nulls first`;
        } else if (sortBy === "id" && sortOrder === "asc") {
            que = sql`${category.id} asc nulls first`;
        } else {
            que = sql`${category.id} asc nulls first`;
        }
    } else {
        que = sql`${category.id} asc nulls first`;
    }

    // Apply sorting, limit, and offset
    query = query.orderBy(que)
        .limit(Number(limit))
        .offset(Number(offset));

    const results = await query.execute();

    return c.json({ totalRecords: totalRecords, data: results });
};


