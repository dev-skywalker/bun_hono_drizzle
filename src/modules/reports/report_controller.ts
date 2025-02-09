import { drizzle } from "drizzle-orm/d1";
import { and, between, eq, like, lt, lte, sql, sum } from "drizzle-orm";
import { Context } from "hono";
import { Env } from "../../config/env";
import { customers, manageStocks, products, purchaseItems, purchases, saleItems, sales, suppliers, units, warehouses } from "../../db/schema";


export const getSaleDateReport = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { startDate, endDate, warehouseId } = c.req.query();

    // Subquery to calculate total sales and shipping at the sales level
    const salesSubquery = db
        .select({
            totalSalesAmount: sum(sales.totalAmount).mapWith(Number),
            totalShippingAmount: sum(sales.shipping).mapWith(Number),
            totalTaxAmount: sum(sales.taxAmount).mapWith(Number),
            totalDiscountAmount: sum(sales.discount).mapWith(Number),
            paymentReceivedAmount: sql<number>`
                SUM(CASE WHEN ${sales.paymentStatus} = 0 THEN ${sales.totalAmount} ELSE 0 END)
            `
        })
        .from(sales)
        .where(and(
            warehouseId ? eq(sales.warehouseId, Number(warehouseId)) : sql`1 = 1`,
            between(sales.date, Number(startDate), Number(endDate))
        ));

    // Subquery to calculate total quantity and profit at the saleItems level
    const saleItemsSubquery = db
        .select({
            totalQuantitySold: sum(saleItems.quantity).mapWith(Number),
            totalProfit: sum(saleItems.profit).mapWith(Number),
        })
        .from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .where(and(
            warehouseId ? eq(sales.warehouseId, Number(warehouseId)) : sql`1 = 1`,
            between(sales.date, Number(startDate), Number(endDate))
        ));

    // Execute both subqueries
    const [salesReport, saleItemsReport] = await Promise.all([salesSubquery, saleItemsSubquery]);

    // Combine results into a single object
    const report = {
        totalSalesAmount: salesReport[0]?.totalSalesAmount || 0,
        totalShippingAmount: salesReport[0]?.totalShippingAmount || 0,
        totalTaxAmount: salesReport[0]?.totalTaxAmount || 0,
        totalDiscountAmount: salesReport[0]?.totalDiscountAmount || 0,
        totalQuantitySold: saleItemsReport[0]?.totalQuantitySold || 0,
        totalProfit: saleItemsReport[0]?.totalProfit || 0,
        paymentReceivedAmount: salesReport[0]?.paymentReceivedAmount || 0,
    };

    return c.json(report);
};

export const getPurchaseDateReport = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { startDate, endDate, warehouseId } = c.req.query();

    // Subquery to calculate total purchase amount and shipping at the purchases level
    const purchasesSubquery = db
        .select({
            totalPurchaseAmount: sum(purchases.amount).mapWith(Number),
            totalShippingAmount: sum(purchases.shipping).mapWith(Number),
            paymentPurchasedAmount: sql<number>`
                SUM(CASE WHEN ${purchases.paymentStatus} = 0 THEN ${purchases.amount} ELSE 0 END)
            `
        })
        .from(purchases)
        .where(and(
            warehouseId ? eq(purchases.warehouseId, Number(warehouseId)) : sql`1 = 1`,
            between(purchases.date, Number(startDate), Number(endDate))
        ));

    // Subquery to calculate total quantity and product cost at the purchaseItems level
    const purchaseItemsSubquery = db
        .select({
            totalQuantityPurchased: sum(purchaseItems.quantity).mapWith(Number)
            //totalProductCost: sum(purchaseItems.productCost).mapWith(Number),
        })
        .from(purchaseItems)
        .innerJoin(purchases, eq(purchaseItems.purchaseId, purchases.id))
        .where(and(
            warehouseId ? eq(purchases.warehouseId, Number(warehouseId)) : sql`1 = 1`,
            between(purchases.date, Number(startDate), Number(endDate))
        ));

    // Execute both subqueries
    const [purchasesReport, purchaseItemsReport] = await Promise.all([
        purchasesSubquery,
        purchaseItemsSubquery,
    ]);

    // Combine results into a single object
    const report = {
        totalPurchaseAmount: purchasesReport[0]?.totalPurchaseAmount || 0,
        totalShippingAmount: purchasesReport[0]?.totalShippingAmount || 0,
        totalQuantityPurchased: purchaseItemsReport[0]?.totalQuantityPurchased || 0,
        totalPaymentPurchased: purchasesReport[0]?.paymentPurchasedAmount || 0,
    };

    return c.json(report);
};

