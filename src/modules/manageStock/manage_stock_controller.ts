import { drizzle } from "drizzle-orm/d1";
import { manageStocks, products, warehouses } from "../../db/schema";
import { and, desc, eq, gt, like, sql } from "drizzle-orm";
import { Context } from "hono";
import { Env } from "../../config/env";

export const createManageStock = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { quantity, alert, productId, warehouseId } = await c.req.json();

    const existingStock = await db
        .select({ quantity: manageStocks.quantity })
        .from(manageStocks)
        .where(
            and(eq(manageStocks.productId, productId),
                eq(manageStocks.warehouseId, warehouseId))
        );

    // If stock exists, update it
    if (existingStock.length > 0) {
        await db
            .update(manageStocks)
            .set({ quantity: existingStock[0].quantity + quantity })
            .where(
                and(eq(manageStocks.productId, productId),
                    eq(manageStocks.warehouseId, warehouseId))
            );
    } else {
        // If stock doesn't exist, create a new stock entry
        await db.insert(manageStocks).values({
            productId: productId,
            warehouseId: warehouseId,
            quantity: quantity,
            alert: alert, // Set alert threshold for the stock, adjust as needed
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    }

    c.status(201);
    return c.json({ status: "OK" });

    // const data = {
    //     quantity: quantity,
    //     alert: alert,
    //     productId: productId,
    //     warehouseId: warehouseId,
    //     createdAt: Date.now(),
    //     updatedAt: Date.now()
    // }

    // // Insert new user
    // const newStock: any = await db.insert(manageStocks).values(data).returning({
    //     id: manageStocks.id
    // });

    // if (newStock.length === 0) {
    //     c.status(404);
    //     return c.json({ message: "Unit not found" });
    // }

    // c.status(201);
    // return c.json(newStock[0]);
}

export const updateManageStock = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { id, quantity, alert, productId, warehouseId, createdAt } = await c.req.json();
    // const body = await c.req.parseBody();

    const data = {
        quantity: quantity,
        alert: alert,
        productId: productId,
        warehouseId: warehouseId,
        createdAt: createdAt,
        updatedAt: Date.now()
    }

    const updateStock: any = await db.update(manageStocks).set(data).where(eq(manageStocks.id, id)).returning({
        id: manageStocks.id
    });

    if (updateStock.length === 0) {
        c.status(404);
        return c.json({ message: "Stock not found" });
    }

    c.status(200);
    return c.json(updateStock[0]);
}

export const getWarehouseStockLevels = async (c: Context) => {
    const db = drizzle(c.env.DB);

    const stockLevels = await db.select({
        warehouseId: warehouses.id,
        warehouseName: warehouses.name,
        productId: products.id,
        productName: products.name,
        stockQuantity: manageStocks.quantity,
    })
        .from(manageStocks)
        .innerJoin(warehouses, eq(manageStocks.warehouseId, warehouses.id))  // Join warehouses
        .innerJoin(products, eq(manageStocks.productId, products.id))        // Join products
        .where(gt(manageStocks.quantity, 0))                                 // Only include items with stock > 0
        .orderBy(desc(manageStocks.quantity));                               // Order by stock quantity in descending order

    c.status(200);
    return c.json(stockLevels);
}

export const getAllManageStocks = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const result = await db.select().from(manageStocks).all();
    return c.json(result);
}

export const deleteManageStock = async (c: Context) => {
    const { id } = await c.req.json();
    const db = drizzle(c.env.DB);

    const query = await db.delete(manageStocks).where(eq(manageStocks.id, id)).returning({ deletedId: manageStocks.id });

    if (query.length === 0) {
        c.status(404);
        return c.json({ message: "Stock not found" });
    }
    return c.json(query[0])
}


export const deleteAllManageStocks = async (c: Context) => {
    const db = drizzle(c.env.DB);
    await db.delete(manageStocks).execute();

    c.status(200);
    return c.json({ message: "All Stock deleted successfully" });
}

// export const getPaginateUnits = async (c: Context) => {
//     const { filter, limit, offset, sortBy, sortOrder } = c.req.query();
//     const db = drizzle(c.env.DB);

//     // Base query
//     let query: any = db.select().from(units);

//     // Apply filter if present
//     if (filter) {
//         query = query.where(like(units.name, `%${filter}%`));
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
//             que = sql`${units.name} desc nulls first`;
//         } else if (sortBy === "name" && sortOrder === "asc") {
//             que = sql`${units.name} asc nulls first`;
//         } else if (sortBy === "id" && sortOrder === "desc") {
//             que = sql`${units.id} desc nulls first`;
//         } else if (sortBy === "id" && sortOrder === "asc") {
//             que = sql`${units.id} asc nulls first`;
//         } else {
//             que = sql`${units.id} asc nulls first`;
//         }
//     } else {
//         que = sql`${units.id} asc nulls first`;
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
//     //         id: item.units.id,
//     //         name: item.units.name

//     //     })),
//     // };

//     return c.json({ totalRecords: totalRecords, data: results });
// };


