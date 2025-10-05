const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('./Config/Db');
const userModel = require('./models/userModel');
const Items = require('./models/Items');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Connect to DB
(async () => {
  try {
    await db();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
})();

// Gemini AI setup
const ai = new GoogleGenerativeAI("AIzaSyDX-ZlUY-ISO6dBysdYsEZtEUs4K7LXxGI");

// Retry utility
const retry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      console.warn(`Retry ${i + 1} failed:`, err.message);
      if (i === retries - 1) throw err;
      await new Promise(res => setTimeout(res, delay * (i + 1)));
    }
  }
};

// Routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// User Registration
app.post('/api/UserReg', async (req, res) => {
  try {
    const response = await userModel.create(req.body);
    res.json({ message: "Registration successful", success: true, data: response });
  } catch (error) {
    res.status(500).json({ message: "Registration Failed", success: false, error: error.message });
  }
});

// User Login
app.post('/api/UserLogin', async (req, res) => {
  try {
    const { email, password } = req.body;
    const response = await userModel.find({ email, password });

    if (response.length > 0) {
      res.json({ message: "Login successful", data: response, success: true });
    } else {
      res.status(401).json({ message: "Invalid credentials", success: false });
    }
  } catch (error) {
    res.status(500).json({ message: "Login failed", success: false, error: error.message });
  }
});

// Add Item
app.post('/api/addItems', async (req, res) => {
  try {
    const response = await Items.create(req.body);
    res.json({ message: "Item added successfully", data: response, success: true });
  } catch (error) {
    res.status(500).json({ message: "Error adding item", success: false, error: error.message });
  }
});

app.get('/api/deleteItem/:id', async (req, res) => {
  try {
    await Items.findByIdAndDelete(req.params.id);
    console.log("Deleted item with ID:", req.params.id);
    res.json({ message: "Item deleted successfully", success: true });
  }
  catch (error) {
    res.status(500).json({ message: "Error deleting item", success: false, error: error.message });
  }
});

// Get User Items
app.post('/api/getMyItems', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required", success: false });
    }
    
    const items = await Items.find({ email });
    console.log(items);
    res.json({ data: items, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message, success: false });
  }
});
app.get('/api/sample', async (req, res) => {
  try {
    res.json({ message: "Sample endpoint working", success: true });
  } catch (error) {
    res.status(500).json({ error: error.message, success: false });
  }
})
// Gemini Recipe Endpoint (Fixed)
app.post("/api/getRecipe", async (req, res) => {
  try {
    const { userEmail } = req.body;
    const {foodType} = req.body;
    console.log("Received userEmail:", req.body.foodType);
    if (!userEmail) {
      return res.status(400).json({ message: "Missing userEmail" });
    }

    // Get items from DB
    const items = await Items.find({ email: userEmail });

    if (!items.length) {
      return res.json({ message: "No items found in your grocery list" });
    }

    // Build grocery list string from DB
    const groceryList = items
      .map(i => `${i.itemname} (${i.quantity})`)
      .join(", ");

    // Create prompt for Grok
    const prompt = `Here is my grocery list: ${groceryList}. 
    Please suggest a recipe (or multiple) that I can cook using only these ingredients. 
    Write the recipe in simple steps for ${foodType}.`;

    // Call Grok API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        
        "Authorization": `Bearer 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`, // ✅ secure key
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const result = await response.json();
    console.log("Grok response:", result);
    return res.json({
      groceryList,
      recipe: result.choices[0].message.content
    });

  } catch (err) {
    console.error("Error generating recipe:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete Item
app.delete('/api/deleteItem/:id', async (req, res) => {
  try {
    await Items.findByIdAndDelete(req.params.id);
    res.json({ message: "Item deleted successfully", success: true });
  } catch (error) {
    res.status(500).json({ message: "Error deleting item", success: false, error: error.message });
  }
});

// Update Item
app.put('/api/updateItem/:id', async (req, res) => {
  try {
    const updatedItem = await Items.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: "Item updated successfully", success: true, data: updatedItem });
  } catch (error) {
    res.status(500).json({ message: "Error updating item", success: false, error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