export const getTopSellingProducts = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);

    // Calculate the current year's start and end dates in milliseconds
    const now = new Date();
    const currentYear = now.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1).getTime(); // January 1st, 00:00:00
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999).getTime(); // December 31st, 23:59:59

    // Query to get top 5 best-selling products by quantity sold
    const query = db
        .select({
            productId: saleItems.productId,
            productName: products.name,
            productUnit: units.name,
            productQuantitySold: sum(saleItems.quantity).mapWith(Number),
        })
        .from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .innerJoin(products, eq(products.id, saleItems.productId))
        .innerJoin(units, eq(units.id, products.unitId))
        .where(between(sales.date, startOfYear, endOfYear)) // Filter by current year
        .groupBy(saleItems.productId)
        .orderBy(sql`${sum(saleItems.quantity).mapWith(Number)} desc`) // Order by quantity sold in descending order
        .limit(5); // Limit to top 5 items

    // Execute the query
    const results = await query.execute();

    return c.json(results);
};


export const getSalesByProduct = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { startDate, endDate, filter, limit, offset, sortBy, sortOrder, warehouseId } = c.req.query();

    // const todaySalesByProduct = await 
    let query: any = db
        .select({
            productId: saleItems.productId,
            productName: products.name,
            productUnit: units.name,
            // productCost: saleItems.productCost,
            // productPrice: saleItems.productPrice,
            productQuantitySold: sum(saleItems.quantity).mapWith(Number),
            productSalesAmount: sum(saleItems.subTotal).mapWith(Number),
            //productSalesAmount: sql`SUM(${products.productPrice} * ${sum(saleItems.quantity).mapWith(Number)})`.as('totalItemValue'),
            totalProfit: sum(saleItems.profit).mapWith(Number),
        })
        .from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .innerJoin(products, eq(products.id, saleItems.productId))
        .innerJoin(units, eq(units.id, products.unitId))
        .where(and(warehouseId ? eq(sales.warehouseId, Number(warehouseId)) : sql`1 = 1`, between(sales.date, Number(startDate), Number(endDate))))
        .groupBy(saleItems.productId);

    if (filter) {
        query = query.where(and(like(products.name, `%${filter}%`), warehouseId ? eq(sales.warehouseId, Number(warehouseId)) : sql`1 = 1`, between(sales.date, Number(startDate), Number(endDate))));
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
        } else if (sortBy === "id" && sortOrder === "desc") {
            que = sql`${products.id} desc nulls first`;
        } else if (sortBy === "id" && sortOrder === "asc") {
            que = sql`${products.id} asc nulls first`;
        }
        else if (sortBy === "qty" && sortOrder === "desc") {
            que = sql`${sum(saleItems.quantity).mapWith(Number)} desc nulls first`;
        } else if (sortBy === "qty" && sortOrder === "asc") {
            que = sql`${sum(saleItems.quantity).mapWith(Number)} asc nulls first`;
        } else {
            que = sql`${sum(saleItems.quantity).mapWith(Number)} desc nulls first`;
        }
    } else {
        que = sql`${sum(saleItems.quantity).mapWith(Number)} desc nulls first`;
    }

    // Apply sorting, limit, and offset
    query = query.orderBy(que)
        .limit(Number(limit))
        .offset(Number(offset));

    const results = await query.execute();

    return c.json({ totalRecords: totalRecords, data: results });
    //return c.json(todaySalesByProduct)
}

export const getPurchaseByProduct = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { startDate, endDate, filter, limit, offset, sortBy, sortOrder, warehouseId } = c.req.query();

    // const todaySalesByProduct = await 
    let query: any = db
        .select({
            productId: purchaseItems.productId,
            productName: products.name,
            productUnit: units.name,
            productCost: purchaseItems.productCost,
            //productPrice: products.productPrice,
            productQuantity: sum(purchaseItems.quantity).mapWith(Number),
            //productAmount: sum(purchaseItems.subTotal).mapWith(Number),
        })
        .from(purchaseItems)
        .innerJoin(purchases, eq(purchaseItems.purchaseId, purchases.id))
        .innerJoin(products, eq(products.id, purchaseItems.productId))
        .innerJoin(units, eq(units.id, products.unitId))
        .where(and(eq(purchases.warehouseId, Number(warehouseId)), between(purchases.date, Number(startDate), Number(endDate))))
        .groupBy(purchaseItems.productId);

    if (filter) {
        query = query.where(and(like(products.name, `%${filter}%`), eq(purchases.warehouseId, Number(warehouseId)), between(purchases.date, Number(startDate), Number(endDate))));
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
        } else if (sortBy === "id" && sortOrder === "desc") {
            que = sql`${products.id} desc nulls first`;
        } else if (sortBy === "id" && sortOrder === "asc") {
            que = sql`${products.id} asc nulls first`;
        }
        else if (sortBy === "qty" && sortOrder === "desc") {
            que = sql`${sum(purchaseItems.quantity).mapWith(Number)} desc nulls first`;
        } else if (sortBy === "qty" && sortOrder === "asc") {
            que = sql`${sum(purchaseItems.quantity).mapWith(Number)} asc nulls first`;
        } else {
            que = sql`${products.id} asc nulls first`;
        }
    } else {
        que = sql`${products.id} asc nulls first`;
    }

    // Apply sorting, limit, and offset
    query = query.orderBy(que)
        .limit(Number(limit))
        .offset(Number(offset));

    const results = await query.execute();

    return c.json({ totalRecords: totalRecords, data: results });
    //return c.json(todaySalesByProduct)
}


