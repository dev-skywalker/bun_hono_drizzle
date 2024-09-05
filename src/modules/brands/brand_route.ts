import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { checkPermissions } from "../../middleware/check_permission";
import { Env } from "../../config/env";
import { brandSchema } from "./brand_schema";
import { createBrand, deleteAllBands, deleteBrand, getAllBrands, getPaginateBrands, updateBrand } from "./brand_controller";

const brandRoutes = new Hono<{ Bindings: Env }>();

brandRoutes.post("/", zValidator("json", brandSchema), createBrand)

brandRoutes.put("/", updateBrand)

brandRoutes.get('/all', getAllBrands)

brandRoutes.get('/', getPaginateBrands)

brandRoutes.delete("/", deleteBrand)

brandRoutes.delete("/all", deleteAllBands)

export default brandRoutes;

