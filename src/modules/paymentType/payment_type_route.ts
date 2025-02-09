import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env } from "../../config/env";
import { paymentTypeSchema } from "./payment_type_schema";
import { createpaymentType, deleteAllpaymentType, deletepaymentType, getAllpaymentType, getPaginatepaymentType, getpaymentType, updatepaymentType } from "./payment_type_controller";
import { checkAuth } from "../../middleware/check_permission";

const paymentTypeRoutes = new Hono<{ Bindings: Env }>();

paymentTypeRoutes.post("/", checkAuth(), zValidator("json", paymentTypeSchema), createpaymentType)

paymentTypeRoutes.put("/", checkAuth(), updatepaymentType)

paymentTypeRoutes.get('/all', checkAuth(), getAllpaymentType)

paymentTypeRoutes.get('/', checkAuth(), getPaginatepaymentType)

paymentTypeRoutes.get('/:id', checkAuth(), getpaymentType)

paymentTypeRoutes.delete("/", checkAuth(), deletepaymentType)

paymentTypeRoutes.delete("/all", checkAuth(), deleteAllpaymentType)

export default paymentTypeRoutes;

