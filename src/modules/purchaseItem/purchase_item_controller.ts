import { drizzle } from "drizzle-orm/d1";
import { purchaseItems } from "../../db/schema";
import { eq, like, sql } from "drizzle-orm";
import { Context } from "hono";
import { Env } from "../../config/env";

export const createPurchaseItem = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { quantity, subTotal, productId, purchaseId, productCost } = await c.req.json();

    const data = {
        quantity: quantity,
        subTotal: subTotal,
        productCost: productCost,
        productId: productId,
        purchaseId: purchaseId,
        createdAt: Date.now(),
        updatedAt: Date.now()
    }

    // Insert new user
    const newPurchaseItem: any = await db.insert(purchaseItems).values(data).returning({
        id: purchaseItems.id
    });

    if (newPurchaseItem.length === 0) {
        c.status(404);
        return c.json({ message: "PurchaseItem not found" });
    }

    c.status(201);
    return c.json(newPurchaseItem[0]);
}

export const updatePurchaseItem = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { id, quantity, subTotal, productId, purchaseId, productCost, createdAt } = await c.req.json();
    // const body = await c.req.parseBody();

    const data = {
        quantity: quantity,
        subTotal: subTotal,
        productCost: productCost,
        productId: productId,
        purchaseId: purchaseId,
        createdAt: createdAt,
        updatedAt: Date.now()
    }

    const updatePurchaseItem: any = await db.update(purchaseItems).set(data).where(eq(purchaseItems.id, id)).returning({
        id: purchaseItems.id
    });

    if (updatePurchaseItem.length === 0) {
        c.status(404);
        return c.json({ message: "PurchaseItem not found" });
    }

    c.status(200);
    return c.json(updatePurchaseItem[0]);
}

export const getAllPurchaseItems = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const result = await db.select().from(purchaseItems).all();
    return c.json(result);
}

export const deletePurchaseItem = async (c: Context) => {
    const { id } = await c.req.json();
    const db = drizzle(c.env.DB);

    const query = await db.delete(purchaseItems).where(eq(purchaseItems.id, id)).returning({ deletedId: purchaseItems.id });

    if (query.length === 0) {
        c.status(404);
        return c.json({ message: "PurchaseItem not found" });
    }
    return c.json(query[0])
}


export const deleteAllPurchaseItems = async (c: Context) => {
    const db = drizzle(c.env.DB);
    await db.delete(purchaseItems).execute();

    c.status(200);
    return c.json({ message: "All purchaseitem deleted successfully" });
}

// export const getPaginatePurchaseItems = async (c: Context) => {
//     const { filter, limit, offset, sortBy, sortOrder } = c.req.query();
//     const db = drizzle(c.env.DB);

//     // Base query
//     let query: any = db.select().from(purchaseItems);

//     // Apply filter if present
//     if (filter) {
//         query = query.where(like(purchaseItems.name, `%${filter}%`));
//     }

//     // Get the total number of filtered records
//     const subQuery = query.as("sub");
//     const totalRecordsQuery = db
//         .select({ total: sql<number>`count(*)` })
//         .from(subQuery);
//     const totalRecordsResult = await totalRecordsQuery.execute();
//     const totalRecords = Number(totalRecordsResult[0].total);

//     // Sorting
//     let que;
//     if (sortBy && sortOrder) {
//         if (sortBy === "name" && sortOrder === "desc") {
//             que = sql`${purchaseitems.name} desc nulls first`;
//         } else if (sortBy === "name" && sortOrder === "asc") {
//             que = sql`${purchaseitems.name} asc nulls first`;
//         } else if (sortBy === "id" && sortOrder === "desc") {
//             que = sql`${purchaseitems.id} desc nulls first`;
//         } else if (sortBy === "id" && sortOrder === "asc") {
//             que = sql`${purchaseitems.id} asc nulls first`;
//         } else {
//             que = sql`${purchaseitems.id} asc nulls first`;
//         }
//     } else {
//         que = sql`${purchaseitems.id} asc nulls first`;
//     }

//     // Apply sorting, limit, and offset
//     query = query.orderBy(que)
//         .limit(Number(limit))
//         .offset(Number(offset));

//     const results = await query.execute();

//     // Transform data
//     // const transformedData: any = {
//     //     totalRecords: totalRecords,
//     //     data: results.map((item: any) => ({
//     //         id: item.purchaseitems.id,
//     //         name: item.purchaseitems.name

//     //     })),
//     // };

//     return c.json({ totalRecords: totalRecords, data: results });
// };


