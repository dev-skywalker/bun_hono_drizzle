import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { checkPermissions } from "../../middleware/check_permission";
import { Env } from "../../config/env";
import { purchaseItemSchema } from "./purchase_item_schema";
import { createPurchaseItem, deleteAllPurchaseItems, deletePurchaseItem, getAllPurchaseItems, updatePurchaseItem } from "./purchase_item_controller";

const purchaseItemRoutes = new Hono<{ Bindings: Env }>();

purchaseItemRoutes.post("/", zValidator("json", purchaseItemSchema), createPurchaseItem)

purchaseItemRoutes.put("/", updatePurchaseItem)

purchaseItemRoutes.get('/all', getAllPurchaseItems)

//purchaseItemRoutes.get('/', getPaginatePurchaseItems)

purchaseItemRoutes.delete("/", deletePurchaseItem)

purchaseItemRoutes.delete("/all", deleteAllPurchaseItems)

export default purchaseItemRoutes;

