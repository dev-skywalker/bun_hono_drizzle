import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
// import { checkPermissions } from "../../middleware/check_permission";
import { Env } from "../../config/env";
import { createPurchaseReturnWithItems, getPurchaseReturn, getPurchaseReturnWithItems } from "./purchase_return_controller";
import { checkAuth } from "../../middleware/check_permission";

const purchaseReturnRoutes = new Hono<{ Bindings: Env }>();


purchaseReturnRoutes.post("/", checkAuth(), createPurchaseReturnWithItems)

purchaseReturnRoutes.get("/", checkAuth(), getPurchaseReturn)

purchaseReturnRoutes.get("/:id", checkAuth(), getPurchaseReturnWithItems)


export default purchaseReturnRoutes;

