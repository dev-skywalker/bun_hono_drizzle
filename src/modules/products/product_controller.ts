import { drizzle } from "drizzle-orm/d1";
import { products, units } from "../../db/schema";
import { eq, like, sql } from "drizzle-orm";
import { Context } from "hono";
import { Env } from "../../config/env";

export const createProduct = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);
    //const { name, barcode, description, tabletOnCard, cardOnBox, isLocalProduct, unitId } = await c.req.json();

    const body = await c.req.parseBody();

    let name = body['name'].toString();
    let barcode = body['barcode'] ? body['barcode'].toString() : null;
    let description = body['description'] ? body['description'].toString() : null;
    let tabletOnCard = body['tabletOnCard'] ? Number(body['tabletOnCard']) : null;
    let cardOnBox = body['cardOnBox'] ? Number(body['cardOnBox']) : null;

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
        imageUrl: imageUrl,
        createdAt: Date.now(),
        updatedAt: Date.now()
    }

    // Insert new user
    const newProduct: any = await db.insert(products).values(data).returning({
        id: products.id, name: products.name, imageUrl: products.imageUrl, createdAt: products.createdAt, updatedAt: products.updatedAt
    });
    c.status(201);
    return c.json(newProduct);
}


export const getAllProducts = async (c: Context) => {
    const db = drizzle(c.env.DB);
    const result = await db.select().from(products).all();
    return c.json(result);
}

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

// export const getPaginateProducts = async (c: Context) => {
//     const { filter, limit, offset, sortBy, sortOrder } = c.req.query();
//     const db = drizzle(c.env.DB);

//     const query = db.select().from(products);
//     const subQuery = query.as("sub");
//     const totalRecordsQuery = db
//         .select({ total: sql<number>`count(*)` })
//         .from(subQuery);


//     const totalRecordsResult = await totalRecordsQuery.execute();
//     const totalRecords = Number(totalRecordsResult[0].total);

//     let que;
//     if (sortBy && sortOrder) {
//         if (sortBy === "name" && sortOrder === "desc") {
//             que = sql`${products.name} desc nulls first`;
//         } else if (sortBy === "name" && sortOrder === "asc") {
//             que = sql`${products.name} asc nulls first`;
//         } else if (sortBy === "id" && sortOrder === "desc") {
//             que = sql`${products.id} desc nulls first`;
//         } else if (sortBy === "id" && sortOrder === "asc") {
//             que = sql`${products.id} asc nulls first`;
//         } else {
//             que = sql`${products.id} asc nulls first`;
//         }
//     } else {
//         que = sql`${products.id} asc nulls first`;
//     }

//     if (filter) {
//         query.where(like(products.name, `%${filter}%`));
//     }

//     query.innerJoin(units, eq(products.unitId, units.id)).orderBy(que)
//         .limit(Number(limit))
//         .offset(Number(offset));

//     const results = await query.execute();

//     const originalData: any = {
//         data: results,
//         totalRecords: totalRecords,
//     };

//     const transformedData: any = {
//         totalRecords: totalRecords,
//         data: originalData.data.map((item: any) => ({
//             id: item.products.id,
//             name: item.products.name,
//             barcode: item.products.barcode,
//             description: item.products.description,
//             imageUrl: item.products.imageUrl,
//             tabletOnCard: item.products.tabletOnCard,
//             cardOnBox: item.products.cardOnBox,
//             isLocalProduct: item.products.isLocalProduct,
//             unitId: item.products.unitId,
//             createdAt: item.products.createdAt,
//             updatedAt: item.products.updatedAt,
//             units: item.units
//         })),

//     };

//     return c.json(transformedData);
// }


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

    // Transform data
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
            units: item.units
        })),
    };

    return c.json(transformedData);
};

