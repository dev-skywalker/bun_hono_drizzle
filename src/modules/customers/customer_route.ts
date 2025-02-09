import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env } from "../../config/env";
import { customerSchema } from "./customer_schema";
import { createCustomer, deleteAllCustomers, deleteCustomer, getAllCustomers, getCustomer, getPaginateCustomers, updateCustomer } from "./customer_controller";
import { checkAuth } from "../../middleware/check_permission";

const customerRoutes = new Hono<{ Bindings: Env }>();

customerRoutes.post("/", checkAuth(), zValidator("json", customerSchema), createCustomer)

customerRoutes.put("/", checkAuth(), updateCustomer)

customerRoutes.get('/all', checkAuth(), getAllCustomers)

customerRoutes.get('/', checkAuth(), getPaginateCustomers)

customerRoutes.get('/:id', checkAuth(), getCustomer)

customerRoutes.delete("/", checkAuth(), deleteCustomer)

customerRoutes.delete("/all", checkAuth(), deleteAllCustomers)

export default customerRoutes;

