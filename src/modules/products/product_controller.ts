import { drizzle } from "drizzle-orm/d1";
import { brands, category, manageStocks, productCategories, products, purchases, units } from "../../db/schema";
import * as schema from "../../db/schema";
import { and, asc, desc, eq, gt, isNotNull, like, or, sql } from "drizzle-orm";

import { Context } from "hono";
import { Env } from "../../config/env";
import { SQLiteColumn } from "drizzle-orm/sqlite-core";

interface ProductData {
    name: string;
    barcode: string;
    description: string;
    stockAlert: number;
    expireDate?: number; // Optional if not all products have an expiration date
    quantityLimit?: number; // Optional if not all products have a limit
    tabletOnCard: number;
    cardOnBox: number;
    isLocalProduct: boolean;
    productCost: number;
    productPrice: number;
    unitId: number; // Assuming this is a foreign key
    brandId: number; // Assuming this is a foreign key
    catId?: number[]; // Optional array of category IDs
    imageUrl?: string; // Optional if some products may not have images
    purchaseDate: number;
    purchaseStatus: number; // e.g., 'pending', 'completed', etc.
    purchaseAmount: number;
    purchaseShipping: number;
    purchaseWarehouseId: number; // Assuming this is a foreign key
    purchaseRefCode?: string; // Optional reference code
    purchaseNote?: string; // Optional note
    supplierId: number; // Assuming this is a foreign key
    initialStockQuantity: number; // Quantity to add to the stock
    stockAlertThreshold: number; // Alert threshold for stock
}


// export const createProduct = async (c: Context<{ Bindings: Env }>) => {
//     const db = drizzle(c.env.DB);
//     //const { name, barcode, description, tabletOnCard, cardOnBox, isLocalProduct, unitId } = await c.req.json();

//     const body = await c.req.parseBody({ all: true });

//     let name = body['name'].toString();
//     let barcode = body['barcode'] ? body['barcode'].toString() : null;
//     let description = body['description'] ? body['description'].toString() : null;
//     let tabletOnCard = body['tabletOnCard'] ? Number(body['tabletOnCard']) : null;
//     let cardOnBox = body['cardOnBox'] ? Number(body['cardOnBox']) : null;

//     let isLocalProduct = body['isLocalProduct'] ? (body['isLocalProduct'] === "true") : false;

//     //let isLocalProduct = false;
//     let unitId = Number(body['unitId']);
//     let catId = body['catId[]'];

//     let imageUrl = "";

//     if (body['file']) {
//         const file = body['file'];
//         if (!Array.isArray(file)) {
//             const r2 = c.env.MY_DATA;
//             let str = name.replace(/\s+/g, '_').toLowerCase();
//             let res = str.split(",");
//             let date = Date.now().toString()
//             let key = res[0] + "-" + date
//             const result = await r2.put(key, file)
//             imageUrl = "https://cloud.pyaesone.com/" + result?.key
//         }
//     }


//     const data = {
//         name: name,
//         barcode: barcode,
//         description: description,
//         tabletOnCard: tabletOnCard,
//         cardOnBox: cardOnBox,
//         isLocalProduct: isLocalProduct,
//         unitId: unitId,
//         imageUrl: imageUrl,
//         createdAt: Date.now(),
//         updatedAt: Date.now()
//     }

//     // Insert new user
//     const newProduct: any = await db.insert(products).values(data).returning({
//         id: products.id
//     });
//     if (catId) {
//         if (Array.isArray(catId)) {
//             for (let i = 0; i < catId.length; i++) {
//                 await db.insert(productCategories).values({ productId: Number(newProduct[0].id), categoryId: Number(catId[i]) });
//             }
//         }
//     }

//     //await db.insert
//     c.status(201);
//     return c.json({ productId: Number(newProduct[0].id) });
// }

export const createProductJson = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { name, barcode, description, stockAlert, expireDate, quantityLimit, tabletOnCard, cardOnBox, isLocalProduct, productCost, productPrice, unitId, brandId, catId, imageUrl } = await c.req.json();
    const data = {
        name: name,
        barcode: barcode,
        description: description,
        tabletOnCard: tabletOnCard,
        cardOnBox: cardOnBox,
        isLocalProduct: isLocalProduct,
        productCost: productCost,
        productPrice: productPrice,
        stockAlert: stockAlert,
        quantityLimit: quantityLimit,
        expireDate: expireDate,
        unitId: unitId,
        brandId: brandId,
        imageUrl: imageUrl,
        createdAt: Date.now(),
        updatedAt: Date.now()
    }
    const newProduct: any = await db.insert(products).values(data).returning({
        id: products.id
    });
    if (newProduct.length === 0) {
        c.status(404);
        return c.json({ message: "Product not found" });
    }
    if (catId) {
        if (Array.isArray(catId)) {
            for (let i = 0; i < catId.length; i++) {
                await db.insert(productCategories).values({ productId: Number(newProduct[0].id), categoryId: Number(catId[i]) });
            }
        }
    }

    c.status(201);
    return c.json(newProduct[0]);
}


