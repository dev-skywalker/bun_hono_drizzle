import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { checkPermissions } from "../../middleware/check_permission";
import { Env } from "../../config/env";
import { supplierSchema } from "./supplier_schema";
import { createSupplier, deleteAllSuppliers, deleteSupplier, getAllSuppliers, getPaginateSuppliers, updateSupplier } from "./supplier_controller";

const supplierRoutes = new Hono<{ Bindings: Env }>();

supplierRoutes.post("/", zValidator("json", supplierSchema), createSupplier)

supplierRoutes.put("/", updateSupplier)

supplierRoutes.get('/all', getAllSuppliers)

supplierRoutes.get('/', getPaginateSuppliers)

supplierRoutes.delete("/", deleteSupplier)

supplierRoutes.delete("/all", deleteAllSuppliers)

export default supplierRoutes;

