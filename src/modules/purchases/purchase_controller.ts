import { drizzle } from "drizzle-orm/d1";
import { manageStocks, paymentType, products, purchaseItems, purchases, suppliers, units, warehouses } from "../../db/schema";
import { eq, like, sql, and } from "drizzle-orm";
import { Context } from "hono";
import { Env } from "../../config/env";

interface PurchaseData {
    purchaseDate: number;
    warehouseId: number;
    supplierId: number;
    amount: number;
    shipping: number;
    refCode: string;
    paymentTypeId: number,
    paymentStatus: number,
    note: string;
    status: number;
    purchaseItems: Array<{
        productId: number;
        quantity: number;
        productCost: number;
        subTotal: number;
    }>;
}

interface UpdatePurchaseData {
    purchaseId: number;
    purchaseDate: number;
    warehouseId: number;
    supplierId: number;
    amount: number;
    shipping: number;
    refCode: string;
    paymentTypeId: number,
    paymentStatus: number,
    note: string;
    status: number;
    purchaseItems: Array<{
        productId: number;
        quantity: number;
        productCost: number;
        subTotal: number;
    }>;
}


export const createPurchase = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { date, status, amount, shipping, warehouseId, refCode, note, supplierId, paymentTypeId, paymentStatus } = await c.req.json();

    const data = {
        date: date,
        status: status,
        amount: amount,
        shipping: shipping,
        refCode: refCode,
        note: note,
        warehouseId: warehouseId,
        paymentTypeId: paymentTypeId,
        paymentStatus: paymentStatus,
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

export const getPurchaseWithItems = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const { id } = c.req.param();

    // Run both queries concurrently
    const [items, result] = await Promise.all([
        // Query to get purchase items
        db.select({
            productId: products.id,
            quantity: purchaseItems.quantity,
            productCost: purchaseItems.productCost,
            itemSubTotal: purchaseItems.subTotal,
            productName: products.name,
            //productPrice: products.productPrice,
            unitName: units.name
        })
            .from(purchaseItems)
            .leftJoin(products, eq(purchaseItems.productId, products.id))
            .leftJoin(units, eq(products.unitId, units.id))
            .where(eq(purchaseItems.purchaseId, Number(id))),

        // Query to get purchase details with warehouse and supplier names
        db.select({
            id: purchases.id,
            date: purchases.date,
            status: purchases.status,
            amount: purchases.amount,
            shipping: purchases.shipping,
            paymentType: {
                id: purchases.paymentTypeId,
                name: paymentType.name
            },
            paymentStatus: purchases.paymentStatus,
            refCode: purchases.refCode,
            note: purchases.note,
            warehouse: {
                id: warehouses.id,
                name: warehouses.name,
                phone: warehouses.phone,
                email: warehouses.email,
                city: warehouses.city,
                address: warehouses.address
            },
            supplier: {
                id: suppliers.id,
                name: suppliers.name,
                phone: suppliers.phone,
                email: suppliers.email,
                city: suppliers.city,
                address: suppliers.address
            },
            createdAt: purchases.createdAt,
            updatedAt: purchases.updatedAt
        })
            .from(purchases)
            .leftJoin(warehouses, eq(purchases.warehouseId, warehouses.id))  // Join with warehouses table
            .leftJoin(paymentType, eq(purchases.paymentTypeId, paymentType.id))
            .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))     // Join with suppliers table
            .where(eq(purchases.id, Number(id))),
    ]);

    // Combine both queries into a single response
    const response = {
        ...result[0],   // Get the first (and only) purchase result
        purchaseItems: items  // Include the list of purchase items
    };

    // Send the response
    c.status(200);
    return c.json(response);
}


export const createPurchaseWithItems = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const purchaseData: PurchaseData = await c.req.json();
    let purchaseId: number | undefined;

    try {
        // Step 1: Insert the purchase
        const purchase = await db.insert(purchases).values({
            date: purchaseData.purchaseDate, // Assuming current date
            warehouseId: purchaseData.warehouseId,
            supplierId: purchaseData.supplierId,
            amount: purchaseData.amount,
            shipping: purchaseData.shipping,
            refCode: purchaseData.refCode,
            paymentTypeId: purchaseData.paymentTypeId,
            paymentStatus: purchaseData.paymentStatus,
            note: purchaseData.note,
            status: purchaseData.status, // 0 = Received, 1 = Pending
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }).returning();

        purchaseId = purchase[0].id; // Get the newly created purchase ID

        // Step 2: Insert each purchase item
        for (const item of purchaseData.purchaseItems) {
            await db.insert(purchaseItems).values({
                purchaseId: purchaseId,
                productId: item.productId,
                quantity: item.quantity,
                productCost: item.productCost,
                subTotal: item.subTotal,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });

            // Step 3: Update or insert into manageStocks if status is "Received"
            if (purchaseData.status === 0) { // 0 = Received
                const existingStock = await db.select().from(manageStocks)
                    .where(and(
                        eq(manageStocks.productId, item.productId),
                        eq(manageStocks.warehouseId, purchaseData.warehouseId)
                    ))
                    .execute();

                if (existingStock.length > 0) {
                    // Update the existing stock
                    await db.update(manageStocks)
                        .set({
                            quantity: existingStock[0].quantity + item.quantity,
                            updatedAt: Date.now(),
                        })
                        .where(eq(manageStocks.id, existingStock[0].id))
                        .execute();
                } else {
                    // Insert new stock if it doesn't exist
                    await db.insert(manageStocks).values({
                        productId: item.productId,
                        warehouseId: purchaseData.warehouseId,
                        quantity: item.quantity,
                        alert: 0, // Assuming 0 for now, change as needed
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    });
                }
            }
        }

        c.status(201);
        return c.json({ "purchaseId": purchaseId });

    } catch (error) {
        console.error("Error creating purchase:", error);

        //Optionally, you can rollback any inserted purchases / items manually if needed
        if (purchaseId) {
            await db.delete(purchaseItems).where(eq(purchaseItems.purchaseId, purchaseId)).execute();
            await db.delete(purchases).where(eq(purchases.id, purchaseId)).execute();
        }

        c.status(500);
        return c.json({ "status": "ERROR", "message": "Failed to create purchase." });
    }
};

