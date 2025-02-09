import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env } from "../../config/env";
import { productCategorySchema } from "./product_category_schema";
import { createProductCategory, deleteAllProductCategory } from "./product_category_controller";
import { checkAuth } from "../../middleware/check_permission";

const productCategoryRoutes = new Hono<{ Bindings: Env }>();

productCategoryRoutes.post("/", checkAuth(), zValidator('json', productCategorySchema), createProductCategory)

productCategoryRoutes.delete("/all", checkAuth(), deleteAllProductCategory)
export default productCategoryRoutes;