export const updateProductJson = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    const { id, name, barcode, description, stockAlert, quantityLimit, expireDate, tabletOnCard, cardOnBox, isLocalProduct, unitId, brandId, catId, imageUrl, productCost, productPrice } = await c.req.json();

    //const updatedAt = Date.now();

    // Update existing product by id
    const updatedProduct: any = await db
        .update(products)
        .set({
            name: name,
            barcode: barcode,
            description: description,
            tabletOnCard: tabletOnCard,
            cardOnBox: cardOnBox,
            isLocalProduct: isLocalProduct,
            productCost: productCost,
            productPrice: productPrice,
            stockAlert: stockAlert,
            quantityLimit: quantityLimit,
            expireDate: expireDate,
            unitId: unitId,
            brandId: brandId,
            imageUrl: imageUrl,
            updatedAt: Date.now(),
        })
        .where(eq(products.id, id))
        .returning({
            id: products.id
        });

    if (updatedProduct.length === 0) {
        c.status(404);
        return c.json({ message: "Product not found" });
    }

    // Update product categories if provided
    if (catId && Array.isArray(catId)) {
        // Remove existing categories for the product
        await db.delete(productCategories).where(eq(productCategories.productId, id));

        // Insert the new categories
        for (let i = 0; i < catId.length; i++) {
            await db.insert(productCategories).values({ productId: Number(id), categoryId: Number(catId[i]) });
        }
    }

    c.status(200);
    return c.json(updatedProduct[0]);
}


export const getAllProducts = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const result = await db.select().from(products).all();
    return c.json(result);
}


export const getAllProductCategory = async (c: Context) => {
    const db = drizzle(c.env.DB, { schema });
    const { filter, limit, offset, sortBy, sortOrder } = c.req.query();

    // Define the filter criteria


    const whereOptions = like(products.name, `%${filter}%`);


    // Sorting
    let que;
    if (sortBy && sortOrder) {
        if (sortBy === "name" && sortOrder === "desc") {
            que = desc(products.name)
        } else if (sortBy === "name" && sortOrder === "asc") {
            que = asc(products.name)
        } else if (sortBy === "id" && sortOrder === "desc") {
            que = desc(products.id)
        } else if (sortBy === "id" && sortOrder === "asc") {
            que = asc(products.id)
        }
        else if (sortBy === "expire" && sortOrder === "desc") {
            que = desc(products.expireDate)
        } else if (sortBy === "expire" && sortOrder === "asc") {
            que = asc(products.expireDate)
        } else {
            que = desc(products.id)
        }
    } else {
        que = desc(products.id)
    }


    // Execute both the data query and count query concurrently
    const [response, countResult] = await Promise.all([
        // Query to get the filtered products with specific columns
        db.query.products.findMany({

            where: filter ? whereOptions : undefined,
            offset: Number(offset),
            limit: Number(limit), // Pagination, get first 10 results
            orderBy: [que],
            with: {
                unit: true,
                brand: true,
                productCategories: {
                    columns: {},
                    with: {

                        category: true
                    }
                }
            }
        }),

        // Query to get the total count of filtered products
        db.select({
            count: sql<number>`cast(count(${products.id}) as integer)`
        })
            .from(products)
            .where(filter ? whereOptions : undefined)
    ]);

    // Extract the count from the countResult
    const totalCount = countResult[0]?.count ?? 0;

    // Returning both the filtered data and the total row count
    return c.json({
        totalRecords: totalCount,
        data: response

    });
};

export const getProduct = async (c: Context) => {
    const { id } = c.req.param();
    const db = drizzle(c.env.DB, { schema });

    // const query = await db.select().from(products).where(eq(products.id, Number(id)));
    // if (query.length === 0) {
    //     c.status(404);
    //     return c.json({ message: "Product not found" });
    // }

    const query = await db.query.products.findMany({
        where: (products, { eq }) => eq(products.id, Number(id)),
        with: {
            unit: true,
            brand: true,
            productCategories: {
                columns: {},
                with: {
                    category: true
                }
            }
        }
    });

    if (query.length === 0) {
        c.status(404);
        return c.json({ message: "Product not found" });
    }

    return c.json(query[0])
}


export const searchProductsInWarehouse = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const { warehouseId, searchTerm } = c.req.query();
    const result = await db.select({
        productId: products.id,
        productName: products.name,
        productCost: products.productCost,
        productPrice: products.productPrice,
        unit: units.name,
        imageUrl: products.imageUrl,
        warehouseStock: sql`COALESCE(${manageStocks.quantity}, 0)` // Set 0 if stock is null
    })
        .from(products)
        .leftJoin(manageStocks, and(
            eq(products.id, manageStocks.productId),
            eq(manageStocks.warehouseId, Number(warehouseId)) // Filter by selected warehouse
        )).leftJoin(units, eq(products.unitId, units.id))
        .where(
            like(products.name, `%${searchTerm}%`) // Search by product name
        );

    return c.json(result);
}

