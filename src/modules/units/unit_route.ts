import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { checkAuth } from "../../middleware/check_permission";
import { Env } from "../../config/env";
import { unitSchema } from "./unit_schema";
import { createUnit, deleteAllUnits, deleteUnit, getAllUnits, getPaginateUnits, getUnit, updateUnit } from "./unit_controller";

const unitRoutes = new Hono<{ Bindings: Env }>();

unitRoutes.post("/", checkAuth(), zValidator("json", unitSchema), createUnit)

unitRoutes.put("/", checkAuth(), updateUnit)

unitRoutes.get('/all', checkAuth(), getAllUnits)

unitRoutes.get('/', checkAuth(), getPaginateUnits)

unitRoutes.get('/:id', checkAuth(), getUnit)

unitRoutes.delete("/", checkAuth(), deleteUnit)

unitRoutes.delete("/all", checkAuth(), deleteAllUnits)

export default unitRoutes;

