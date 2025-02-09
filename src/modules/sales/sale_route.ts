import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env } from "../../config/env";
import { saleSchema } from "./sale_schema";
import { createSaleWithItems, deleteAllSales, deleteSale, getAllSales, getPaginateSales, getSaleDetails, getSaleWithItems, updateSale, updateSaleWithItems } from "./sale_controller";
import { checkAuth } from "../../middleware/check_permission";

const saleRoutes = new Hono<{ Bindings: Env }>();

//saleRoutes.post("/", zValidator("json", saleSchema), createSale)

saleRoutes.post("/items", checkAuth(), createSaleWithItems)

saleRoutes.put("/", checkAuth(), updateSale)

saleRoutes.put("/items", checkAuth(), updateSaleWithItems)

saleRoutes.get('/all', checkAuth(), getAllSales)

saleRoutes.get('/', checkAuth(), getPaginateSales)

saleRoutes.get('/:id', checkAuth(), getSaleDetails)

saleRoutes.get('/items/:id', checkAuth(), getSaleWithItems)

saleRoutes.delete("/", checkAuth(), deleteSale)

saleRoutes.delete("/all", checkAuth(), deleteAllSales)

export default saleRoutes;