export const searchSaleProductsInWarehouse = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const { warehouseId, searchTerm } = c.req.query();

    // Ensure `warehouseId` is specified and parse it as an integer.
    const warehouseFilterId = Number(warehouseId);

    const result = await db.select({
        productId: products.id,
        productName: products.name,
        productCost: products.productCost,
        productPrice: products.productPrice,
        unit: units.name,
        imageUrl: products.imageUrl,
        warehouseStock: sql`COALESCE(${manageStocks.quantity}, 0)` // Set to 0 if stock is null
    })
        .from(products)
        .leftJoin(manageStocks, and(
            eq(products.id, manageStocks.productId),
            eq(manageStocks.warehouseId, warehouseFilterId) // Filter by selected warehouse
        ))
        .leftJoin(units, eq(products.unitId, units.id))
        .where(
            and(
                eq(manageStocks.warehouseId, warehouseFilterId), // Only items in the selected warehouse
                like(products.name, `%${searchTerm}%`) // Search by product name
            )
        );

    return c.json(result);
}


export const getPaginateWarehouseStock = async (c: Context) => {
    const { warehouseId, filter, limit, offset, sortBy, sortOrder } = c.req.query();
    const db = drizzle(c.env.DB);

    // Base query
    let query: any = db.select({
        productId: products.id,
        productName: products.name,
        productCost: products.productCost,
        productPrice: products.productPrice,
        expireDate: products.expireDate,
        warehouseStock: manageStocks.quantity, // Quantity in the specified warehouse
        unit: units.name
    })
        .from(products)
        .leftJoin(units, eq(units.id, products.unitId))
        .leftJoin(manageStocks,
            and(
                eq(manageStocks.productId, products.id),
                eq(manageStocks.warehouseId, Number(warehouseId))
            )
        )
        .where(
            or(
                eq(manageStocks.warehouseId, Number(warehouseId)), // Ensure only products in the selected warehouse
                isNotNull(manageStocks.quantity)                    // Exclude products without stock record in this warehouse
            )
        );

    // Apply filter if present
    if (filter) {
        query = query.where(and(isNotNull(manageStocks.quantity), like(products.name, `%${filter}%`)));
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
        } else if (sortBy === "qty" && sortOrder === "desc") {
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
}



export const deleteProduct = async (c: Context) => {
    const { id } = await c.req.json();
    const db = drizzle(c.env.DB);

    try {
        // Step 1: Delete related entries in productCategories


        // Step 2: Delete the product from products table
        const productDelete = await db.delete(products)
            .where(eq(products.id, Number(id)))
            .returning({ deletedId: products.id });

        const categoryDelete = await db.delete(productCategories)
            .where(eq(productCategories.productId, Number(id)))
            .execute();



        if (productDelete.length === 0) {
            c.status(404);
            return c.json({ message: "Product not found" });
        }

        return c.json({ status: "success", message: "Product deleted successfully", deletedProductId: productDelete[0].deletedId, deletedCategoryId: categoryDelete });
    } catch (error) {
        console.error("Error deleting product:", error);
        c.status(500);
        return c.json({ message: "Failed to delete product", error: error });
    }
};



export const deleteAllProducts = async (c: Context) => {
    const db = drizzle(c.env.DB);
    await db.delete(products).execute();

    c.status(200);
    return c.json({ message: "All product deleted successfully" });
}



export const getPaginateProducts = async (c: Context) => {
    const { filter, limit, offset, sortBy, sortOrder } = c.req.query();
    const db = drizzle(c.env.DB);

    // Base query
    let query: any = db.select().from(products);

    // Apply filter if present
    if (filter) {
        query = query.where(like(products.name, `%${filter}%`));
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
        } else {
            que = sql`${products.id} asc nulls first`;
        }
    } else {
        que = sql`${products.id} asc nulls first`;
    }

    // Apply sorting, limit, and offset
    query = query
        .innerJoin(units, eq(products.unitId, units.id))
        .innerJoin(brands, eq(products.brandId, brands.id))
        .orderBy(que)
        .limit(Number(limit))
        .offset(Number(offset));


    const results = await query.execute();

    //Transform data
    const transformedData: any = {
        totalRecords: totalRecords,
        data: results.map((item: any) => ({
            id: item.products.id,
            name: item.products.name,
            barcode: item.products.barcode,
            description: item.products.description,
            imageUrl: item.products.imageUrl,
            tabletOnCard: item.products.tabletOnCard,
            cardOnBox: item.products.cardOnBox,
            isLocalProduct: item.products.isLocalProduct,
            unitId: item.products.unitId,
            createdAt: item.products.createdAt,
            updatedAt: item.products.updatedAt,
            units: item.units,
            category: item.productCategories
        })),
    };

    return c.json(transformedData);
};

// function coalesce(quantity: SQLiteColumn<{ name: "quantity"; tableName: "manageStocks"; dataType: "number"; columnType: "SQLiteInteger"; data: number; driverParam: number; notNull: true; hasDefault: false; enumValues: undefined; baseColumn: never; }, object>, arg1: number): any {
//     throw new Error("Function not implemented.");
// }

