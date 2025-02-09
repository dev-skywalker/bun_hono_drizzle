import { drizzle } from "drizzle-orm/d1";
import { paymentType } from "../../db/schema";
import { eq, like, sql } from "drizzle-orm";
import { Context } from "hono";
import { Env } from "../../config/env";

export const createpaymentType = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { name } = await c.req.json();

    const data = {
        name: name,
        createdAt: Date.now(),
        updatedAt: Date.now()
    }

    // Insert new user
    const newpaymentType: any = await db.insert(paymentType).values(data).returning({
        id: paymentType.id
    });

    if (newpaymentType.length === 0) {
        c.status(404);
        return c.json({ message: "paymentType not found" });
    }

    c.status(201);
    return c.json(newpaymentType[0]);
}

export const updatepaymentType = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { id, name, createdAt } = await c.req.json();
    // const body = await c.req.parseBody();

    const data = {
        name: name,
        createdAt: createdAt,
        updatedAt: Date.now()
    }

    const updatepaymentType: any = await db.update(paymentType).set(data).where(eq(paymentType.id, id)).returning({
        id: paymentType.id
    });

    if (updatepaymentType.length === 0) {
        c.status(404);
        return c.json({ message: "PaymentType not found" });
    }

    c.status(200);
    return c.json(updatepaymentType[0]);
}

export const getAllpaymentType = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const result = await db.select().from(paymentType).all();
    return c.json(result);
}

export const getpaymentType = async (c: Context) => {
    const { id } = c.req.param();
    const db = drizzle(c.env.DB);

    const query = await db.select().from(paymentType).where(eq(paymentType.id, Number(id)));
    if (query.length === 0) {
        c.status(404);
        return c.json({ message: "paymentType not found" });
    }
    return c.json(query[0])
}

export const deletepaymentType = async (c: Context) => {
    const { id } = await c.req.json();
    const db = drizzle(c.env.DB);

    const query = await db.delete(paymentType).where(eq(paymentType.id, id)).returning({ deletedId: paymentType.id });

    if (query.length === 0) {
        c.status(404);
        return c.json({ message: "paymentType not found" });
    }
    return c.json(query[0])
}


export const deleteAllpaymentType = async (c: Context) => {
    const db = drizzle(c.env.DB);
    await db.delete(paymentType).execute();

    c.status(200);
    return c.json({ message: "All paymentType deleted successfully" });
}

export const getPaginatepaymentType = async (c: Context) => {
    const { filter, limit, offset, sortBy, sortOrder } = c.req.query();
    const db = drizzle(c.env.DB);

    // Base query
    let query: any = db.select().from(paymentType);

    // Apply filter if present
    if (filter) {
        query = query.where(like(paymentType.name, `%${filter}%`));
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
            que = sql`${paymentType.name} desc nulls first`;
        } else if (sortBy === "name" && sortOrder === "asc") {
            que = sql`${paymentType.name} asc nulls first`;
        } else if (sortBy === "id" && sortOrder === "desc") {
            que = sql`${paymentType.id} desc nulls first`;
        } else if (sortBy === "id" && sortOrder === "asc") {
            que = sql`${paymentType.id} asc nulls first`;
        } else {
            que = sql`${paymentType.id} asc nulls first`;
        }
    } else {
        que = sql`${paymentType.id} asc nulls first`;
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
    //         id: item.paymentType.id,
    //         name: item.paymentType.name

    //     })),
    // };

    return c.json({ totalRecords: totalRecords, data: results });
};


