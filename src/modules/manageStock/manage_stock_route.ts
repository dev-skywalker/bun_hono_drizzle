import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { checkPermissions } from "../../middleware/check_permission";
import { Env } from "../../config/env";
import { manageStockSchema } from "./manage_stock_schema";
import { createManageStock, deleteAllManageStocks, deleteManageStock, getAllManageStocks, updateManageStock } from "./manage_stock_controller";

const manageStockRoutes = new Hono<{ Bindings: Env }>();

manageStockRoutes.post("/", zValidator("json", manageStockSchema), createManageStock)

manageStockRoutes.put("/", updateManageStock)

manageStockRoutes.get('/all', getAllManageStocks)

//unitRoutes.get('/', getPaginateUnits)

manageStockRoutes.delete("/", deleteManageStock)

manageStockRoutes.delete("/all", deleteAllManageStocks)

export default manageStockRoutes;

