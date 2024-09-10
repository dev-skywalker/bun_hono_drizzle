import { drizzle } from "drizzle-orm/d1";
import { purchases } from "../../db/schema";
import { eq, like, sql } from "drizzle-orm";
import { Context } from "hono";
import { Env } from "../../config/env";

export const createPurchase = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { date, status, amount, shipping, warehouseId, refCode, note, supplierId } = await c.req.json();

    const data = {
        date: date,
        status: status,
        amount: amount,
        shipping: shipping,
        refCode: refCode,
        note: note,
        warehouseId: warehouseId,
        supplierId: supplierId,
        createdAt: Date.now(),
        updatedAt: Date.now()
    }

    // Insert new user
    const newPurchase: any = await db.insert(purchases).values(data).returning({
        id: purchases.id
    });

    if (newPurchase.length === 0) {
        c.status(404);
        return c.json({ message: "Purchase not found" });
    }

    c.status(201);
    return c.json(newPurchase[0]);
}

export const updatePurchase = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { id, date, status, amount, shipping, warehouseId, refCode, note, supplierId, createdAt } = await c.req.json();
    // const body = await c.req.parseBody();

    const data = {
        date: date,
        status: status,
        amount: amount,
        shipping: shipping,
        refCode: refCode,
        note: note,
        warehouseId: warehouseId,
        supplierId: supplierId,
        createdAt: createdAt,
        updatedAt: Date.now()
    }

    const updatePurchase: any = await db.update(purchases).set(data).where(eq(purchases.id, id)).returning({
        id: purchases.id
    });

    if (updatePurchase.length === 0) {
        c.status(404);
        return c.json({ message: "Purchase not found" });
    }

    c.status(200);
    return c.json(updatePurchase[0]);
}

export const getAllPurchases = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const result = await db.select().from(purchases).all();
    return c.json(result);
}

export const deletePurchase = async (c: Context) => {
    const { id } = await c.req.json();
    const db = drizzle(c.env.DB);

    const query = await db.delete(purchases).where(eq(purchases.id, id)).returning({ deletedId: purchases.id });

    if (query.length === 0) {
        c.status(404);
        return c.json({ message: "Purchase not found" });
    }
    return c.json(query[0])
}


export const deleteAllPurchases = async (c: Context) => {
    const db = drizzle(c.env.DB);
    await db.delete(purchases).execute();

    c.status(200);
    return c.json({ message: "All purchase deleted successfully" });
}

export const getPaginatePurchases = async (c: Context) => {
    const { filter, limit, offset, sortBy, sortOrder } = c.req.query();
    const db = drizzle(c.env.DB);

    // Base query
    let query: any = db.select().from(purchases);

    // Apply filter if present
    if (filter) {
        query = query.where(like(purchases.refCode, `%${filter}%`));
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
            que = sql`${purchases.id} desc nulls first`;
        } else if (sortBy === "id" && sortOrder === "asc") {
            que = sql`${purchases.id} asc nulls first`;
        } else {
            que = sql`${purchases.id} asc nulls first`;
        }
    } else {
        que = sql`${purchases.id} asc nulls first`;
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
    //         id: item.purchases.id,
    //         name: item.purchases.name

    //     })),
    // };

    return c.json({ totalRecords: totalRecords, data: results });
};


