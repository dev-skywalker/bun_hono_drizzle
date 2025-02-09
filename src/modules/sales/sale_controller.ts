import { drizzle } from "drizzle-orm/d1";
import { customers, manageStocks, paymentType, products, saleItems, sales, units, users, warehouses } from "../../db/schema";
import { and, eq, like, sql } from "drizzle-orm";
import { Context } from "hono";
import { Env } from "../../config/env";

interface SaleData {
    saleDate: number;
    warehouseId: number;
    paymentTypeId: number;
    paymentStatus: number;
    userId: number;
    customerId: number;
    amount: number;
    shipping: number;
    discount: number;
    taxPercent: number;
    taxAmount: number;
    totalAmount: number;
    note: string;
    status: number;
    saleItems: Array<{
        productId: number;
        quantity: number;
        profit: number;
        productPrice: number;
        productCost: number;
        subTotal: number;
    }>;
}

interface UpdateSaleData {
    saleId: number;
    saleDate: number;
    warehouseId: number;
    paymentTypeId: number;
    paymentStatus: number;
    userId: number;
    customerId: number;
    amount: number;
    shipping: number;
    discount: number;
    taxPercent: number;
    taxAmount: number;
    totalAmount: number;
    note: string;
    status: number;
    saleItems: Array<{
        productId: number;
        quantity: number;
        profit: number;
        productPrice: number;
        productCost: number;
        subTotal: number;
    }>;
}

export const getSaleDetails = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const { id } = c.req.param();

    // Run both queries concurrently
    const [items, result] = await Promise.all([
        // Query to get sale items
        db.select({
            productId: products.id,
            quantity: saleItems.quantity,
            profit: saleItems.profit,
            subTotal: saleItems.subTotal,
            productName: products.name,
            productPrice: saleItems.productPrice,
            productCost: saleItems.productCost,
            unitName: units.name
        })
            .from(saleItems)
            .leftJoin(products, eq(saleItems.productId, products.id))
            .leftJoin(units, eq(products.unitId, units.id))
            .where(eq(saleItems.saleId, Number(id))),

        // Query to get sale details with warehouse and customer details
        db.select({
            id: sales.id,
            date: sales.date,
            status: sales.status,
            amount: sales.amount,
            shipping: sales.shipping,
            discount: sales.discount,
            taxPercent: sales.taxPercent,
            taxAmount: sales.taxAmount,
            totalAmount: sales.totalAmount,
            paymentStatus: sales.paymentStatus,
            paymentType: {
                id: sales.paymentTypeId,
                name: paymentType.name
            },
            note: sales.note,
            warehouse: {
                id: warehouses.id,
                name: warehouses.name,
                phone: warehouses.phone,
                email: warehouses.email,
                city: warehouses.city,
                address: warehouses.address
            },
            customer: {
                id: customers.id,
                name: customers.name,
                phone: customers.phone,
                email: customers.email,
                city: customers.city,
                address: customers.address
            },
            createdAt: sales.createdAt,
            updatedAt: sales.updatedAt
        })
            .from(sales)
            .leftJoin(warehouses, eq(sales.warehouseId, warehouses.id))  // Join with warehouses table
            .leftJoin(customers, eq(sales.customerId, customers.id))     // Join with customers table
            .leftJoin(paymentType, eq(sales.paymentTypeId, paymentType.id))     // Join with customers table
            .where(eq(sales.id, Number(id))),
    ]);

    // Combine both queries into a single response
    const response = {
        ...result[0],   // Get the first (and only) sale result
        saleItems: items  // Include the list of sale items
    };

    // Send the response
    c.status(200);
    return c.json(response);
}


