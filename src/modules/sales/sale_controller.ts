import { drizzle } from "drizzle-orm/d1";
import { sales } from "../../db/schema";
import { eq, like, sql } from "drizzle-orm";
import { Context } from "hono";
import { Env } from "../../config/env";

export const createSale = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { date, status, amount, shipping, warehouseId, note, customerId, userId } = await c.req.json();

    const data = {
        date: date,
        status: status,
        amount: amount,
        shipping: shipping,
        note: note,
        warehouseId: warehouseId,
        customerId: customerId,
        userId: userId,
        createdAt: Date.now(),
        updatedAt: Date.now()
    }

    // Insert new user
    const newSale: any = await db.insert(sales).values(data).returning({
        id: sales.id
    });

    if (newSale.length === 0) {
        c.status(404);
        return c.json({ message: "Sale not found" });
    }

    c.status(201);
    return c.json(newSale[0]);
}

export const updateSale = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { id, date, status, amount, shipping, warehouseId, note, customerId, userId, createdAt } = await c.req.json();
    // const body = await c.req.parseBody();

    const data = {
        date: date,
        status: status,
        amount: amount,
        shipping: shipping,
        note: note,
        warehouseId: warehouseId,
        customerId: customerId,
        userId: userId,
        createdAt: createdAt,
        updatedAt: Date.now()
    }

    const updateSale: any = await db.update(sales).set(data).where(eq(sales.id, id)).returning({
        id: sales.id
    });

    if (updateSale.length === 0) {
        c.status(404);
        return c.json({ message: "Sale not found" });
    }

    c.status(200);
    return c.json(updateSale[0]);
}

export const getAllSales = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const result = await db.select().from(sales).all();
    return c.json(result);
}

export const deleteSale = async (c: Context) => {
    const { id } = await c.req.json();
    const db = drizzle(c.env.DB);

    const query = await db.delete(sales).where(eq(sales.id, id)).returning({ deletedId: sales.id });

    if (query.length === 0) {
        c.status(404);
        return c.json({ message: "Sale not found" });
    }
    return c.json(query[0])
}


export const deleteAllSales = async (c: Context) => {
    const db = drizzle(c.env.DB);
    await db.delete(sales).execute();

    c.status(200);
    return c.json({ message: "All sale deleted successfully" });
}

export const getPaginateSales = async (c: Context) => {
    const { filter, limit, offset, sortBy, sortOrder } = c.req.query();
    const db = drizzle(c.env.DB);

    // Base query
    let query: any = db.select().from(sales);

    // Apply filter if present
    if (filter) {
        query = query.where(like(sales.id, `%${filter}%`));
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
            que = sql`${sales.id} desc nulls first`;
        } else if (sortBy === "id" && sortOrder === "asc") {
            que = sql`${sales.id} asc nulls first`;
        } else {
            que = sql`${sales.id} asc nulls first`;
        }
    } else {
        que = sql`${sales.id} asc nulls first`;
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
    //         id: item.sales.id,
    //         name: item.sales.name

    //     })),
    // };

    return c.json({ totalRecords: totalRecords, data: results });
};


