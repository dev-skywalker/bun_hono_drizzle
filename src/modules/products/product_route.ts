import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env } from "../../config/env";
import { createProductJson, deleteAllProducts, deleteProduct, getAllProductCategory, getAllProducts, getPaginateProducts, getPaginateWarehouseStock, getProduct, searchProductsInWarehouse, searchSaleProductsInWarehouse, updateProductJson } from "./product_controller";
import { productSchema } from "./product_schema";
import { checkAuth } from "../../middleware/check_permission";

const productRoutes = new Hono<{ Bindings: Env }>();

productRoutes.post("/", checkAuth(), zValidator('json', productSchema), createProductJson)

productRoutes.put("/", checkAuth(), updateProductJson)

productRoutes.get('/all', checkAuth(), getAllProducts)

productRoutes.get('/', checkAuth(), getAllProductCategory)

productRoutes.get('/stock', checkAuth(), getPaginateWarehouseStock)

productRoutes.get('/search', checkAuth(), searchProductsInWarehouse)

productRoutes.get('/sales/search', checkAuth(), searchSaleProductsInWarehouse)

productRoutes.get('/:id', checkAuth(), getProduct)

productRoutes.get('/paginate', checkAuth(), getPaginateProducts)

productRoutes.delete("/", checkAuth(), deleteProduct)

productRoutes.delete("/all", checkAuth(), deleteAllProducts)

export default productRoutes;

