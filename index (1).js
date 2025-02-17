const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 3000;
const tasksFile = path.join(__dirname, "tasks.json");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const readTasks = () => {
  if (!fs.existsSync(tasksFile)) return [];
  const data = fs.readFileSync(tasksFile, "utf-8");
  return data ? JSON.parse(data) : [];
};

const writeTasks = (tasks) => {
  fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2));
};

const validateTask = (req, res, next) => {
  const { title, status } = req.body;
  if (!title || typeof title !== "string") {
    return res
      .status(400)
      .json({ error: "Title is required and must be a string" });
  }
  if (status && !["pending", "in-progress", "completed"].includes(status)) {
    return res
      .status(400)
      .json({
        error: "Status must be 'pending', 'in-progress', or 'completed'",
      });
  }
  next();
};

app.get("/tasks", (req, res) => {
  res.json(readTasks());
});

app.get("/tasks/:id", (req, res) => {
  const tasks = readTasks();
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

app.post("/tasks", validateTask, (req, res) => {
  const tasks = readTasks();
  const newTask = { id: uuidv4(), ...req.body };
  tasks.push(newTask);
  writeTasks(tasks);
  res.status(201).json(newTask);
});

app.put("/tasks/:id", validateTask, (req, res) => {
  let tasks = readTasks();
  const index = tasks.findIndex((t) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Task not found" });
  tasks[index] = { ...tasks[index], ...req.body };
  writeTasks(tasks);
  res.json(tasks[index]);
});

app.delete("/tasks/:id", (req, res) => {
  let tasks = readTasks();
  const filteredTasks = tasks.filter((t) => t.id !== req.params.id);
  if (tasks.length === filteredTasks.length)
    return res.status(404).json({ error: "Task not found" });
  writeTasks(filteredTasks);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
