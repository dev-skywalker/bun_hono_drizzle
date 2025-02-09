import { drizzle } from "drizzle-orm/d1";
import { lostDamagedItems, manageStocks, products, transferItems, transfers, units, warehouses } from "../../db/schema";
import { eq, like, sql, and } from "drizzle-orm";
import { Context } from "hono";
import { Env } from "../../config/env";
import { alias } from "drizzle-orm/sqlite-core";


interface TransferData {
    transferDate: number;
    fromWarehouseId: number,
    toWarehouseId: number,
    amount: number;
    shipping: number;
    note: string;
    status: number;
    transferItems: Array<{
        productId: number;
        quantity: number;
        productPrice: number;
        productCost: number;
        subTotal: number;
    }>;
}


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

export const getTransferWithItems = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const { id } = c.req.param();
    const fromWarehouse = alias(warehouses, "fromWarehouse");
    const toWarehouse = alias(warehouses, "toWarehouse");

    // Run both queries concurrently
    const [items, result] = await Promise.all([
        // Query to get transfer items
        db.select({
            productId: products.id,
            quantity: transferItems.quantity,
            productName: products.name,
            subTotal: transferItems.subTotal,
            productPrice: products.productPrice,
            productCost: products.productCost,
            unitName: units.name,
        })
            .from(transferItems)
            .leftJoin(products, eq(transferItems.productId, products.id))
            .leftJoin(units, eq(products.unitId, units.id))
            .where(eq(transferItems.transferId, Number(id))),

        // Query to get transfer details with source and destination warehouse details
        db.select({
            transferId: transfers.id,
            transferDate: transfers.date,
            transferStatus: transfers.status,
            transferAmount: transfers.amount,
            transferShipping: transfers.shipping,
            note: transfers.note,
            fromWarehouse: {
                id: fromWarehouse.id,
                name: fromWarehouse.name,
                phone: fromWarehouse.phone,
                email: fromWarehouse.email,
                city: fromWarehouse.city,
                address: fromWarehouse.address
            },
            toWarehouse: {
                id: toWarehouse.id,
                name: toWarehouse.name,
                phone: toWarehouse.phone,
                email: toWarehouse.email,
                city: toWarehouse.city,
                address: toWarehouse.address
            },
            createdAt: transfers.createdAt,
            updatedAt: transfers.updatedAt
        }).from(transfers).where(eq(transfers.id, Number(id)))
            .innerJoin(fromWarehouse, eq(fromWarehouse.id, transfers.fromWarehouseId))
            .innerJoin(toWarehouse, eq(toWarehouse.id, transfers.toWarehouseId)),
    ]);

    // let from: any = await db.select().from(warehouses).where(eq(warehouses.id, Number(result[0].fromWarehouseId)))
    // let to: any = await db.select().from(warehouses).where(eq(warehouses.id, Number(result[0].toWarehouseId)))
    // Combine both queries into a single response
    const response = {
        ...result[0],   // Get the first (and only) transfer result
        transferItems: items  // Include the list of transfer items
    };

    // Send the response
    c.status(200);
    return c.json(response);
}


export const createTransferWithItems = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const transferData: TransferData = await c.req.json();
    let transferId: number | undefined;

    try {
        // Step 1: Insert the sale
        const transfer = await db.insert(transfers).values({
            date: transferData.transferDate,
            fromWarehouseId: transferData.fromWarehouseId,
            toWarehouseId: transferData.toWarehouseId,
            amount: transferData.amount,
            shipping: transferData.shipping,
            note: transferData.note,
            status: transferData.status, // Assuming status 1 is "pending" or similar
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }).returning();

        transferId = transfer[0].id; // Get the newly created sale ID

        // Step 2: Insert each sale item
        for (const item of transferData.transferItems) {
            await db.insert(transferItems).values({
                transferId: transferId,
                productId: item.productId,
                quantity: item.quantity,
                productPrice: item.productPrice,
                subTotal: item.subTotal,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });

            // Step 3: Update stock in the source warehouse (reduce quantity)
            const sourceStock = await db.select().from(manageStocks)
                .where(and(
                    eq(manageStocks.productId, item.productId),
                    eq(manageStocks.warehouseId, transferData.fromWarehouseId)
                ))
                .execute();

            if (sourceStock.length > 0) {
                const newSourceQuantity = sourceStock[0].quantity - item.quantity;
                if (newSourceQuantity < 0) throw new Error(`Insufficient stock for product ID ${item.productId} in source warehouse`);

                await db.update(manageStocks)
                    .set({ quantity: newSourceQuantity, updatedAt: Date.now() })
                    .where(eq(manageStocks.id, sourceStock[0].id))
                    .execute();
            } else {
                throw new Error(`No stock for product ID ${item.productId} in source warehouse`);
            }

            // Step 4: Update or insert stock in the destination warehouse (increase quantity)
            const destinationStock = await db.select().from(manageStocks)
                .where(and(
                    eq(manageStocks.productId, item.productId),
                    eq(manageStocks.warehouseId, transferData.toWarehouseId)
                ))
                .execute();

            if (destinationStock.length > 0) {
                const newDestinationQuantity = destinationStock[0].quantity + item.quantity;
                await db.update(manageStocks)
                    .set({ quantity: newDestinationQuantity, updatedAt: Date.now() })
                    .where(eq(manageStocks.id, destinationStock[0].id))
                    .execute();
            } else {
                await db.insert(manageStocks).values({
                    productId: item.productId,
                    warehouseId: transferData.toWarehouseId,
                    quantity: item.quantity,
                    alert: 0,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
            }
        }

        c.status(201);
        return c.json({ "transferId": transferId });

    } catch (error) {
        console.error("Error creating Transfer:", error);

        // Rollback inserted sale/items if necessary
        // if (saleId) {
        //     await db.delete(saleItems).where(eq(saleItems.saleId, saleId)).execute();
        //     await db.delete(sales).where(eq(sales.id, saleId)).execute();
        // }

        c.status(500);
        return c.json({ "status": "ERROR", "message": "Failed to create sale." });
    }
}

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
    const fromWarehouse = alias(warehouses, "fromWarehouse");
    const toWarehouse = alias(warehouses, "toWarehouse");
    // Base query
    let query: any = db.select({
        id: transfers.id,
        date: transfers.date,
        status: transfers.status,
        note: transfers.note,
        fromWarehouseName: fromWarehouse.name,
        toWarehouseName: toWarehouse.name,
        amount: transfers.amount,
        shipping: transfers.shipping,
        createdAt: transfers.createdAt,
        updatedAt: transfers.updatedAt
    }).from(transfers)
        .innerJoin(fromWarehouse, eq(fromWarehouse.id, transfers.fromWarehouseId))
        .innerJoin(toWarehouse, eq(toWarehouse.id, transfers.toWarehouseId));

    // Apply filter if present
    if (filter) {
        query = query.where(like(transfers.id, `%${filter}%`));
    }

    // let from: any = db.select().from(warehouses).where(eq(warehouses.id, Number(result[0].fromWarehouseId)))
    // let to: any = db.select().from(warehouses).where(eq(warehouses.id, Number(result[0].toWarehouseId)))

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


