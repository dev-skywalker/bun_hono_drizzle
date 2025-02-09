import { Hono } from "hono";
import { deleteAllUsers, deleteUser, getAllUser, userLogin, userRegister } from "./user_controller";
import { zValidator } from "@hono/zod-validator";
import { loginSchema, registrationSchema } from "./user_schema";
//import { checkPermissions } from "../../middleware/check_permission";
import { Env } from "../../config/env";
import { checkAuth } from "../../middleware/check_permission";

const userRoutes = new Hono<{ Bindings: Env }>();

userRoutes.post("/register", zValidator("json", registrationSchema), userRegister)

userRoutes.post("/login", zValidator("json", loginSchema), userLogin)

//userRoutes.get('/', checkPermissions(["read"]), getAllUser)
userRoutes.get('/', checkAuth(), getAllUser)

userRoutes.delete("/", checkAuth(), deleteUser)

userRoutes.delete("/all", checkAuth(), deleteAllUsers)

export default userRoutes;