export const updatePurchaseWithItems = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const purchaseData: UpdatePurchaseData = await c.req.json();

    try {
        const purchaseId = purchaseData.purchaseId;

        // Step 1: Fetch the existing purchase and its items
        const existingPurchase = await db.select().from(purchases).where(eq(purchases.id, purchaseId)).execute();
        if (existingPurchase.length === 0) {
            c.status(404);
            return c.json({ status: "ERROR", message: "Purchase not found." });
        }

        const existingPurchaseItems = await db.select().from(purchaseItems).where(eq(purchaseItems.purchaseId, purchaseId)).execute();

        // Step 2: Revert stock changes if the original status was "Received" (0)
        if (existingPurchase[0].status === 0) {
            for (const item of existingPurchaseItems) {
                const stock = await db.select().from(manageStocks)
                    .where(and(
                        eq(manageStocks.productId, item.productId!),
                        eq(manageStocks.warehouseId, existingPurchase[0].warehouseId!)
                    ))
                    .execute();

                if (stock.length > 0) {
                    // Subtract the original item quantity from the stock
                    await db.update(manageStocks)
                        .set({
                            quantity: stock[0].quantity - item.quantity,
                            updatedAt: Date.now(),
                        })
                        .where(eq(manageStocks.id, stock[0].id))
                        .execute();
                }
            }
        }

        // Step 3: Update the purchase record
        await db.update(purchases)
            .set({
                date: purchaseData.purchaseDate ?? existingPurchase[0].date,
                warehouseId: purchaseData.warehouseId ?? existingPurchase[0].warehouseId,
                supplierId: purchaseData.supplierId ?? existingPurchase[0].supplierId,
                amount: purchaseData.amount ?? existingPurchase[0].amount,
                shipping: purchaseData.shipping ?? existingPurchase[0].shipping,
                refCode: purchaseData.refCode ?? existingPurchase[0].refCode,
                paymentTypeId: purchaseData.paymentTypeId ?? existingPurchase[0].paymentTypeId,
                paymentStatus: purchaseData.paymentStatus ?? existingPurchase[0].paymentStatus,
                note: purchaseData.note ?? existingPurchase[0].note,
                status: purchaseData.status ?? existingPurchase[0].status,
                updatedAt: Date.now(),
            })
            .where(eq(purchases.id, purchaseId))
            .execute();

        // Step 4: Delete existing purchase items
        await db.delete(purchaseItems).where(eq(purchaseItems.purchaseId, purchaseId)).execute();

        // Step 5: Insert updated purchase items and adjust stock if new status is "Received" (0)
        for (const item of purchaseData.purchaseItems) {
            await db.insert(purchaseItems).values({
                purchaseId: purchaseId,
                productId: item.productId,
                quantity: item.quantity,
                productCost: item.productCost,
                subTotal: item.subTotal,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });

            if (purchaseData.status === 0) { // Adjust stock only if new status is "Received"
                const stock = await db.select().from(manageStocks)
                    .where(and(
                        eq(manageStocks.productId, item.productId),
                        eq(manageStocks.warehouseId, purchaseData.warehouseId)
                    ))
                    .execute();

                if (stock.length > 0) {
                    // Add the new item quantity to the stock
                    await db.update(manageStocks)
                        .set({
                            quantity: stock[0].quantity + item.quantity,
                            updatedAt: Date.now(),
                        })
                        .where(eq(manageStocks.id, stock[0].id))
                        .execute();
                } else {
                    // Insert a new stock record if it doesn't exist
                    await db.insert(manageStocks).values({
                        productId: item.productId,
                        warehouseId: purchaseData.warehouseId,
                        quantity: item.quantity,
                        alert: 0, // Default alert value
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    });
                }
            }
        }

        c.status(200);
        return c.json({ status: "SUCCESS", message: "Purchase updated successfully." });

    } catch (error) {
        console.error("Error updating purchase:", error);
        c.status(500);
        return c.json({ status: "ERROR", message: "Failed to update purchase." });
    }
};




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
    let query: any = db.select({
        id: purchases.id,
        date: purchases.date,
        status: purchases.status,
        amount: purchases.amount,
        shipping: purchases.shipping,
        //paymentTypeName: paymentType.name,
        paymentStatus: purchases.paymentStatus,
        refCode: purchases.refCode,
        note: purchases.note,
        warehouse: {
            id: warehouses.id,
            name: warehouses.name,
            phone: warehouses.phone,
            email: warehouses.email,
            city: warehouses.city,
            address: warehouses.address
        },
        supplier: {
            id: suppliers.id,
            name: suppliers.name,
            phone: suppliers.phone,
            email: suppliers.email,
            city: suppliers.city,
            address: suppliers.address
        },
        createdAt: purchases.createdAt,
        updatedAt: purchases.updatedAt
    }).from(purchases)
        .innerJoin(warehouses, eq(warehouses.id, purchases.warehouseId))
        .innerJoin(suppliers, eq(suppliers.id, purchases.supplierId));

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


