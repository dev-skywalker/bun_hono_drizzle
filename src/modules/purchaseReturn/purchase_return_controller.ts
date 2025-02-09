import { drizzle } from "drizzle-orm/d1";
import { eq, like, sql, and } from "drizzle-orm";
import { Context } from "hono";
import { manageStocks, products, purchaseItems, purchaseReturn, purchaseReturnItems, purchases, suppliers, units, warehouses } from "../../db/schema";

interface PurchaseReturnData {
    purchaseId: number;                // ID of the original purchase
    returnDate: number;                  // Date of the return
    totalAmount: number;               // Total amount for the return
    note?: string;                     // Optional note for additional details
    status: number;                    // Status of the return, e.g., pending or completed
    // shipping: number;                    // Status of the return, e.g., pending or completed
    warehouseId: number;
    returnItems: PurchaseReturnItem[]; // Array of items being returned
}

interface PurchaseReturnItem {
    productId: number;                 // ID of the product being returned
    quantity: number;                  // Quantity of the product being returned
    productCost: number;               // Cost of the product per unit
    subTotal: number;                  // Subtotal for this item (quantity * productCost)
}

export const getPurchaseReturn = async (c: Context) => {
    const { filter, limit, offset, sortBy, sortOrder } = c.req.query();
    const db = drizzle(c.env.DB);

    // Base query
    let query: any = db.select({
        id: purchaseReturn.id,
        date: purchaseReturn.date,
        status: purchaseReturn.status,
        amount: purchaseReturn.totalAmount,
        note: purchaseReturn.note,
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
    }).from(purchaseReturn)
        .innerJoin(purchases, eq(purchases.id, purchaseReturn.purchaseId))
        .innerJoin(warehouses, eq(warehouses.id, purchases.warehouseId))
        .innerJoin(suppliers, eq(suppliers.id, purchases.supplierId));

    // Apply filter if present
    if (filter) {
        query = query.where(like(purchaseReturn.id, `%${filter}%`));
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
            que = sql`${purchaseReturn.id} desc nulls first`;
        } else if (sortBy === "name" && sortOrder === "asc") {
            que = sql`${purchaseReturn.id} asc nulls first`;
        } else if (sortBy === "id" && sortOrder === "desc") {
            que = sql`${purchaseReturn.id} desc nulls first`;
        } else if (sortBy === "id" && sortOrder === "asc") {
            que = sql`${purchaseReturn.id} asc nulls first`;
        } else {
            que = sql`${purchaseReturn.id} asc nulls first`;
        }
    } else {
        que = sql`${purchaseReturn.id} asc nulls first`;
    }

    // Apply sorting, limit, and offset
    query = query.orderBy(que)
        .limit(Number(limit))
        .offset(Number(offset));

    const results = await query.execute();

    return c.json({ totalRecords: totalRecords, data: results });
};


export const getPurchaseReturnWithItems = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const { id } = c.req.param();

    // Run both queries concurrently
    const [items, result] = await Promise.all([
        // Query to get sale items
        db.select({
            productId: products.id,
            quantity: purchaseReturnItems.quantity,
            //profit: salesReturnItems.profit,
            subTotal: purchaseReturnItems.subTotal,
            productName: products.name,
            //productPrice: products.productPrice,
            productCost: purchaseReturnItems.productCost,
            unitName: units.name
        })
            .from(purchaseReturnItems)
            .leftJoin(products, eq(purchaseReturnItems.productId, products.id))
            .leftJoin(units, eq(products.unitId, units.id))
            .where(eq(purchaseReturnItems.purchaseReturnId, Number(id))),

        // Query to get sale details with warehouse and customer details
        db.select({
            purchaseReturn: purchaseReturn.id,
            purchaseReturnDate: purchaseReturn.date,
            purchaseReturnStatus: purchaseReturn.status,
            purchaseReturnReturnAmount: purchaseReturn.totalAmount,
            //saleShipping: salesReturn.shipping,
            purchaseReturnReturnNote: purchaseReturn.note,
            warehouse: {
                warehouseId: purchases.warehouseId,
                warehouseName: warehouses.name,
                warehousePhone: warehouses.phone,
                warehouseEmail: warehouses.email,
                warehouseAddress: warehouses.address,
                warehouseCity: warehouses.city,
            },
            supplier: {
                supplierId: purchases.supplierId,
                supplierName: suppliers.name,
                supplierPhone: suppliers.phone,
                supplierEmail: suppliers.email,
                supplierAddress: suppliers.address,
                supplierCity: suppliers.city,
            },
        })
            .from(purchaseReturn)
            .leftJoin(purchases, eq(purchaseReturn.purchaseId, purchases.id))
            .leftJoin(warehouses, eq(purchases.warehouseId, warehouses.id))  // Join with warehouses table
            .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))     // Join with customers table
            .where(eq(purchaseReturn.id, Number(id))),
    ]);

    // Combine both queries into a single response
    const response = {
        ...result[0],   // Get the first (and only) sale result
        purchaseReturnItems: items  // Include the list of sale items
    };

    // Send the response
    c.status(200);
    return c.json(response);
}

