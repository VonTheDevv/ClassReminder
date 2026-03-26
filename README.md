> [!CAUTION]
>
> **DISCLAIMER:** This prototype project was developed for educational and academic use. It is provided **"as is"** without warranties of any kind. The developer assumes no responsibility for account issues, data loss, downtime, or misuse that may happen while running or modifying this software. Use at your own risk.

# ClassReminder: Messenger Agenda & Deadline Reminder Bot

> [!NOTE]
>
> This project serves as a functional prototype and a study guide for understanding how a **Messenger bot**, **scheduled reminders**, and **per-group JSON persistence** can work together to automate classroom deadline tracking.

Welcome to the **ClassReminder** repository. This project is a Node.js-based **Facebook Messenger agenda bot** designed to help student groups organize academic activities, manage subjects, and receive automated deadline reminders.

---

## Features

- [x] **Per-Group Activity Tracking** (each chat keeps its own independent activity list)
- [x] **Subject Management** (add, remove, and list subjects)
- [x] **Automated Reminder Schedule** (8:00 AM, 12:00 PM, and 6:00 PM)
- [x] **Countdown Alerts** (30, 20, and 10 minutes before a timed deadline)
- [x] **Deadline Status Updates** (today, tomorrow, 2 days, this week, next week, ended)
- [x] **Batch Command Processing** (send multiple `/` commands in one message using separate lines)
- [x] **Auto-Unsend for Activity Lists** (activity output can disappear automatically after 10 minutes)
- [x] **Legacy Data Migration Support** (older activity data can be copied into group-specific storage)

---

## Architecture Overview

Unlike a traditional web app, ClassReminder is an **event-driven chat automation system**.

- **The Messenger Session:** Uses `@dongdev/fca-unofficial` to log in and listen for group messages.
- **The Command Router:** Parses `/` commands and dispatches them to the correct handler.
- **The Reminder Engine:** Uses `node-cron` and `moment-timezone` to evaluate deadlines every minute using the `Asia/Manila` timezone.
- **The Storage Layer:** Uses local JSON files to persist subjects, tracked group threads, and each group's activity list.

---

## Core Educational Concepts

For anyone studying this codebase, these are the main ideas behind the system:

> [!IMPORTANT]
> **What is an Event-Driven Bot?**  
> An event-driven bot waits for a message, member event, or thread update, then reacts to it. Instead of rendering pages for a browser, this project listens to Messenger events and runs JavaScript logic whenever something happens.

> [!IMPORTANT]
> **What is a Scheduler?**  
> A scheduler allows code to run at specific times or intervals. In this project, `node-cron` checks every minute for activities that are approaching their deadlines, then sends the correct reminder message to the right group.

> [!IMPORTANT]
> **What is Per-Group Persistence?**  
> Per-group persistence means each Messenger thread stores its own data independently. This prevents one classroom or section from overwriting another group's reminders and activities.

### Reminder Flow at a Glance

1. A user sends a command like `/addact`.
2. The bot validates the subject, date, and optional time.
3. The activity is saved inside that specific group's JSON file.
4. A scheduled task checks deadlines every minute.
5. The bot sends the correct reminder when the activity enters a reminder window.

---

## ⚙️ Installation & Setup

> [!WARNING]
> ClassReminder requires **Node.js 18+** and a valid Facebook session state (`appstate.json`) to run correctly.

**1. Clone the repository and install dependencies:**

```bash
git clone <your-repository-url>
cd ClassReminder-main
npm install
```

**2. Prepare your Messenger login session:**

- Place a valid `appstate.json` file in the project root.
- Review `fca-config.json` if you need to adjust FCA behavior.

**3. Start the bot:**

```bash
npm start
```

---

## Command Reference

### Everyone

- `/help` - Show all available commands
- `/activities` - View pending activities in the current group
- `/listsub` - View all registered subjects

### PIO / Representative Only

- `/addact [Name] [Subject] [Date] [Time]` - Add a new activity
- `/extend [Name] [Subject] [Date] [Time]` - Extend an existing activity deadline
- `/removeact [Name]` - Remove an activity
- `/addsub [Subject]` - Add a subject
- `/removesub [Subject]` - Remove a subject
- `/listgroups` - View tracked groups and activity counts

### Input Format Notes

- Use `_` instead of spaces for activity names
- Date format: `MM/DD/YYYY`
- Time format: `10:00pm` (optional)

Example:

```text
/addact Performance_Task_3 English 10/23/2025 10:00pm
```

---

## Project Structure

```text
ClassReminder-main/
|- index.js
|- fca-config.json
|- package.json
|- data/
|  |- activities.json
|  |- group_threads.json
|  |- subjects.json
|- data/groups/
|  |- <threadID>.json
```

---

## Why This Project Matters

This repository is a good study project for learning:

- Messenger bot automation
- JSON-based persistence
- cron scheduling
- per-group state management
- command parsing and validation
- deadline reminder workflows

---

## Final Note

ClassReminder is best understood as a **workflow automation prototype** for schools or class organizations. It shows how chat-based commands, stored records, and scheduled jobs can be combined into a lightweight productivity assistant.
