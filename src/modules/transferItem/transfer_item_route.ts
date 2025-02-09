import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env } from "../../config/env";
import { transferItemSchema } from "./transfer_item_schema";
import { createTransferItem, deleteAllTransferItems, deleteTransferItem, getAllTransferItems, updateTransferItem } from "./transfer_item_controller";
import { getTransferWithItems } from "../transfers/transfer_controller";
import { checkAuth } from "../../middleware/check_permission";

const transferItemRoutes = new Hono<{ Bindings: Env }>();

transferItemRoutes.post("/", checkAuth(), zValidator("json", transferItemSchema), createTransferItem)

transferItemRoutes.put("/", checkAuth(), updateTransferItem)

transferItemRoutes.get('/all', checkAuth(), getAllTransferItems)

//transferItemRoutes.get('/', getPaginateTransferItems)

transferItemRoutes.delete("/", checkAuth(), deleteTransferItem)

transferItemRoutes.delete("/all", checkAuth(), deleteAllTransferItems)

export default transferItemRoutes;

