require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Import routes
const statsRouter = require("./routes/stats");
const cardRouter = require("./routes/card");

const app = express();
const PORT = process.env.PORT || 8080;

// Middlewares
app.use(cors());
app.use(express.json());

// Register API Routes
app.use("/api/stats", statsRouter);
app.use("/api/card", cardRouter);

// Basic health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
