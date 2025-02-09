import { drizzle } from "drizzle-orm/d1";
import { eq, like, sql, and } from "drizzle-orm";
import { Context } from "hono";
import { customers, manageStocks, products, saleItems, sales, salesReturn, salesReturnItems, units, warehouses } from "../../db/schema";

interface SalesReturnData {
    saleId: number;
    returnDate: number;
    totalAmount: number;
    note?: string;
    status: number;
    warehouseId: number;
    returnItems: SalesReturnItemData[];
}

interface SalesReturnItemData {
    productId: number;
    quantity: number;
    productPrice: number;
    productCost: number;
    subTotal: number;
}

export const getSaleReturn = async (c: Context) => {
    const { filter, limit, offset, sortBy, sortOrder } = c.req.query();
    const db = drizzle(c.env.DB);

    // Base query
    let query: any = db.select({
        id: salesReturn.id,
        date: salesReturn.date,
        status: salesReturn.status,
        amount: salesReturn.totalAmount,
        note: salesReturn.note,
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
    }).from(salesReturn)
        .innerJoin(sales, eq(sales.id, salesReturn.saleId))
        .innerJoin(warehouses, eq(warehouses.id, sales.warehouseId))
        .innerJoin(customers, eq(customers.id, sales.customerId));

    // Apply filter if present
    if (filter) {
        query = query.where(like(salesReturn.id, `%${filter}%`));
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
            que = sql`${salesReturn.id} desc nulls first`;
        } else if (sortBy === "name" && sortOrder === "asc") {
            que = sql`${salesReturn.id} asc nulls first`;
        } else if (sortBy === "id" && sortOrder === "desc") {
            que = sql`${salesReturn.id} desc nulls first`;
        } else if (sortBy === "id" && sortOrder === "asc") {
            que = sql`${salesReturn.id} asc nulls first`;
        } else {
            que = sql`${salesReturn.id} asc nulls first`;
        }
    } else {
        que = sql`${salesReturn.id} asc nulls first`;
    }

    // Apply sorting, limit, and offset
    query = query.orderBy(que)
        .limit(Number(limit))
        .offset(Number(offset));

    const results = await query.execute();

    return c.json({ totalRecords: totalRecords, data: results });
};

