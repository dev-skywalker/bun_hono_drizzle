import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { checkPermissions } from "../../middleware/check_permission";
import { Env } from "../../config/env";
import { transferSchema } from "./transfer_schema";
import { createTransfer, deleteAllTransfers, deleteTransfer, getAllTransfers, getPaginateTransfers, updateTransfer } from "./transfer_controller";

const transferRoutes = new Hono<{ Bindings: Env }>();

transferRoutes.post("/", zValidator("json", transferSchema), createTransfer)

transferRoutes.put("/", updateTransfer)

transferRoutes.get('/all', getAllTransfers)

transferRoutes.get('/', getPaginateTransfers)

transferRoutes.delete("/", deleteTransfer)

transferRoutes.delete("/all", deleteAllTransfers)

export default transferRoutes;

