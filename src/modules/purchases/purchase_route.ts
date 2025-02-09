import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env } from "../../config/env";
import { purchaseSchema } from "./purchase_schema";
import { createPurchase, createPurchaseWithItems, deleteAllPurchases, deletePurchase, getAllPurchases, getPaginatePurchases, getPurchaseWithItems, updatePurchase, updatePurchaseWithItems } from "./purchase_controller";
import { checkAuth } from "../../middleware/check_permission";

const purchaseRoutes = new Hono<{ Bindings: Env }>();

purchaseRoutes.post("/", checkAuth(), zValidator("json", purchaseSchema), createPurchase)


purchaseRoutes.post("/items", checkAuth(), createPurchaseWithItems)

purchaseRoutes.put("/", checkAuth(), updatePurchase)

purchaseRoutes.put("/items", checkAuth(), updatePurchaseWithItems)

purchaseRoutes.get('/all', checkAuth(), getAllPurchases)

purchaseRoutes.get('/', checkAuth(), getPaginatePurchases)

purchaseRoutes.get('/:id', checkAuth(), getPurchaseWithItems)

purchaseRoutes.delete("/", checkAuth(), deletePurchase)

purchaseRoutes.delete("/all", checkAuth(), deleteAllPurchases)

export default purchaseRoutes;

