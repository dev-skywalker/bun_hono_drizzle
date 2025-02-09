import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env } from "../../config/env";
import { supplierSchema } from "./supplier_schema";
import { createSupplier, deleteAllSuppliers, deleteSupplier, getAllSuppliers, getPaginateSuppliers, getSupplier, updateSupplier } from "./supplier_controller";
import { checkAuth } from "../../middleware/check_permission";

const supplierRoutes = new Hono<{ Bindings: Env }>();

supplierRoutes.post("/", checkAuth(), zValidator("json", supplierSchema), createSupplier)

supplierRoutes.put("/", checkAuth(), updateSupplier)

supplierRoutes.get('/all', checkAuth(), getAllSuppliers)

supplierRoutes.get('/', checkAuth(), getPaginateSuppliers)

supplierRoutes.get('/:id', checkAuth(), getSupplier)

supplierRoutes.delete("/", checkAuth(), deleteSupplier)

supplierRoutes.delete("/all", checkAuth(), deleteAllSuppliers)

export default supplierRoutes;

