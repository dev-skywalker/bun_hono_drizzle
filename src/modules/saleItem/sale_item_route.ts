import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env } from "../../config/env";
import { saleItemSchema } from "./sale_item_schema";
import { createSaleItem, deleteAllSaleItems, deleteSaleItem, getAllSaleItems, updateSaleItem } from "./sale_item_controller";
import { checkAuth } from "../../middleware/check_permission";

const saleItemRoutes = new Hono<{ Bindings: Env }>();

saleItemRoutes.post("/", checkAuth(), zValidator("json", saleItemSchema), createSaleItem)

saleItemRoutes.put("/", checkAuth(), updateSaleItem)

saleItemRoutes.get('/all', checkAuth(), getAllSaleItems)

//saleItemRoutes.get('/', getPaginateSaleItems)

saleItemRoutes.delete("/", checkAuth(), deleteSaleItem)

saleItemRoutes.delete("/all", checkAuth(), deleteAllSaleItems)

export default saleItemRoutes;

