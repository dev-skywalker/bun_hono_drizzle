import { drizzle } from "drizzle-orm/d1";
import { saleItems } from "../../db/schema";
import { eq, like, sql } from "drizzle-orm";
import { Context } from "hono";
import { Env } from "../../config/env";

export const createSaleItem = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { quantity, subTotal, productId, saleId, productPrice } = await c.req.json();

    const data = {
        quantity: quantity,
        productPrice: productPrice,
        subTotal: subTotal,
        productId: productId,
        saleId: saleId,
        createdAt: Date.now(),
        updatedAt: Date.now()
    }

    // Insert new user
    const newSaleItem: any = await db.insert(saleItems).values(data).returning({
        id: saleItems.id
    });

    if (newSaleItem.length === 0) {
        c.status(404);
        return c.json({ message: "SaleItem not found" });
    }

    c.status(201);
    return c.json(newSaleItem[0]);
}

export const updateSaleItem = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { id, quantity, subTotal, productId, saleId, createdAt, productPrice } = await c.req.json();
    // const body = await c.req.parseBody();

    const data = {
        quantity: quantity,
        subTotal: subTotal,
        productPrice: productPrice,
        productId: productId,
        saleId: saleId,
        createdAt: createdAt,
        updatedAt: Date.now()
    }

    const updateSaleItem: any = await db.update(saleItems).set(data).where(eq(saleItems.id, id)).returning({
        id: saleItems.id
    });

    if (updateSaleItem.length === 0) {
        c.status(404);
        return c.json({ message: "SaleItem not found" });
    }

    c.status(200);
    return c.json(updateSaleItem[0]);
}

export const getAllSaleItems = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const result = await db.select().from(saleItems).all();
    return c.json(result);
}

export const deleteSaleItem = async (c: Context) => {
    const { id } = await c.req.json();
    const db = drizzle(c.env.DB);

    const query = await db.delete(saleItems).where(eq(saleItems.id, id)).returning({ deletedId: saleItems.id });

    if (query.length === 0) {
        c.status(404);
        return c.json({ message: "SaleItem not found" });
    }
    return c.json(query[0])
}


export const deleteAllSaleItems = async (c: Context) => {
    const db = drizzle(c.env.DB);
    await db.delete(saleItems).execute();

    c.status(200);
    return c.json({ message: "All saleitem deleted successfully" });
}

// export const getPaginateSaleItems = async (c: Context) => {
//     const { filter, limit, offset, sortBy, sortOrder } = c.req.query();
//     const db = drizzle(c.env.DB);

//     // Base query
//     let query: any = db.select().from(saleItems);

//     // Apply filter if present
//     if (filter) {
//         query = query.where(like(saleItems.name, `%${filter}%`));
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
//             que = sql`${saleitems.name} desc nulls first`;
//         } else if (sortBy === "name" && sortOrder === "asc") {
//             que = sql`${saleitems.name} asc nulls first`;
//         } else if (sortBy === "id" && sortOrder === "desc") {
//             que = sql`${saleitems.id} desc nulls first`;
//         } else if (sortBy === "id" && sortOrder === "asc") {
//             que = sql`${saleitems.id} asc nulls first`;
//         } else {
//             que = sql`${saleitems.id} asc nulls first`;
//         }
//     } else {
//         que = sql`${saleitems.id} asc nulls first`;
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
//     //         id: item.saleitems.id,
//     //         name: item.saleitems.name

//     //     })),
//     // };

//     return c.json({ totalRecords: totalRecords, data: results });
// };


