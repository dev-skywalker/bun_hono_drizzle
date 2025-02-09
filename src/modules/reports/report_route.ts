import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env } from "../../config/env";
import { getSaleDateReport, getPurchaseByProduct, getSalesByProduct, getStockAlertItems, getTotalInventoryValue, getPurchaseDateReport, getPaginateSaleReports, getPaginatePurchaseReports, getWeeklySalesAndPurchases, getTopSellingProducts } from "./report_controller";
import { checkAuth } from "../../middleware/check_permission";

const reportRoutes = new Hono<{ Bindings: Env }>();


reportRoutes.get('/sales/total', checkAuth(), getSaleDateReport)

reportRoutes.get('/purchase/total', checkAuth(), getPurchaseDateReport)

reportRoutes.get('/sales', checkAuth(), getPaginateSaleReports)

reportRoutes.get('/purchase', checkAuth(), getPaginatePurchaseReports)

reportRoutes.get('/sales/products', checkAuth(), getSalesByProduct)

reportRoutes.get('/purchases/products', checkAuth(), getPurchaseByProduct)

reportRoutes.get('/weekly/sales', checkAuth(), getWeeklySalesAndPurchases)

reportRoutes.get('/top_selling', checkAuth(), getTopSellingProducts)

reportRoutes.get('/warehouse/total', checkAuth(), getTotalInventoryValue)

reportRoutes.get('/alerts', checkAuth(), getStockAlertItems)


export default reportRoutes;

