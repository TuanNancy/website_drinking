const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const app = express();

// Cấu hình multer để xử lý upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "public", "images");
    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Tạo tên file duy nhất bằng cách thêm timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Chỉ chấp nhận các file hình ảnh
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error("Chỉ chấp nhận file hình ảnh!"), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
  },
});

// Kết nối MongoDB
mongoose
  .connect("mongodb://localhost:27017/drinkDB")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

// Định nghĩa schema và model cho đồ uống
const drinkSchema = new mongoose.Schema({
  name: String,
  size: String,
  price: Number,
  images: [String],
  attributes: [
    {
      key: String,
      value: String,
    },
  ],
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
});

const User = mongoose.model("User", userSchema);

const Drink = mongoose.model("Drink", drinkSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes cho các trang HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get("/create", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "create.html"));
});

app.get("/read", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "read.html"));
});

app.get("/update", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "update.html"));
});

app.get("/delete", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "delete.html"));
});

app.get("/detail", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "detail.html"));
});

// API routes
app.get("/api/drinks", async (req, res) => {
  try {
    const drinks = await Drink.find();
    res.json(drinks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// API lấy thông tin chi tiết đồ uống theo ID
app.get("/api/drinks/:id", async (req, res) => {
  try {
    const drink = await Drink.findById(req.params.id);
    if (!drink) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
    res.json(drink);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// API upload hình ảnh
app.post("/api/upload", upload.array("images", 5), async (req, res) => {
  try {
    const imageUrls = req.files.map((file) => `/images/${file.filename}`);
    res.json({ urls: imageUrls });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post("/api/drinks", async (req, res) => {
  const drink = new Drink({
    name: req.body.name,
    size: req.body.size,
    price: req.body.price,
    images: req.body.images || [],
    attributes: req.body.attributes || [],
  });

  try {
    const newDrink = await drink.save();
    res.status(201).json(newDrink);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put("/api/drinks/:id", upload.array("images", 5), async (req, res) => {
  try {
    const drink = await Drink.findById(req.params.id);
    if (!drink) return res.status(404).json({ message: "Drink not found" });

    drink.name = req.body.name;
    drink.size = req.body.size;
    drink.price = req.body.price;
    drink.attributes = JSON.parse(req.body.attributes);

    // Lưu đường dẫn ảnh mới nếu có upload
    if (req.files && req.files.length > 0) {
      drink.images = req.files.map((file) => `/images/${file.filename}`);
    }

    const updatedDrink = await drink.save();
    res.json(updatedDrink);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete("/api/drinks/:id", async (req, res) => {
  try {
    await Drink.findByIdAndDelete(req.params.id);
    res.json({ message: "Drink deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Xử lý 404
app.use((req, res) => {
  res.status(404).send("404 - Page Not Found");
});

app.use("/images", express.static(path.join(__dirname, "public", "images")));

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
