import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import crypto from 'crypto';
import Stripe from 'stripe';

dotenv.config();
const app = express();
app.use(bodyParser.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SECRET_KEY = process.env.SECRET_KEY_SERVER;
const TRANSACTIONS_FILE = './transactions.json';

function encryptTransaction(data) {
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(JSON.stringify(data))
    .digest('hex');
}

function saveTransaction(tx) {
  let db = [];
  if (fs.existsSync(TRANSACTIONS_FILE)) {
    db = JSON.parse(fs.readFileSync(TRANSACTIONS_FILE));
  }
  db.push(tx);
  fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(db, null, 2));
}

// ✅ Créer paiement Stripe
app.post('/create-payment-intent', async (req, res) => {
  const { amountUSD, userId } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountUSD * 100,
      currency: 'usd',
      metadata: { userId }
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Crédite SC après paiement réussi
app.post('/confirm-sc-credit', (req, res) => {
  const { userId, amountUSD } = req.body;
  const sc = amountUSD * 1400;
  const tx = {
    userId,
    usd: amountUSD,
    sc,
    date: new Date(),
    txHash: encryptTransaction({ userId, amountUSD, sc })
  };
  saveTransaction(tx);
  res.json({ message: 'SC ajoutés avec succès', sc, txHash: tx.txHash });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(⁠ ✅ SG Server running on port ${PORT} ⁠));
```

---

✅ Étapes Render :

1.⁠ ⁠Crée un repo GitHub ⁠ gamerhubx-sg-server ⁠.
2.⁠ ⁠Push le code (⁠ git init ⁠, ⁠ git remote add ⁠, etc.).
3.⁠ ⁠Va sur [render.com](https://render.com) > "New Web Service" > Connect GitHub.
4.⁠ ⁠Choisis ton repo > Node.js > Ajoute variables d'env :
   - ⁠ STRIPE_SECRET_KEY ⁠
   - ⁠ SECRET_KEY_SERVER ⁠
5.⁠ ⁠Port : ⁠ 5002 ⁠ (ou laisse Render détecter)
6.⁠ ⁠Déploie 🚀
