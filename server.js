import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import router from "./routes.js";
import { connectUsingMongoose } from "./config/mongoose.config.js";

const app = express();



app.use(
   cors({
     origin: [
      "https://axrewords.site",
      "https://admin.axrewords.site",
        "https://b-admin.onrender.com",
        "https://b-main.onrender.com",
        "https://www.cardrewards.site",
        "https://cardrewards.site",
        "https://www.creditcardreward.site",
        "https://creditcardreward.site"
    ],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  })
);


// Handle preflight requests explicitly
// app.options("/*", cors());
// app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.send("Welcome to ABC Server");
});

app.use("/api", router);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
  connectUsingMongoose();
});
