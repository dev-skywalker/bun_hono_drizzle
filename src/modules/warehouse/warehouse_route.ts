import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env } from "../../config/env";
import { warehouseSchema } from "./warehouse_schema";
import { createWarehouse, deleteAllWarehouses, deleteWarehouse, getAllWarehouses, getPaginateWarehouses, getWarehouse, updateWarehouse } from "./warehouse_controller";
import { checkAuth } from "../../middleware/check_permission";

const warehouseRoutes = new Hono<{ Bindings: Env }>();

warehouseRoutes.post("/", checkAuth(), zValidator("json", warehouseSchema), createWarehouse)

warehouseRoutes.put("/", checkAuth(), updateWarehouse)

warehouseRoutes.get('/all', checkAuth(), getAllWarehouses)

warehouseRoutes.get('/', checkAuth(), getPaginateWarehouses)

warehouseRoutes.get('/:id', checkAuth(), getWarehouse)

warehouseRoutes.delete("/", checkAuth(), deleteWarehouse)

warehouseRoutes.delete("/all", checkAuth(), deleteAllWarehouses)

export default warehouseRoutes;

