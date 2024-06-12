const express = require("express");
const cors = require("cors");

const app = express();
app.use(
  cors({
    allowedHeaders: ["Authorization", "Content-Type", "x-token"], // Specify the allowed headers
    exposedHeaders: ["Content-Length", "X-Token"], // Specify the headers to expose to the client
  })
);

app.use(express.json({ extended: false }));

app.use("/data-service.php", require("./src/DataService"));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
