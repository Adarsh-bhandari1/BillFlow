// server.js
import express from "express";
import dotenv from "dotenv";
import meteringRoutes from "./routes/metering.js";
import webhookRoutes from "./routes/webhooks.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use("/api/webhooks/stripe", express.raw({ type: "application/json" }));

// Standard JSON parser for all other routes
app.use(express.json());

// Mount routes AFTER middleware configuration
app.use("/api", meteringRoutes);
app.use("/api", webhookRoutes);

app.get("/", (req, res) => {
  res.json({ message: "BillFlow API is running" });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
