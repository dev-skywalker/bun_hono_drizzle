import { drizzle } from "drizzle-orm/d1";
import { transfers } from "../../db/schema";
import { eq, like, sql } from "drizzle-orm";
import { Context } from "hono";
import { Env } from "../../config/env";

export const createTransfer = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { date, status, amount, shipping, fromWarehouseId, toWarehouseId, note } = await c.req.json();

    const data = {
        date: date,
        status: status,
        amount: amount,
        shipping: shipping,
        note: note,
        fromWarehouseId: fromWarehouseId,
        toWarehouseId: toWarehouseId,
        createdAt: Date.now(),
        updatedAt: Date.now()
    }

    // Insert new user
    const newTransfer: any = await db.insert(transfers).values(data).returning({
        id: transfers.id
    });

    if (newTransfer.length === 0) {
        c.status(404);
        return c.json({ message: "Transfer not found" });
    }

    c.status(201);
    return c.json(newTransfer[0]);
}

export const updateTransfer = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { id, date, status, amount, shipping, fromWarehouseId, toWarehouseId, note, createdAt } = await c.req.json();
    // const body = await c.req.parseBody();

    const data = {
        date: date,
        status: status,
        amount: amount,
        shipping: shipping,
        note: note,
        fromWarehouseId: fromWarehouseId,
        toWarehouseId: toWarehouseId,
        createdAt: createdAt,
        updatedAt: Date.now()
    }

    const updateTransfer: any = await db.update(transfers).set(data).where(eq(transfers.id, id)).returning({
        id: transfers.id
    });

    if (updateTransfer.length === 0) {
        c.status(404);
        return c.json({ message: "Transfer not found" });
    }

    c.status(200);
    return c.json(updateTransfer[0]);
}

export const getAllTransfers = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const result = await db.select().from(transfers).all();
    return c.json(result);
}

export const deleteTransfer = async (c: Context) => {
    const { id } = await c.req.json();
    const db = drizzle(c.env.DB);

    const query = await db.delete(transfers).where(eq(transfers.id, id)).returning({ deletedId: transfers.id });

    if (query.length === 0) {
        c.status(404);
        return c.json({ message: "Transfer not found" });
    }
    return c.json(query[0])
}


export const deleteAllTransfers = async (c: Context) => {
    const db = drizzle(c.env.DB);
    await db.delete(transfers).execute();

    c.status(200);
    return c.json({ message: "All transfer deleted successfully" });
}

export const getPaginateTransfers = async (c: Context) => {
    const { filter, limit, offset, sortBy, sortOrder } = c.req.query();
    const db = drizzle(c.env.DB);

    // Base query
    let query: any = db.select().from(transfers);

    // Apply filter if present
    if (filter) {
        query = query.where(like(transfers.id, `%${filter}%`));
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
        if (sortBy === "id" && sortOrder === "desc") {
            que = sql`${transfers.id} desc nulls first`;
        } else if (sortBy === "id" && sortOrder === "asc") {
            que = sql`${transfers.id} asc nulls first`;
        } else {
            que = sql`${transfers.id} asc nulls first`;
        }
    } else {
        que = sql`${transfers.id} asc nulls first`;
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
    //         id: item.transfers.id,
    //         name: item.transfers.name

    //     })),
    // };

    return c.json({ totalRecords: totalRecords, data: results });
};