export const getSaleWithItems = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const { id } = c.req.param();

    // Run both queries concurrently
    const [items, result] = await Promise.all([
        // Query to get sale items
        db.select({
            productId: products.id,
            quantity: saleItems.quantity,
            profit: saleItems.profit,
            stock: manageStocks.quantity,
            subTotal: saleItems.subTotal,
            productName: products.name,
            productPrice: saleItems.productPrice,
            productCost: saleItems.productCost,
            unitName: units.name
        })
            .from(saleItems)
            .leftJoin(products, eq(saleItems.productId, products.id))
            .leftJoin(units, eq(products.unitId, units.id))
            .leftJoin(sales, eq(saleItems.saleId, sales.id))
            .leftJoin(manageStocks, and(
                eq(manageStocks.productId, saleItems.productId),
                eq(manageStocks.warehouseId, sales.warehouseId) // Match the warehouse
            ))
            .where(eq(saleItems.saleId, Number(id))),

        // Query to get sale details with warehouse and customer details
        db.select({
            id: sales.id,
            date: sales.date,
            status: sales.status,
            amount: sales.amount,
            shipping: sales.shipping,
            discount: sales.discount,
            taxPercent: sales.taxPercent,
            taxAmount: sales.taxAmount,
            totalAmount: sales.totalAmount,
            paymentStatus: sales.paymentStatus,
            paymentType: {
                id: sales.paymentTypeId,
                name: paymentType.name
            },
            note: sales.note,
            warehouse: {
                id: warehouses.id,
                name: warehouses.name,
                phone: warehouses.phone,
                email: warehouses.email,
                city: warehouses.city,
                address: warehouses.address
            },
            customer: {
                id: customers.id,
                name: customers.name,
                phone: customers.phone,
                email: customers.email,
                city: customers.city,
                address: customers.address
            },
            createdAt: sales.createdAt,
            updatedAt: sales.updatedAt
        })
            .from(sales)
            .leftJoin(warehouses, eq(sales.warehouseId, warehouses.id))  // Join with warehouses table
            .leftJoin(customers, eq(sales.customerId, customers.id))     // Join with customers table
            .leftJoin(paymentType, eq(sales.paymentTypeId, paymentType.id))     // Join with customers table
            .where(eq(sales.id, Number(id))),
    ]);

    // Combine both queries into a single response
    const response = {
        ...result[0],   // Get the first (and only) sale result
        saleItems: items  // Include the list of sale items
    };

    // Send the response
    c.status(200);
    return c.json(response);
}


export const createSaleWithItems = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const saleData: SaleData = await c.req.json();
    let saleId: number | undefined;

    try {
        // Step 1: Insert the sale
        const sale = await db.insert(sales).values({
            date: saleData.saleDate,
            warehouseId: saleData.warehouseId,
            userId: saleData.userId,
            customerId: saleData.customerId,
            amount: saleData.amount,
            paymentStatus: saleData.paymentStatus,
            paymentTypeId: saleData.paymentTypeId,
            discount: saleData.discount,
            taxPercent: saleData.taxPercent,
            taxAmount: saleData.taxAmount,
            totalAmount: saleData.totalAmount,
            shipping: saleData.shipping,
            note: saleData.note,
            status: saleData.status, // 0 = "Received", 1 = "Pending"
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }).returning();

        saleId = sale[0].id; // Get the newly created sale ID

        // Step 2: Insert each sale item
        for (const item of saleData.saleItems) {
            await db.insert(saleItems).values({
                saleId: saleId,
                productId: item.productId,
                quantity: item.quantity,
                profit: item.profit,
                productPrice: item.productPrice,
                productCost: item.productCost,
                subTotal: item.subTotal,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });

            // Step 3: Update manageStocks only if status is "Received" (0)
            if (saleData.status === 0) { // 0 = Received
                const existingStock = await db.select().from(manageStocks)
                    .where(and(
                        eq(manageStocks.productId, item.productId),
                        eq(manageStocks.warehouseId, saleData.warehouseId)
                    ))
                    .execute();

                if (existingStock.length > 0) {
                    // Reduce the existing stock quantity
                    const newQuantity = existingStock[0].quantity - item.quantity;
                    if (newQuantity < 0) {
                        throw new Error(`Insufficient stock for product ID ${item.productId}`);
                    }
                    await db.update(manageStocks)
                        .set({
                            quantity: newQuantity,
                            updatedAt: Date.now(),
                        })
                        .where(eq(manageStocks.id, existingStock[0].id))
                        .execute();
                } else {
                    throw new Error(`Stock for product ID ${item.productId} not found in warehouse ${saleData.warehouseId}`);
                }
            }
        }

        c.status(201);
        return c.json({ saleId: saleId });

    } catch (error) {
        console.error("Error creating sale:", error);

        // Rollback inserted sale/items if necessary
        if (saleId) {
            await db.delete(saleItems).where(eq(saleItems.saleId, saleId)).execute();
            await db.delete(sales).where(eq(sales.id, saleId)).execute();
        }

        c.status(500);
        return c.json({ status: "ERROR", message: "Failed to create sale." });
    }
};

