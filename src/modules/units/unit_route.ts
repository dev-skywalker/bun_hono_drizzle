import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { checkPermissions } from "../../middleware/check_permission";
import { Env } from "../../config/env";
import { unitSchema } from "./unit_schema";
import { createUnit, deleteAllUnits, deleteUnit, getAllUnits, getPaginateUnits, updateUnit } from "./unit_controller";

const unitRoutes = new Hono<{ Bindings: Env }>();

unitRoutes.post("/", zValidator("json", unitSchema), createUnit)

unitRoutes.put("/", updateUnit)

unitRoutes.get('/all', getAllUnits)

unitRoutes.get('/', getPaginateUnits)

unitRoutes.delete("/", deleteUnit)

unitRoutes.delete("/all", deleteAllUnits)

export default unitRoutes;

