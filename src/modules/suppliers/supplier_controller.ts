import { drizzle } from "drizzle-orm/d1";
import { suppliers } from "../../db/schema";
import { eq, like, sql } from "drizzle-orm";
import { Context } from "hono";
import { Env } from "../../config/env";

export const createSupplier = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { name, phone, email, city, address } = await c.req.json();

    const data = {
        name: name,
        phone: phone,
        email: email,
        city: city,
        address: address,
        createdAt: Date.now(),
        updatedAt: Date.now()
    }

    // Insert new user
    const newSupplier: any = await db.insert(suppliers).values(data).returning({
        id: suppliers.id
    });

    if (newSupplier.length === 0) {
        c.status(404);
        return c.json({ message: "Supplier not found" });
    }

    c.status(201);
    return c.json(newSupplier[0]);
}

export const updateSupplier = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { id, name, phone, email, city, address, createdAt } = await c.req.json();
    // const body = await c.req.parseBody();

    const data = {
        name: name,
        phone: phone,
        email: email,
        city: city,
        address: address,
        createdAt: createdAt,
        updatedAt: Date.now()
    }

    const updateSupplier: any = await db.update(suppliers).set(data).where(eq(suppliers.id, id)).returning({
        id: suppliers.id
    });

    if (updateSupplier.length === 0) {
        c.status(404);
        return c.json({ message: "Supplier not found" });
    }

    c.status(200);
    return c.json(updateSupplier[0]);
}

export const getSupplier = async (c: Context) => {
    const { id } = c.req.param();
    const db = drizzle(c.env.DB);

    const query = await db.select().from(suppliers).where(eq(suppliers.id, Number(id)));
    if (query.length === 0) {
        c.status(404);
        return c.json({ message: "Supplier not found" });
    }
    return c.json(query[0])
}

export const getAllSuppliers = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const result = await db.select().from(suppliers).all();
    return c.json(result);
}

export const deleteSupplier = async (c: Context) => {
    const { id } = await c.req.json();
    const db = drizzle(c.env.DB);

    const query = await db.delete(suppliers).where(eq(suppliers.id, id)).returning({ deletedId: suppliers.id });

    if (query.length === 0) {
        c.status(404);
        return c.json({ message: "Supplier not found" });
    }
    return c.json(query[0])
}


export const deleteAllSuppliers = async (c: Context) => {
    const db = drizzle(c.env.DB);
    await db.delete(suppliers).execute();

    c.status(200);
    return c.json({ message: "All supplier deleted successfully" });
}

export const getPaginateSuppliers = async (c: Context) => {
    const { filter, limit, offset, sortBy, sortOrder } = c.req.query();
    const db = drizzle(c.env.DB);

    // Base query
    let query: any = db.select().from(suppliers);

    // Apply filter if present
    if (filter) {
        query = query.where(like(suppliers.name, `%${filter}%`));
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
            que = sql`${suppliers.name} desc nulls first`;
        } else if (sortBy === "name" && sortOrder === "asc") {
            que = sql`${suppliers.name} asc nulls first`;
        } else if (sortBy === "id" && sortOrder === "desc") {
            que = sql`${suppliers.id} desc nulls first`;
        } else if (sortBy === "id" && sortOrder === "asc") {
            que = sql`${suppliers.id} asc nulls first`;
        } else {
            que = sql`${suppliers.id} asc nulls first`;
        }
    } else {
        que = sql`${suppliers.id} asc nulls first`;
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
    //         id: item.suppliers.id,
    //         name: item.suppliers.name

    //     })),
    // };

    return c.json({ totalRecords: totalRecords, data: results });
};


