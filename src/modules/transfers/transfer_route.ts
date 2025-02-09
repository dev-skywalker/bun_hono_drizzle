import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env } from "../../config/env";
import { transferSchema } from "./transfer_schema";
import { createLostDamagedItem, createTransfer, createTransferWithItems, deleteAllTransfers, deleteTransfer, getAllTransfers, getPaginateTransfers, getTransferWithItems, updateTransfer } from "./transfer_controller";
import { createTransferItem } from "../transferItem/transfer_item_controller";
import { checkAuth } from "../../middleware/check_permission";

const transferRoutes = new Hono<{ Bindings: Env }>();

transferRoutes.post("/", checkAuth(), zValidator("json", transferSchema), createTransfer)

transferRoutes.post("/items", checkAuth(), createTransferWithItems)

transferRoutes.post("/lost", checkAuth(), createLostDamagedItem)

transferRoutes.get('/:id', checkAuth(), getTransferWithItems)

transferRoutes.put("/", checkAuth(), updateTransfer)

transferRoutes.get('/all', checkAuth(), getAllTransfers)

transferRoutes.get('/', checkAuth(), getPaginateTransfers)

transferRoutes.delete("/", checkAuth(), deleteTransfer)

transferRoutes.delete("/all", checkAuth(), deleteAllTransfers)

export default transferRoutes;

