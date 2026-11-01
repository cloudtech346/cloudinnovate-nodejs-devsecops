const express = require("express");

const app = express();

app.disable('x-powered-by');

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({ service: "CloudInnovate Demo API", status: "ok" });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "healthy" });
});

// Demo-only endpoint. Replace with real application routes and authentication.
app.get("/api/customers", (_req, res) => {
  res.status(200).json([{ id: 1, name: "Sample Customer" }]);
});

const port = Number(process.env.PORT || 3000);
if (require.main === module) {
  app.listen(port, "0.0.0.0", () => {
    console.log(`API listening on port ${port}`);
  });
}

module.exports = app;
