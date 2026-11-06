const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root010", // Replace with your local MySQL password
  database: "gym_management",
  waitForConnections: true,
  connectionLimit: 10
});

// Dashboard summary
app.get("/api/dashboard", async (req, res) => {
  try {
    const [[members]] = await db.query("SELECT COUNT(*) AS total FROM members");
    const [[plans]] = await db.query("SELECT COUNT(*) AS total FROM membership_plans");
    const [[active]] = await db.query(
      "SELECT COUNT(*) AS total FROM subscriptions WHERE end_date >= CURDATE() AND payment_status = 'Paid'"
    );
    const [[expired]] = await db.query(
      "SELECT COUNT(*) AS total FROM subscriptions WHERE end_date < CURDATE()"
    );
    res.json({ members: members.total, plans: plans.total, activeSubscriptions: active.total, expiredSubscriptions: expired.total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// MEMBERS CRUD
app.get("/api/members", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM members ORDER BY member_id DESC");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/members", async (req, res) => {
  try {
    const { name, email, phone, join_date, status } = req.body;
    if (!name || !email || !phone || !join_date || !status) return res.status(400).json({ error: "Please fill all member fields." });
    const [result] = await db.query(
      "INSERT INTO members (name, email, phone, join_date, status) VALUES (?, ?, ?, ?, ?)",
      [name, email, phone, join_date, status]
    );
    res.status(201).json({ message: "Member added successfully.", member_id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put("/api/members/:id", async (req, res) => {
  try {
    const { name, email, phone, join_date, status } = req.body;
    const [result] = await db.query(
      "UPDATE members SET name=?, email=?, phone=?, join_date=?, status=? WHERE member_id=?",
      [name, email, phone, join_date, status, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: "Member not found." });
    res.json({ message: "Member updated successfully." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/members/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM members WHERE member_id=?", [req.params.id]);
    res.json({ message: "Member deleted successfully." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// MEMBERSHIP PLANS CRUD
app.get("/api/plans", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM membership_plans ORDER BY plan_id DESC");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/plans", async (req, res) => {
  try {
    const { plan_name, duration_months, fee, description } = req.body;
    if (!plan_name || !duration_months || fee === undefined) return res.status(400).json({ error: "Plan name, duration and fee are required." });
    const [result] = await db.query(
      "INSERT INTO membership_plans (plan_name, duration_months, fee, description) VALUES (?, ?, ?, ?)",
      [plan_name, duration_months, fee, description || ""]
    );
    res.status(201).json({ message: "Plan added successfully.", plan_id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put("/api/plans/:id", async (req, res) => {
  try {
    const { plan_name, duration_months, fee, description } = req.body;
    const [result] = await db.query(
      "UPDATE membership_plans SET plan_name=?, duration_months=?, fee=?, description=? WHERE plan_id=?",
      [plan_name, duration_months, fee, description || "", req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: "Plan not found." });
    res.json({ message: "Plan updated successfully." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/plans/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM membership_plans WHERE plan_id=?", [req.params.id]);
    res.json({ message: "Plan deleted successfully." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// SUBSCRIPTIONS CRUD + joined details
app.get("/api/subscriptions", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*, m.name AS member_name, p.plan_name, p.fee,
      CASE WHEN s.end_date < CURDATE() THEN 'Expired' ELSE 'Current' END AS membership_status
      FROM subscriptions s
      JOIN members m ON s.member_id = m.member_id
      JOIN membership_plans p ON s.plan_id = p.plan_id
      ORDER BY s.subscription_id DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/subscriptions", async (req, res) => {
  try {
    const { member_id, plan_id, start_date, end_date, payment_status } = req.body;
    if (!member_id || !plan_id || !start_date || !end_date || !payment_status) return res.status(400).json({ error: "Please complete all subscription fields." });
    const [result] = await db.query(
      "INSERT INTO subscriptions (member_id, plan_id, start_date, end_date, payment_status) VALUES (?, ?, ?, ?, ?)",
      [member_id, plan_id, start_date, end_date, payment_status]
    );
    res.status(201).json({ message: "Subscription created successfully.", subscription_id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put("/api/subscriptions/:id", async (req, res) => {
  try {
    const { member_id, plan_id, start_date, end_date, payment_status } = req.body;
    const [result] = await db.query(
      "UPDATE subscriptions SET member_id=?, plan_id=?, start_date=?, end_date=?, payment_status=? WHERE subscription_id=?",
      [member_id, plan_id, start_date, end_date, payment_status, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: "Subscription not found." });
    res.json({ message: "Subscription updated successfully." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/subscriptions/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM subscriptions WHERE subscription_id=?", [req.params.id]);
    res.json({ message: "Subscription deleted successfully." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// TRAINERS: extra table + assignment table because the supplied schema mentions trainer assignment.
app.get("/api/trainers", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM trainers ORDER BY trainer_id DESC");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/trainers", async (req, res) => {
  try {
    const { trainer_name, specialty, phone } = req.body;
    if (!trainer_name) return res.status(400).json({ error: "Trainer name is required." });
    const [result] = await db.query(
      "INSERT INTO trainers (trainer_name, specialty, phone) VALUES (?, ?, ?)",
      [trainer_name, specialty || "", phone || ""]
    );
    res.status(201).json({ message: "Trainer added.", trainer_id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/assignments", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.assignment_id, a.member_id, a.trainer_id, m.name AS member_name,
      t.trainer_name, a.assigned_date
      FROM trainer_assignments a
      JOIN members m ON a.member_id=m.member_id
      JOIN trainers t ON a.trainer_id=t.trainer_id
      ORDER BY a.assignment_id DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/assignments", async (req, res) => {
  try {
    const { member_id, trainer_id, assigned_date } = req.body;
    if (!member_id || !trainer_id || !assigned_date) return res.status(400).json({ error: "Select a member, trainer and date." });
    const [result] = await db.query(
      "INSERT INTO trainer_assignments (member_id, trainer_id, assigned_date) VALUES (?, ?, ?)",
      [member_id, trainer_id, assigned_date]
    );
    res.status(201).json({ message: "Trainer assigned successfully.", assignment_id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/assignments/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM trainer_assignments WHERE assignment_id=?", [req.params.id]);
    res.json({ message: "Trainer assignment removed." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => console.log(`Gym Management System running at http://localhost:${PORT}`));
