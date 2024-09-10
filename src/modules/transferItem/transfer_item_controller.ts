import { drizzle } from "drizzle-orm/d1";
import { transferItems } from "../../db/schema";
import { eq, like, sql } from "drizzle-orm";
import { Context } from "hono";
import { Env } from "../../config/env";

export const createTransferItem = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { quantity, subTotal, productId, transferId, productPrice } = await c.req.json();

    const data = {
        quantity: quantity,
        subTotal: subTotal,
        productPrice: productPrice,
        productId: productId,
        transferId: transferId,
        createdAt: Date.now(),
        updatedAt: Date.now()
    }

    // Insert new user
    const newTransferItem: any = await db.insert(transferItems).values(data).returning({
        id: transferItems.id
    });

    if (newTransferItem.length === 0) {
        c.status(404);
        return c.json({ message: "TransferItem not found" });
    }

    c.status(201);
    return c.json(newTransferItem[0]);
}

export const updateTransferItem = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { id, quantity, subTotal, productId, transferId, productPrice, createdAt } = await c.req.json();
    // const body = await c.req.parseBody();

    const data = {
        quantity: quantity,
        subTotal: subTotal,
        productPrice: productPrice,
        productId: productId,
        transferId: transferId,
        createdAt: createdAt,
        updatedAt: Date.now()
    }

    const updateTransferItem: any = await db.update(transferItems).set(data).where(eq(transferItems.id, id)).returning({
        id: transferItems.id
    });

    if (updateTransferItem.length === 0) {
        c.status(404);
        return c.json({ message: "TransferItem not found" });
    }

    c.status(200);
    return c.json(updateTransferItem[0]);
}

export const getAllTransferItems = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const result = await db.select().from(transferItems).all();
    return c.json(result);
}

export const deleteTransferItem = async (c: Context) => {
    const { id } = await c.req.json();
    const db = drizzle(c.env.DB);

    const query = await db.delete(transferItems).where(eq(transferItems.id, id)).returning({ deletedId: transferItems.id });

    if (query.length === 0) {
        c.status(404);
        return c.json({ message: "TransferItem not found" });
    }
    return c.json(query[0])
}


export const deleteAllTransferItems = async (c: Context) => {
    const db = drizzle(c.env.DB);
    await db.delete(transferItems).execute();

    c.status(200);
    return c.json({ message: "All transferitem deleted successfully" });
}

// export const getPaginateTransferItems = async (c: Context) => {
//     const { filter, limit, offset, sortBy, sortOrder } = c.req.query();
//     const db = drizzle(c.env.DB);

//     // Base query
//     let query: any = db.select().from(transferItems);

//     // Apply filter if present
//     if (filter) {
//         query = query.where(like(transferItems.name, `%${filter}%`));
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
//             que = sql`${transferitems.name} desc nulls first`;
//         } else if (sortBy === "name" && sortOrder === "asc") {
//             que = sql`${transferitems.name} asc nulls first`;
//         } else if (sortBy === "id" && sortOrder === "desc") {
//             que = sql`${transferitems.id} desc nulls first`;
//         } else if (sortBy === "id" && sortOrder === "asc") {
//             que = sql`${transferitems.id} asc nulls first`;
//         } else {
//             que = sql`${transferitems.id} asc nulls first`;
//         }
//     } else {
//         que = sql`${transferitems.id} asc nulls first`;
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
//     //         id: item.transferitems.id,
//     //         name: item.transferitems.name

//     //     })),
//     // };

//     return c.json({ totalRecords: totalRecords, data: results });
// };


