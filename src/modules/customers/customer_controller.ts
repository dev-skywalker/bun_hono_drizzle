import { drizzle } from "drizzle-orm/d1";
import { customers } from "../../db/schema";
import { eq, like, sql } from "drizzle-orm";
import { Context } from "hono";
import { Env } from "../../config/env";

export const createCustomer = async (c: Context<{ Bindings: Env }>) => {
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
    const newCustomer: any = await db.insert(customers).values(data).returning({
        id: customers.id
    });

    if (newCustomer.length === 0) {
        c.status(404);
        return c.json({ message: "Customer not found" });
    }

    c.status(201);
    return c.json(newCustomer[0]);
}

export const updateCustomer = async (c: Context<{ Bindings: Env }>) => {
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

    const updateCustomer: any = await db.update(customers).set(data).where(eq(customers.id, id)).returning({
        id: customers.id
    });

    if (updateCustomer.length === 0) {
        c.status(404);
        return c.json({ message: "Customer not found" });
    }

    c.status(200);
    return c.json(updateCustomer[0]);
}

export const getCustomer = async (c: Context) => {
    const { id } = c.req.param();
    const db = drizzle(c.env.DB);

    const query = await db.select().from(customers).where(eq(customers.id, Number(id)));
    if (query.length === 0) {
        c.status(404);
        return c.json({ message: "Customer not found" });
    }
    return c.json(query[0])
}

export const getAllCustomers = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const result = await db.select().from(customers).all();
    return c.json(result);
}

export const deleteCustomer = async (c: Context) => {
    const { id } = await c.req.json();
    const db = drizzle(c.env.DB);

    const query = await db.delete(customers).where(eq(customers.id, id)).returning({ deletedId: customers.id });

    if (query.length === 0) {
        c.status(404);
        return c.json({ message: "Customer not found" });
    }
    return c.json(query[0])
}


export const deleteAllCustomers = async (c: Context) => {
    const db = drizzle(c.env.DB);
    await db.delete(customers).execute();

    c.status(200);
    return c.json({ message: "All customer deleted successfully" });
}

export const getPaginateCustomers = async (c: Context) => {
    const { filter, limit, offset, sortBy, sortOrder } = c.req.query();
    const db = drizzle(c.env.DB);

    // Base query
    let query: any = db.select().from(customers);

    // Apply filter if present
    if (filter) {
        query = query.where(like(customers.name, `%${filter}%`));
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
            que = sql`${customers.name} desc nulls first`;
        } else if (sortBy === "name" && sortOrder === "asc") {
            que = sql`${customers.name} asc nulls first`;
        } else if (sortBy === "id" && sortOrder === "desc") {
            que = sql`${customers.id} desc nulls first`;
        } else if (sortBy === "id" && sortOrder === "asc") {
            que = sql`${customers.id} asc nulls first`;
        } else {
            que = sql`${customers.id} asc nulls first`;
        }
    } else {
        que = sql`${customers.id} asc nulls first`;
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
    //         id: item.customers.id,
    //         name: item.customers.name

    //     })),
    // };

    return c.json({ totalRecords: totalRecords, data: results });
};


