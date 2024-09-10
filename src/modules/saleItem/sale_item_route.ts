import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { checkPermissions } from "../../middleware/check_permission";
import { Env } from "../../config/env";
import { saleItemSchema } from "./sale_item_schema";
import { createSaleItem, deleteAllSaleItems, deleteSaleItem, getAllSaleItems, updateSaleItem } from "./sale_item_controller";

const saleItemRoutes = new Hono<{ Bindings: Env }>();

saleItemRoutes.post("/", zValidator("json", saleItemSchema), createSaleItem)

saleItemRoutes.put("/", updateSaleItem)

saleItemRoutes.get('/all', getAllSaleItems)

//saleItemRoutes.get('/', getPaginateSaleItems)

saleItemRoutes.delete("/", deleteSaleItem)

saleItemRoutes.delete("/all", deleteAllSaleItems)

export default saleItemRoutes;

