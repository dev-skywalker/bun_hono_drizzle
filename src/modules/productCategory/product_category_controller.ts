import { Context } from "hono";
import { Env } from "../../config/env";
import { drizzle } from "drizzle-orm/d1";
import { productCategories } from "../../db/schema";

export const createProductCategory = async (c: Context<{ Bindings: Env }>) => {
    const db = drizzle(c.env.DB);

    const { productId, categoryId } = await c.req.json();


    const data = {
        productId: productId,
        categoryId: categoryId,
        createdAt: Date.now(),
        updatedAt: Date.now()
    }

    // Insert new user
    const newProduct: any = await db.insert(productCategories).values(data).returning({
        productId: productCategories.productId,
        categoryId: productCategories.categoryId
    });

    if (newProduct.length === 0) {
        c.status(404);
        return c.json({ message: "Product Category not found" });
    }

    //await db.insert
    c.status(201);
    return c.json(newProduct[0]);
}

export const deleteAllProductCategory = async (c: Context) => {
    const db = drizzle(c.env.DB);
    await db.delete(productCategories).execute();

    c.status(200);
    return c.json({ message: "All product category deleted successfully" });
}