export const updateSaleWithItems = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const saleData: UpdateSaleData = await c.req.json();

    try {
        const saleId = saleData.saleId;

        // Step 1: Fetch the existing sale and sale items
        const existingSale = await db.select().from(sales).where(eq(sales.id, saleId)).execute();
        if (existingSale.length === 0) {
            c.status(404);
            return c.json({ status: "ERROR", message: "Sale not found." });
        }

        const existingSaleItems = await db.select().from(saleItems).where(eq(saleItems.saleId, saleId)).execute();

        // Step 2: Revert stock changes if the original status was "Received" (0)
        if (existingSale[0].status === 0) {
            for (const item of existingSaleItems) {
                const stock = await db.select().from(manageStocks)
                    .where(and(
                        eq(manageStocks.productId, item.productId!),
                        eq(manageStocks.warehouseId, existingSale[0].warehouseId!)
                    ))
                    .execute();

                if (stock.length > 0) {
                    // Add back the original quantities
                    await db.update(manageStocks)
                        .set({
                            quantity: stock[0].quantity + item.quantity,
                            updatedAt: Date.now(),
                        })
                        .where(eq(manageStocks.id, stock[0].id))
                        .execute();
                }
            }
        }

        // Step 3: Update the sale record
        await db.update(sales)
            .set({
                date: saleData.saleDate ?? existingSale[0].date,
                warehouseId: saleData.warehouseId ?? existingSale[0].warehouseId,
                userId: saleData.userId ?? existingSale[0].userId,
                customerId: saleData.customerId ?? existingSale[0].customerId,
                amount: saleData.amount ?? existingSale[0].amount,
                paymentStatus: saleData.paymentStatus ?? existingSale[0].paymentStatus,
                paymentTypeId: saleData.paymentTypeId ?? existingSale[0].paymentTypeId,
                discount: saleData.discount ?? existingSale[0].discount,
                taxPercent: saleData.taxPercent ?? existingSale[0].taxPercent,
                taxAmount: saleData.taxAmount ?? existingSale[0].taxAmount,
                totalAmount: saleData.totalAmount ?? existingSale[0].totalAmount,
                shipping: saleData.shipping ?? existingSale[0].shipping,
                note: saleData.note ?? existingSale[0].note,
                status: saleData.status ?? existingSale[0].status,
                updatedAt: Date.now(),
            })
            .where(eq(sales.id, saleId))
            .execute();

        // Step 4: Delete existing sale items
        await db.delete(saleItems).where(eq(saleItems.saleId, saleId)).execute();

        // Step 5: Insert updated sale items and adjust stock if new status is "Received" (0)
        for (const item of saleData.saleItems) {
            await db.insert(saleItems).values({
                saleId: saleId,
                productId: item.productId,
                quantity: item.quantity,
                profit: item.profit,
                productPrice: item.productPrice,
                productCost: item.productCost,
                subTotal: item.subTotal,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });

            if (saleData.status === 0) { // Adjust stock only if new status is "Received"
                const stock = await db.select().from(manageStocks)
                    .where(and(
                        eq(manageStocks.productId, item.productId),
                        eq(manageStocks.warehouseId, saleData.warehouseId)
                    ))
                    .execute();

                if (stock.length > 0) {
                    const newQuantity = stock[0].quantity - item.quantity;
                    if (newQuantity < 0) {
                        throw new Error(`Insufficient stock for product ID ${item.productId}`);
                    }
                    await db.update(manageStocks)
                        .set({
                            quantity: newQuantity,
                            updatedAt: Date.now(),
                        })
                        .where(eq(manageStocks.id, stock[0].id))
                        .execute();
                } else {
                    throw new Error(`Stock for product ID ${item.productId} not found in warehouse ${saleData.warehouseId}`);
                }
            }
        }

        c.status(200);
        return c.json({ status: "SUCCESS", message: "Sale updated successfully." });

    } catch (error) {
        console.error("Error updating sale:", error);
        c.status(500);
        return c.json({ status: "ERROR", message: "Failed to update sale." });
    }
};

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
    let query: any = db.select({
        id: sales.id,
        date: sales.date,
        status: sales.status,
        amount: sales.amount,
        shipping: sales.shipping,
        discount: sales.discount,
        taxPercent: sales.taxPercent,
        taxAmount: sales.taxAmount,
        totalAmount: sales.totalAmount,
        paymentStatus: sales.paymentStatus,
        note: sales.note,
        warehouse: {
            id: warehouses.id,
            name: warehouses.name,
            phone: warehouses.phone,
            email: warehouses.email,
            city: warehouses.city,
            address: warehouses.address
        },
        customer: {
            id: customers.id,
            name: customers.name,
            phone: customers.phone,
            email: customers.email,
            city: customers.city,
            address: customers.address
        },
        createdAt: sales.createdAt,
        updatedAt: sales.updatedAt
    }).from(sales)
        .innerJoin(warehouses, eq(warehouses.id, sales.warehouseId))
        .innerJoin(customers, eq(customers.id, sales.customerId))
        .innerJoin(users, eq(sales.userId, users.id));

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


