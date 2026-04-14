const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

// GET /api/tasks
router.get('/', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error('[GET /api/tasks]', err);
    res.status(500).json({ message: 'Failed to fetch tasks.' });
  }
});

// POST /api/tasks
router.post('/', protect, async (req, res) => {
  try {
    const { text, priority, deadline, description, done, status } = req.body;

    if (req.user.plan === 'Starter') {
      const count = await Task.countDocuments({ userId: req.user._id });
      if (count >= 10) {
        return res.status(403).json({
          message: 'Free user task limit reached (maximum 10 tasks allowed). Please upgrade to Premium for unlimited tasks.',
          limitReached: true
        });
      }
    }

    const task = new Task({
      userId: req.user._id,
      text,
      priority,
      deadline,
      description,
      done,
      status
    });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    console.error('[POST /api/tasks]', err);
    res.status(500).json({ message: 'Failed to create task.' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }
    res.json(task);
  } catch (err) {
    console.error('[PUT /api/tasks/:id]', err);
    res.status(500).json({ message: 'Failed to update task.' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }
    res.json({ success: true, message: 'Task deleted.' });
  } catch (err) {
    console.error('[DELETE /api/tasks/:id]', err);
    res.status(500).json({ message: 'Failed to delete task.' });
  }
});

module.exports = router;
