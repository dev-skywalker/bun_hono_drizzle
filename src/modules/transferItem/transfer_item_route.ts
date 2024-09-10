import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { checkPermissions } from "../../middleware/check_permission";
import { Env } from "../../config/env";
import { transferItemSchema } from "./transfer_item_schema";
import { createTransferItem, deleteAllTransferItems, deleteTransferItem, getAllTransferItems, updateTransferItem } from "./transfer_item_controller";

const transferItemRoutes = new Hono<{ Bindings: Env }>();

transferItemRoutes.post("/", zValidator("json", transferItemSchema), createTransferItem)

transferItemRoutes.put("/", updateTransferItem)

transferItemRoutes.get('/all', getAllTransferItems)

//transferItemRoutes.get('/', getPaginateTransferItems)

transferItemRoutes.delete("/", deleteTransferItem)

transferItemRoutes.delete("/all", deleteAllTransferItems)

export default transferItemRoutes;

