import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env } from "../../config/env";
import { createLostDamagedItem, getLostDamagedItem } from "./lostDamage_controller";
import { checkAuth } from "../../middleware/check_permission";

const lostDamageRoutes = new Hono<{ Bindings: Env }>();


lostDamageRoutes.post("/", checkAuth(), createLostDamagedItem)

lostDamageRoutes.get("/", checkAuth(), getLostDamagedItem)


export default lostDamageRoutes;

