import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env } from "../../config/env";
import { manageStockSchema } from "./manage_stock_schema";
import { createManageStock, deleteAllManageStocks, deleteManageStock, getAllManageStocks, getWarehouseStockLevels, updateManageStock } from "./manage_stock_controller";
import { checkAuth } from "../../middleware/check_permission";

const manageStockRoutes = new Hono<{ Bindings: Env }>();

manageStockRoutes.post("/", checkAuth(), zValidator("json", manageStockSchema), createManageStock)

manageStockRoutes.put("/", checkAuth(), updateManageStock)

manageStockRoutes.get('/all', checkAuth(), getAllManageStocks)

manageStockRoutes.get('/warehouse', checkAuth(), getWarehouseStockLevels)

//unitRoutes.get('/', getPaginateUnits)

manageStockRoutes.delete("/", checkAuth(), deleteManageStock)

manageStockRoutes.delete("/all", checkAuth(), deleteAllManageStocks)

export default manageStockRoutes;