export const createPurchaseReturnWithItems = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const purchaseReturnData: PurchaseReturnData = await c.req.json();
    let purchaseReturnId: number | undefined;

    try {
        // Step 1: Insert purchase return
        const purchaseReturns = await db.insert(purchaseReturn).values({
            purchaseId: purchaseReturnData.purchaseId,
            date: purchaseReturnData.returnDate,
            totalAmount: purchaseReturnData.totalAmount,
            note: purchaseReturnData.note,
            status: purchaseReturnData.status,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }).returning();

        purchaseReturnId = purchaseReturns[0].id;

        // Step 2: Insert each returned item, update stock, and update purchaseItems
        let totalReturnedAmount = 0;

        for (const item of purchaseReturnData.returnItems) {
            await db.insert(purchaseReturnItems).values({
                purchaseReturnId,
                productId: item.productId,
                quantity: item.quantity,
                productCost: item.productCost,
                subTotal: item.subTotal,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });

            // Step 3: Decrease stock in manageStocks
            const existingStock = await db.select().from(manageStocks)
                .where(and(
                    eq(manageStocks.productId, item.productId),
                    eq(manageStocks.warehouseId, purchaseReturnData.warehouseId)
                ))
                .execute();

            if (existingStock.length > 0) {
                const newStockQuantity = existingStock[0].quantity - item.quantity;
                await db.update(manageStocks)
                    .set({
                        quantity: newStockQuantity > 0 ? newStockQuantity : 0,
                        updatedAt: Date.now(),
                    })
                    .where(eq(manageStocks.id, existingStock[0].id))
                    .execute();
            } else {
                throw new Error(`Stock not found for product ID ${item.productId}`);
            }

            // Step 4: Update quantity in purchaseItems and track the returned amount
            const purchaseItem = await db.select().from(purchaseItems)
                .where(and(
                    eq(purchaseItems.purchaseId, purchaseReturnData.purchaseId),
                    eq(purchaseItems.productId, item.productId)
                ))
                .execute();

            if (purchaseItem.length > 0) {
                const newQuantity = purchaseItem[0].quantity - item.quantity;
                const total = purchaseItem[0].productCost * newQuantity;
                await db.update(purchaseItems)
                    .set({
                        quantity: newQuantity > 0 ? newQuantity : 0,
                        subTotal: total,
                        updatedAt: Date.now(),
                    })
                    .where(eq(purchaseItems.id, purchaseItem[0].id))
                    .execute();

                totalReturnedAmount += item.subTotal;
            } else {
                throw new Error(`Purchase item not found for product ID ${item.productId}`);
            }
        }

        // Step 5: Update the purchase table with the adjusted amount and status if necessary
        const purchase = await db.select().from(purchases).where(eq(purchases.id, purchaseReturnData.purchaseId)).execute();
        if (purchase.length > 0) {
            const newTotalAmount = purchase[0].amount - totalReturnedAmount;
            await db.update(purchases)
                .set({
                    amount: newTotalAmount,
                    //shipping: purchaseReturnData.shipping,
                    //note: purchaseReturnData.note,
                    //status: 0, // Set to "returned" status if fully returned
                    updatedAt: Date.now(),
                })
                .where(eq(purchases.id, purchaseReturnData.purchaseId))
                .execute();
        }

        c.status(201);
        return c.json({ purchaseReturnId });
    } catch (error) {
        console.error("Error creating purchase return:", error);
        c.status(500);
    }
};
