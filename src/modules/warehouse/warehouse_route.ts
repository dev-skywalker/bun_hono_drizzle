import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { checkPermissions } from "../../middleware/check_permission";
import { Env } from "../../config/env";
import { warehouseSchema } from "./warehouse_schema";
import { createWarehouse, deleteAllWarehouses, deleteWarehouse, getAllWarehouses, getPaginateWarehouses, updateWarehouse } from "./warehouse_controller";

const warehouseRoutes = new Hono<{ Bindings: Env }>();

warehouseRoutes.post("/", zValidator("json", warehouseSchema), createWarehouse)

warehouseRoutes.put("/", updateWarehouse)

warehouseRoutes.get('/all', getAllWarehouses)

warehouseRoutes.get('/', getPaginateWarehouses)

warehouseRoutes.delete("/", deleteWarehouse)

warehouseRoutes.delete("/all", deleteAllWarehouses)

export default warehouseRoutes;