export const getTotalInventoryValue = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { warehouseId } = c.req.query();

    const totalInventoryValue = await db
        .select({
            totalItemValue: sql`SUM(${products.productCost} * ${manageStocks.quantity})`.as('totalItemValue'),
            totalSoldItemValue: sql`SUM(${products.productPrice} * ${manageStocks.quantity})`.as('totalSoldItemValue'),
        })
        .from(manageStocks)
        .innerJoin(products, eq(products.id, manageStocks.productId))
        .where(eq(manageStocks.warehouseId, Number(warehouseId)));

    return c.json(totalInventoryValue[0])
}

export const getStockAlertItems = async (c: Context) => {
    const { filter, limit, offset, sortBy, sortOrder, warehouseId } = c.req.query();
    const db = drizzle(c.env.DB);

    // Base query
    let query: any = db
        .select({
            productId: manageStocks.productId,
            productName: products.name,
            unitName: units.name,
            productCost: products.productCost,
            productPrice: products.productPrice,
            quantity: manageStocks.quantity,
            alertLevel: manageStocks.alert,
            warehouseId: warehouses.id,
            warehouseName: warehouses.name

        })
        .from(manageStocks)
        .innerJoin(products, eq(products.id, manageStocks.productId))
        .innerJoin(warehouses, eq(warehouses.id, manageStocks.warehouseId))
        .innerJoin(units, eq(units.id, products.unitId))
        .where(
            and(
                warehouseId ? eq(manageStocks.warehouseId, Number(warehouseId)) : sql`1 = 1`,
                lte(manageStocks.quantity, manageStocks.alert)
            )
            // manageStocks.warehouseId.equals(warehouseId)
            //     .and(manageStocks.quantity.lessThan(manageStocks.alert))
        );

    // Apply filter if present
    if (filter) {
        query = query.where(and(like(products.name, `%${filter}%`), warehouseId ? eq(manageStocks.warehouseId, Number(warehouseId)) : sql`1 = 1`,
            lte(manageStocks.quantity, manageStocks.alert)));
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
        } else if (sortBy === "id" && sortOrder === "desc") {
            que = sql`${products.id} desc nulls first`;
        } else if (sortBy === "id" && sortOrder === "asc") {
            que = sql`${products.id} asc nulls first`;
        }
        else if (sortBy === "qty" && sortOrder === "desc") {
            que = sql`${manageStocks.quantity} desc nulls first`;
        } else if (sortBy === "qty" && sortOrder === "asc") {
            que = sql`${manageStocks.quantity} asc nulls first`;
        } else {
            que = sql`${products.id} asc nulls first`;
        }
    } else {
        que = sql`${products.id} asc nulls first`;
    }

    // Apply sorting, limit, and offset
    query = query.orderBy(que)
        .limit(Number(limit))
        .offset(Number(offset));

    const results = await query.execute();

    return c.json({ totalRecords: totalRecords, data: results });
};


export const getPaginateSaleReports = async (c: Context) => {
    const { filter, limit, offset, sortBy, sortOrder, warehouseId, startDate, endDate } = c.req.query();
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
        customer: {
            id: customers.id,
            name: customers.name,
            phone: customers.phone,
            email: customers.email,
            city: customers.city,
            address: customers.address,
        },
        warehouse: {
            id: warehouses.id,
            name: warehouses.name,
            phone: warehouses.phone,
            email: warehouses.email,
            city: warehouses.city,
            address: warehouses.address,
        },
        createdAt: sales.createdAt,
        updatedAt: sales.updatedAt,
    }).from(sales)
        .innerJoin(customers, eq(customers.id, sales.customerId))
        .innerJoin(warehouses, eq(warehouses.id, sales.warehouseId))
        .where(and(
            warehouseId ? eq(sales.warehouseId, Number(warehouseId)) : sql`1 = 1`,
            between(sales.date, Number(startDate), Number(endDate))
        ));

    // Apply filter if present
    if (filter) {
        query = query.where(and(
            warehouseId ? eq(sales.warehouseId, Number(warehouseId)) : sql`1 = 1`,
            between(sales.date, Number(startDate), Number(endDate)),
            like(sales.id, `%${filter}%`)
        ));
    }

    // Get the total number of filtered records
    const subQuery = query.as("sub");
    const totalRecordsQuery = db
        .select({ total: sql<number>`count(*)` })
        .from(subQuery);
    const totalRecordsResult = await totalRecordsQuery.execute();
    const totalRecords = Number(totalRecordsResult[0]?.total || 0);

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
    return c.json({ totalRecords, data: results });
};


