import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { checkPermissions } from "../../middleware/check_permission";
import { Env } from "../../config/env";
import { customerSchema } from "./customer_schema";
import { createCustomer, deleteAllCustomers, deleteCustomer, getAllCustomers, getPaginateCustomers, updateCustomer } from "./customer_controller";

const customerRoutes = new Hono<{ Bindings: Env }>();

customerRoutes.post("/", zValidator("json", customerSchema), createCustomer)

customerRoutes.put("/", updateCustomer)

customerRoutes.get('/all', getAllCustomers)

customerRoutes.get('/', getPaginateCustomers)

customerRoutes.delete("/", deleteCustomer)

customerRoutes.delete("/all", deleteAllCustomers)

export default customerRoutes;

