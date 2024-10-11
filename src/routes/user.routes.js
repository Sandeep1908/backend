import { registerUser,loginUser, getCurrentUser } from "../controller/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import express from 'express'
const router = express.Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/getcurrentuser").get(verifyJwt,getCurrentUser)

export default router