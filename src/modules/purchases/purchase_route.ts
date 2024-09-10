import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { checkPermissions } from "../../middleware/check_permission";
import { Env } from "../../config/env";
import { purchaseSchema } from "./purchase_schema";
import { createPurchase, deleteAllPurchases, deletePurchase, getAllPurchases, getPaginatePurchases, updatePurchase } from "./purchase_controller";

const purchaseRoutes = new Hono<{ Bindings: Env }>();

purchaseRoutes.post("/", zValidator("json", purchaseSchema), createPurchase)

purchaseRoutes.put("/", updatePurchase)

purchaseRoutes.get('/all', getAllPurchases)

purchaseRoutes.get('/', getPaginatePurchases)

purchaseRoutes.delete("/", deletePurchase)

purchaseRoutes.delete("/all", deleteAllPurchases)

export default purchaseRoutes;

