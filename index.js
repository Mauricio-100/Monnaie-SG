import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "*", credentials: true }));
app.use(bodyParser.json());

// Connexion MySQL
let pool;
(async () => {
  pool = await mysql.createPool(process.env.MYSQL_URL);
  console.log("✅ Connexion à la base SG réussie !");
})();

// Endpoint pour acheter SC
app.post("/buy-sc", async (req, res) => {
  try {
    const { userId, amount } = req.body; // montant en SC
    // Crée transaction SG et crédite SC
    await pool.query(
      "INSERT INTO transactions (user_id, type, amount) VALUES (?, 'SC_purchase', ?)",
      [userId, amount]
    );
    await pool.query(
      "UPDATE users SET sc_balance = sc_balance + ? WHERE id = ?",
      [amount, userId]
    );
    res.json({ message: "SC acheté avec succès ✅", sc: amount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur SG" });
  }
});

// Endpoint pour dépenser SC (ex: mode premium, boutique)
app.post("/spend-sc", async (req, res) => {
  try {
    const { userId, amount, item } = req.body;
    const [rows] = await pool.query("SELECT sc_balance FROM users WHERE id = ?", [userId]);
    if (!rows.length || rows[0].sc_balance < amount) {
      return res.status(400).json({ error: "SC insuffisant" });
    }
    await pool.query(
      "UPDATE users SET sc_balance = sc_balance - ? WHERE id = ?",
      [amount, userId]
    );
    await pool.query(
      "INSERT INTO transactions (user_id, type, amount, item) VALUES (?, 'SC_spent', ?, ?)",
      [userId, amount, item]
    );
    res.json({ message: "Achat effectué ✅", item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur SG" });
  }
});

// Endpoint pour récupérer le solde SC
app.get("/sc-balance/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const [rows] = await pool.query("SELECT sc_balance FROM users WHERE id = ?", [userId]);
    if (!rows.length) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json({ sc_balance: rows[0].sc_balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur SG" });
  }
});

app.listen(PORT, () => console.log(`🚀 SG Server running on port ${PORT}`));
