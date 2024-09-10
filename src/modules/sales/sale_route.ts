import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { checkPermissions } from "../../middleware/check_permission";
import { Env } from "../../config/env";
import { saleSchema } from "./sale_schema";
import { createSale, deleteAllSales, deleteSale, getAllSales, getPaginateSales, updateSale } from "./sale_controller";

const saleRoutes = new Hono<{ Bindings: Env }>();

saleRoutes.post("/", zValidator("json", saleSchema), createSale)

saleRoutes.put("/", updateSale)

saleRoutes.get('/all', getAllSales)

saleRoutes.get('/', getPaginateSales)

saleRoutes.delete("/", deleteSale)

saleRoutes.delete("/all", deleteAllSales)

export default saleRoutes;

