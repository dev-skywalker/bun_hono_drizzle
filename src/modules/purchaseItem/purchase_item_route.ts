import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env } from "../../config/env";
import { purchaseItemSchema } from "./purchase_item_schema";
import { createPurchaseItem, deleteAllPurchaseItems, deletePurchaseItem, getAllPurchaseItems, updatePurchaseItem } from "./purchase_item_controller";
import { checkAuth } from "../../middleware/check_permission";

const purchaseItemRoutes = new Hono<{ Bindings: Env }>();

purchaseItemRoutes.post("/", checkAuth(), zValidator("json", purchaseItemSchema), createPurchaseItem)

purchaseItemRoutes.put("/", checkAuth(), updatePurchaseItem)

purchaseItemRoutes.get('/all', checkAuth(), getAllPurchaseItems)

//purchaseItemRoutes.get('/', getPaginatePurchaseItems)

purchaseItemRoutes.delete("/", checkAuth(), deletePurchaseItem)

purchaseItemRoutes.delete("/all", checkAuth(), deleteAllPurchaseItems)

export default purchaseItemRoutes;

