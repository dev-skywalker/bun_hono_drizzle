import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env } from "../../config/env";
import { brandSchema } from "./brand_schema";
import { createBrand, deleteAllBands, deleteBrand, getAllBrands, getBrand, getPaginateBrands, updateBrand } from "./brand_controller";
import { checkAuth } from "../../middleware/check_permission";

const brandRoutes = new Hono<{ Bindings: Env }>();

brandRoutes.post("/", checkAuth(), zValidator("json", brandSchema), createBrand)

brandRoutes.put("/", checkAuth(), updateBrand)

brandRoutes.get('/all', checkAuth(), getAllBrands)

brandRoutes.get('/', checkAuth(), getPaginateBrands)

brandRoutes.get('/:id', checkAuth(), getBrand)

brandRoutes.delete("/", checkAuth(), deleteBrand)

brandRoutes.delete("/all", checkAuth(), deleteAllBands)

export default brandRoutes;

