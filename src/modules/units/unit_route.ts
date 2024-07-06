import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { checkPermissions } from "../../middleware/check_permission";
import { Env } from "../../config/env";
import { unitSchema } from "./unit_schema";
import { createUnit, deleteAllUnits, deleteUnit, getAllUnits } from "./unit_controller";

const unitRoutes = new Hono<{ Bindings: Env }>();

unitRoutes.post("/", zValidator("json", unitSchema), createUnit)

unitRoutes.get('/', getAllUnits)

unitRoutes.delete("/", deleteUnit)

unitRoutes.delete("/all", deleteAllUnits)

export default unitRoutes;

