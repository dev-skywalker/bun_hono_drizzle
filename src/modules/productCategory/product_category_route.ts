import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env } from "../../config/env";
import { productCategorySchema } from "./product_category_schema";
import { createProductCategory, deleteAllProductCategory } from "./product_category_controller";

const productCategoryRoutes = new Hono<{ Bindings: Env }>();

productCategoryRoutes.post("/", zValidator('json', productCategorySchema), createProductCategory)

productCategoryRoutes.delete("/all", deleteAllProductCategory)
export default productCategoryRoutes;