export const getPaginatePurchaseReports = async (c: Context) => {
    const { filter, limit, offset, sortBy, sortOrder, warehouseId, startDate, endDate } = c.req.query();
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
            address: warehouses.address,
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
        .innerJoin(suppliers, eq(suppliers.id, purchases.supplierId))
        .innerJoin(warehouses, eq(warehouses.id, purchases.warehouseId))
        .where(and(warehouseId ? eq(purchases.warehouseId, Number(warehouseId)) : sql`1 = 1`, between(purchases.date, Number(startDate), Number(endDate))));

    // Apply filter if present
    if (filter) {
        query = query.where(and(warehouseId ? eq(purchases.warehouseId, Number(warehouseId)) : sql`1 = 1`, between(purchases.date, Number(startDate), Number(endDate)), like(purchases.refCode, `%${filter}%`)));
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

type SalesData = {
    date: string; // Date in string format, e.g., "2024-11-17"
    totalSales: number; // Total sales amount
};

type PurchasesData = {
    date: string; // Date in string format, e.g., "2024-11-17"
    totalPurchases: number; // Total purchases amount
};

type CombinedData = {
    [key: string]: { sales: number; purchases: number }; // Key is date string
};

export const getWeeklySalesAndPurchases = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const currentDate = new Date();
    const endDate = currentDate.getTime();

    // Get the start date (7 days ago)
    const startDate = new Date(currentDate.setDate(currentDate.getDate() - 7)).getTime();

    // Create an array of the last 7 days, including the current day
    const dateRange = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(endDate);
        date.setDate(date.getDate() - i); // Adjust the date for each previous day
        return { date: date.toISOString().split('T')[0] }; // Format as "YYYY-MM-DD"
    }).reverse(); // Reverse to get the dates from the oldest to the newest

    // Query for sales data in the last 7 days
    const salesQuery = db
        .select({
            date: sql<string>`DATE(sales.date / 1000, 'unixepoch')`.as("date"),
            totalSales: sql<number>`SUM(sales.total_amount)`.as("totalSales"),
        })
        .from(sales)
        .where(between(sales.date, startDate, endDate))
        .groupBy(sql`DATE(sales.date / 1000, 'unixepoch')`);

    // Query for purchase data in the last 7 days
    const purchasesQuery = db
        .select({
            date: sql<string>`DATE(purchases.date / 1000, 'unixepoch')`.as("date"),
            totalPurchases: sql<number>`SUM(purchases.amount)`.as("totalPurchases"),
        })
        .from(purchases)
        .where(between(purchases.date, startDate, endDate))
        .groupBy(sql`DATE(purchases.date / 1000, 'unixepoch')`);

    // Execute both queries concurrently
    return Promise.all([salesQuery.execute(), purchasesQuery.execute()])
        .then(([salesData, purchasesData]: [SalesData[], PurchasesData[]]) => {
            // Combine the data, making sure each date is represented
            const combinedData: Record<string, { sales: number; purchases: number }> = {};

            // Initialize the combinedData with all dates set to 0 sales and 0 purchases
            dateRange.forEach(({ date }) => {
                combinedData[date] = { sales: 0, purchases: 0 };
            });

            // Populate combinedData with sales data
            salesData.forEach((item) => {
                if (combinedData[item.date]) {
                    combinedData[item.date].sales = item.totalSales;
                }
            });

            // Populate combinedData with purchase data
            purchasesData.forEach((item) => {
                if (combinedData[item.date]) {
                    combinedData[item.date].purchases = item.totalPurchases;
                }
            });

            // Convert the combined data into an array, ordered by date
            const result = Object.entries(combinedData)
                .map(([date, values]) => ({
                    date,
                    sales: values.sales,
                    purchases: values.purchases,
                }))
                .sort((a, b) => (a.date > b.date ? 1 : -1)); // Sort by date in ascending order

            return c.json(result);
        })
        .catch((error) => {
            console.error("Error fetching weekly sales and purchases data:", error);
            throw error;
        });
};

