import { drizzle } from "drizzle-orm/d1";
import { lostDamagedItems, manageStocks, products, units, warehouses } from "../../db/schema";
import { eq, like, sql, and } from "drizzle-orm";
import { Context } from "hono";

export const createLostDamagedItem = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const { warehouseId, productId, quantity, reason, note, amount } = await c.req.json();

    try {
        // Step 1: Insert lost/damaged item record
        const lostDamagedRecord = await db.insert(lostDamagedItems).values({
            warehouseId,
            productId,
            quantity,
            reason,
            note,
            amount,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }).returning();

        // Step 2: Reduce stock in manageStocks
        const existingStock = await db.select().from(manageStocks)
            .where(and(
                eq(manageStocks.productId, productId),
                eq(manageStocks.warehouseId, warehouseId)
            ))
            .execute();

        if (existingStock.length > 0) {
            const newQuantity = existingStock[0].quantity - quantity;
            if (newQuantity < 0) throw new Error(`Insufficient stock for product ID ${productId} in warehouse ${warehouseId}`);

            await db.update(manageStocks)
                .set({ quantity: newQuantity, updatedAt: Date.now() })
                .where(eq(manageStocks.id, existingStock[0].id))
                .execute();
        } else {
            throw new Error(`No stock for product ID ${productId} in warehouse ${warehouseId}`);
        }

        c.status(201);
        return c.json({ "lostDamagedRecordId": lostDamagedRecord[0].id });

    } catch (error) {
        console.error("Error creating lost/damaged item record:", error);
        c.status(500);
        return c.json({ "status": "ERROR", "message": "Failed to create lost/damaged item record." });
    }
}

export const getLostDamagedItem = async (c: Context) => {
    const { filter, limit, offset, sortBy, sortOrder } = c.req.query();
    const db = drizzle(c.env.DB);

    // Base query
    let query: any = db.select({
        id: lostDamagedItems.id,
        productName: products.name,
        quantity: lostDamagedItems.quantity,
        amount: lostDamagedItems.amount,
        reason: lostDamagedItems.reason,
        warehouseName: warehouses.name,
        createdAt: lostDamagedItems.createdAt,
        updatedAt: lostDamagedItems.updatedAt

    }).from(lostDamagedItems)
        .innerJoin(warehouses, eq(warehouses.id, lostDamagedItems.warehouseId))
        .innerJoin(products, eq(products.id, lostDamagedItems.productId));

    // Apply filter if present
    if (filter) {
        query = query.where(like(products.name, `%${filter}%`));
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
            que = sql`${products.name} desc nulls first`;
        } else if (sortBy === "name" && sortOrder === "asc") {
            que = sql`${products.name} asc nulls first`;
        } else if (sortBy === "qty" && sortOrder === "desc") {
            que = sql`${lostDamagedItems.quantity} desc nulls first`;
        } else if (sortBy === "qty" && sortOrder === "asc") {
            que = sql`${lostDamagedItems.quantity} asc nulls first`;
        } else if (sortBy === "id" && sortOrder === "desc") {
            que = sql`${lostDamagedItems.id} desc nulls first`;
        } else if (sortBy === "id" && sortOrder === "asc") {
            que = sql`${lostDamagedItems.id} asc nulls first`;
        } else {
            que = sql`${lostDamagedItems.id} asc nulls first`;
        }
    } else {
        que = sql`${lostDamagedItems.id} asc nulls first`;
    }

    // Apply sorting, limit, and offset
    query = query.orderBy(que)
        .limit(Number(limit))
        .offset(Number(offset));

    const results = await query.execute();

    return c.json({ totalRecords: totalRecords, data: results });
};