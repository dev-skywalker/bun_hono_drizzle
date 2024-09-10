import { drizzle } from "drizzle-orm/d1";
import { warehouses } from "../../db/schema";
import { eq, like, sql } from "drizzle-orm";
import { Context } from "hono";
import { Env } from "../../config/env";

export const createWarehouse = async (c: Context<{ Bindings: Env }>) => {
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
    const newWarehouse: any = await db.insert(warehouses).values(data).returning({
        id: warehouses.id
    });

    if (newWarehouse.length === 0) {
        c.status(404);
        return c.json({ message: "Warehouse not found" });
    }

    c.status(201);
    return c.json(newWarehouse[0]);
}

export const updateWarehouse = async (c: Context<{ Bindings: Env }>) => {
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

    const updateWarehouse: any = await db.update(warehouses).set(data).where(eq(warehouses.id, id)).returning({
        id: warehouses.id
    });

    if (updateWarehouse.length === 0) {
        c.status(404);
        return c.json({ message: "Warehouse not found" });
    }

    c.status(200);
    return c.json(updateWarehouse[0]);
}

export const getAllWarehouses = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const result = await db.select().from(warehouses).all();
    return c.json(result);
}

export const deleteWarehouse = async (c: Context) => {
    const { id } = await c.req.json();
    const db = drizzle(c.env.DB);

    const query = await db.delete(warehouses).where(eq(warehouses.id, id)).returning({ deletedId: warehouses.id });

    if (query.length === 0) {
        c.status(404);
        return c.json({ message: "Warehouse not found" });
    }
    return c.json(query[0])
}


export const deleteAllWarehouses = async (c: Context) => {
    const db = drizzle(c.env.DB);
    await db.delete(warehouses).execute();

    c.status(200);
    return c.json({ message: "All warehouse deleted successfully" });
}

export const getPaginateWarehouses = async (c: Context) => {
    const { filter, limit, offset, sortBy, sortOrder } = c.req.query();
    const db = drizzle(c.env.DB);

    // Base query
    let query: any = db.select().from(warehouses);

    // Apply filter if present
    if (filter) {
        query = query.where(like(warehouses.name, `%${filter}%`));
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
            que = sql`${warehouses.name} desc nulls first`;
        } else if (sortBy === "name" && sortOrder === "asc") {
            que = sql`${warehouses.name} asc nulls first`;
        } else if (sortBy === "id" && sortOrder === "desc") {
            que = sql`${warehouses.id} desc nulls first`;
        } else if (sortBy === "id" && sortOrder === "asc") {
            que = sql`${warehouses.id} asc nulls first`;
        } else {
            que = sql`${warehouses.id} asc nulls first`;
        }
    } else {
        que = sql`${warehouses.id} asc nulls first`;
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
    //         id: item.warehouses.id,
    //         name: item.warehouses.name

    //     })),
    // };

    return c.json({ totalRecords: totalRecords, data: results });
};


