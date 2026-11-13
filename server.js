import express from "express";
import dotenv from "dotenv";
import meteringRoutes from "./routes/metering.js";
import webhookRoutes from "./routes/webhooks.js";
import adminRoutes from "./routes/admin.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use("/api/stripe", express.raw({ type: "application/json" }));

app.use(express.json());

app.use("/api", meteringRoutes);
app.use("/api", webhookRoutes);
app.use("/api/admin", adminRoutes);
app.get("/", (req, res) => {
  res.json({ message: "BillFlow API is running" });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
