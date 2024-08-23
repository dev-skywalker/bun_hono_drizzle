import { drizzle } from "drizzle-orm/d1";
import { category, productCategories, products, units } from "../../db/schema";
import * as schema from "../../db/schema";
import { asc, desc, eq, like, sql } from "drizzle-orm";
import { Context } from "hono";
import { Env } from "../../config/env";

export const createProduct = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    //const { name, barcode, description, tabletOnCard, cardOnBox, isLocalProduct, unitId } = await c.req.json();

    const body = await c.req.parseBody({ all: true });

    let name = body['name'].toString();
    let barcode = body['barcode'] ? body['barcode'].toString() : null;
    let description = body['description'] ? body['description'].toString() : null;
    let tabletOnCard = body['tabletOnCard'] ? Number(body['tabletOnCard']) : null;
    let cardOnBox = body['cardOnBox'] ? Number(body['cardOnBox']) : null;

    let isLocalProduct = body['isLocalProduct'] ? (body['isLocalProduct'] === "true") : false;

    //let isLocalProduct = false;
    let unitId = Number(body['unitId']);
    let catId = body['catId[]'];

    let imageUrl = "";

    if (body['file']) {
        const file = body['file'];
        if (!Array.isArray(file)) {
            const r2 = c.env.MY_DATA;
            let str = name.replace(/\s+/g, '_').toLowerCase();
            let res = str.split(",");
            let date = Date.now().toString()
            let key = res[0] + "-" + date
            const result = await r2.put(key, file)
            imageUrl = "https://cloud.pyaesone.com/" + result?.key
        }
    }


    const data = {
        name: name,
        barcode: barcode,
        description: description,
        tabletOnCard: tabletOnCard,
        cardOnBox: cardOnBox,
        isLocalProduct: isLocalProduct,
        unitId: unitId,
        imageUrl: imageUrl,
        createdAt: Date.now(),
        updatedAt: Date.now()
    }

    // Insert new user
    const newProduct: any = await db.insert(products).values(data).returning({
        id: products.id
    });
    if (catId) {
        if (Array.isArray(catId)) {
            for (let i = 0; i < catId.length; i++) {
                await db.insert(productCategories).values({ productId: Number(newProduct[0].id), categoryId: Number(catId[i]) });
            }
        }
    }

    //await db.insert
    c.status(201);
    return c.json({ productId: Number(newProduct[0].id) });
}


export const updateProduct = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    //const { name, barcode, description, tabletOnCard, cardOnBox, isLocalProduct, unitId } = await c.req.json();

    const body = await c.req.parseBody();

    let id = Number(body['id']);
    let createdAt = Number(body['createdAt']);
    let name = body['name'].toString();
    let barcode = body['barcode'] ? body['barcode'].toString() : null;
    let description = body['description'] ? body['description'].toString() : null;
    let tabletOnCard = body['tabletOnCard'] ? Number(body['tabletOnCard']) : null;
    let cardOnBox = body['cardOnBox'] ? Number(body['cardOnBox']) : null;
    let image = body['imageUrl'] ? body['imageUrl'].toString() : null;

    let isLocalProduct = body['isLocalProduct'] ? (body['isLocalProduct'] === "true") : false;

    //let isLocalProduct = false;
    let unitId = Number(body['unitId']);

    let imageUrl = "";

    if (body['file']) {
        const file = body['file'];
        const r2 = c.env.MY_DATA;
        let str = name.replace(/\s+/g, '_').toLowerCase();
        let res = str.split(",");
        let date = Date.now().toString()
        let key = res[0] + "-" + date
        const result = await r2.put(key, file)
        imageUrl = "https://cloud.pyaesone.com/" + result?.key

    }

    const data = {
        name: name,
        barcode: barcode,
        description: description,
        tabletOnCard: tabletOnCard,
        cardOnBox: cardOnBox,
        isLocalProduct: isLocalProduct,
        unitId: unitId,
        imageUrl: image != null ? image : imageUrl,
        createdAt: createdAt,
        updatedAt: Date.now()
    }

    // Insert new user
    const updateProduct: any = await db.update(products).set(data).where(eq(products.id, id)).returning({
        id: products.id, name: products.name, imageUrl: products.imageUrl, createdAt: products.createdAt, updatedAt: products.updatedAt
    });
    c.status(201);
    return c.json(updateProduct);
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


export const deleteProduct = async (c: Context) => {
    const { id } = await c.req.json();
    // let id = Number(body['id']);
    const db = drizzle(c.env.DB);

    const query = await db.delete(products).where(eq(products.id, id)).returning({ deletedId: products.id });
    return c.json(query)
}


export const deleteAllProducts = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const result = await db.select().from(products).all();
    result.map(async (i) => {
        await db.delete(products).where(eq(products.id, i.id));
    })
    return c.json({ message: "OK" });
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

