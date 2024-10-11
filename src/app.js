import express from "express";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

//routes

import userRouter from "./routes/user.routes.js";
import expenseRouter from "./routes/expense.routes.js";
app.use("/api/user", userRouter);
app.use("/api/expense", expenseRouter);

export { app };
