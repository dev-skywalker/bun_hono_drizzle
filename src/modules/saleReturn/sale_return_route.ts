import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env } from "../../config/env";
import { createSalesReturnWithItems, getSaleReturn, getSaleReturnWithItems } from "./sale_return_controller";
import { checkAuth } from "../../middleware/check_permission";

const saleReturnRoutes = new Hono<{ Bindings: Env }>();


saleReturnRoutes.post("/", checkAuth(), createSalesReturnWithItems)

saleReturnRoutes.get("/", checkAuth(), getSaleReturn)

saleReturnRoutes.get("/:id", checkAuth(), getSaleReturnWithItems)


export default saleReturnRoutes;

