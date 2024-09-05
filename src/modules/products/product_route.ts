import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env } from "../../config/env";
import { createProductJson, deleteAllProducts, deleteProduct, getAllProductCategory, getAllProducts, getPaginateProducts, updateProductJson } from "./product_controller";
import { productSchema } from "./product_schema";

const productRoutes = new Hono<{ Bindings: Env }>();

productRoutes.post("/", zValidator('json', productSchema), createProductJson)

productRoutes.put("/", updateProductJson)

productRoutes.get('/all', getAllProducts)

productRoutes.get('/', getAllProductCategory)

productRoutes.get('/paginate', getPaginateProducts)

productRoutes.delete("/", deleteProduct)

productRoutes.delete("/all", deleteAllProducts)

export default productRoutes;