export const getSaleReturnWithItems = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const { id } = c.req.param();

    // Run both queries concurrently
    const [items, result] = await Promise.all([
        // Query to get sale items
        db.select({
            productId: products.id,
            quantity: salesReturnItems.quantity,
            //profit: salesReturnItems.profit,
            subTotal: salesReturnItems.subTotal,
            productName: products.name,
            productPrice: salesReturnItems.productPrice,
            productCost: salesReturnItems.productCost,
            unitName: units.name
        })
            .from(salesReturnItems)
            .leftJoin(products, eq(salesReturnItems.productId, products.id))
            .leftJoin(units, eq(products.unitId, units.id))
            .where(eq(salesReturnItems.salesReturnId, Number(id))),

        // Query to get sale details with warehouse and customer details
        db.select({
            id: salesReturn.id,
            date: salesReturn.date,
            status: salesReturn.status,
            amount: salesReturn.totalAmount,
            note: salesReturn.note,
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
            .from(salesReturn)
            .leftJoin(sales, eq(salesReturn.saleId, sales.id))
            .leftJoin(warehouses, eq(sales.warehouseId, warehouses.id))  // Join with warehouses table
            .leftJoin(customers, eq(sales.customerId, customers.id))     // Join with customers table
            .where(eq(salesReturn.id, Number(id))),
    ]);

    // Combine both queries into a single response
    const response = {
        ...result[0],   // Get the first (and only) sale result
        salesReturnItems: items  // Include the list of sale items
    };

    // Send the response
    c.status(200);
    return c.json(response);
}




export const createSalesReturnWithItems = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const salesReturnData: SalesReturnData = await c.req.json();
    let salesReturnId: number | undefined;

    try {
        // Step 1: Insert sales return
        const salesReturns = await db.insert(salesReturn).values({
            saleId: salesReturnData.saleId,
            date: salesReturnData.returnDate,
            totalAmount: salesReturnData.totalAmount,
            note: salesReturnData.note,
            status: salesReturnData.status,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }).returning();

        salesReturnId = salesReturns[0].id;

        // Check if salesReturnId exists in the salesReturn table
        if (!salesReturnId) {
            throw new Error("Failed to create sales return");
        }

        // Step 2: Insert each returned item, update stock, and update saleItems
        let totalReturnedAmount = 0;

        for (const item of salesReturnData.returnItems) {
            // Check if the productId exists in the products table
            // const productExists = await db.select().from(products)
            //     .where(eq(products.id, item.productId))
            //     .execute();

            // if (productExists.length === 0) {
            //     throw new Error(`Product with ID ${item.productId} not found`);
            // }

            await db.insert(salesReturnItems).values({
                salesReturnId,
                productId: item.productId,
                quantity: item.quantity,
                productCost: item.productCost,
                productPrice: item.productPrice,
                subTotal: item.subTotal,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });

            // Increase stock in manageStocks
            const existingStock = await db.select().from(manageStocks)
                .where(and(
                    eq(manageStocks.productId, item.productId),
                    eq(manageStocks.warehouseId, salesReturnData.warehouseId)
                ))
                .execute();

            if (existingStock.length > 0) {
                await db.update(manageStocks)
                    .set({ quantity: existingStock[0].quantity + item.quantity, updatedAt: Date.now() })
                    .where(and(
                        eq(manageStocks.productId, item.productId),
                        eq(manageStocks.warehouseId, salesReturnData.warehouseId)
                    ))
                    .execute();
            } else {
                await db.insert(manageStocks).values({
                    productId: item.productId,
                    quantity: item.quantity,
                    alert: 0,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
            }

            // Step 3: Update quantity in saleItems and track the returned amount
            const saleItem = await db.select().from(saleItems)
                .where(and(
                    eq(saleItems.saleId, salesReturnData.saleId),
                    eq(saleItems.productId, item.productId)
                ))
                .execute();

            if (saleItem.length > 0) {
                const newQuantity = saleItem[0].quantity - item.quantity;
                const total = saleItem[0].productPrice * newQuantity;
                const profit = (saleItem[0].productPrice - saleItem[0].productCost) * newQuantity;
                await db.update(saleItems)
                    .set({ quantity: newQuantity > 0 ? newQuantity : 0, profit: profit, subTotal: total, updatedAt: Date.now() })
                    .where(eq(saleItems.id, saleItem[0].id))
                    .execute();

                totalReturnedAmount += item.subTotal;
            } else {
                throw new Error(`Sale item not found for product ID ${item.productId}`);
            }
        }

        // Step 4: Update the sales table with the adjusted amount and status if necessary
        const sale = await db.select().from(sales).where(eq(sales.id, salesReturnData.saleId)).execute();
        if (sale.length > 0) {
            const newTotalAmount = sale[0].amount - totalReturnedAmount;
            const taxAmount = (newTotalAmount - sale[0].discount) * (sale[0].taxPercent / 100);
            const grandTotal = newTotalAmount + sale[0].shipping - sale[0].discount + taxAmount;

            await db.update(sales)
                .set({
                    amount: newTotalAmount,
                    totalAmount: grandTotal,
                    taxAmount: taxAmount,
                    // shipping: salesReturnData.shipping,
                    // note: salesReturnData.note,
                    // status: 0, // Set to "returned" status if fully returned
                    updatedAt: Date.now(),
                })
                .where(eq(sales.id, salesReturnData.saleId))
                .execute();
        }

        c.status(201);
        return c.json({ salesReturnId });
    } catch (error) {
        console.error("Error creating sales return:", error);
        c.status(500);
        return c.json({ status: "ERROR", message: "Failed to create sales return." });
    }
};
