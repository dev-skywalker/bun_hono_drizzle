import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { checkPermissions } from "../../middleware/check_permission";
import { Env } from "../../config/env";
import { createProduct, deleteAllProducts, deleteProduct, getAllProducts, getPaginateProducts } from "./product_controller";
import { productSchema } from "./product_schema";

const productRoutes = new Hono<{ Bindings: Env }>();

productRoutes.post("/", zValidator('form', productSchema), createProduct)

productRoutes.get('/all', getAllProducts)

productRoutes.get('/', getPaginateProducts)

productRoutes.delete("/", deleteProduct)

productRoutes.delete("/all", deleteAllProducts)

export default productRoutes;

