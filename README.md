> [!CAUTION]
>
> **DISCLAIMER:** This project uses a community-maintained **unofficial Facebook Messenger API** and is intended for educational, prototype, and private organizational use. It is provided **"as is"** without warranties. The developer assumes no responsibility for account restrictions, session invalidation, data loss, service interruptions, or misuse. Use a secondary/test account when possible and run this software at your own risk.

# ClassReminder v2: Messenger Task Scheduler & Class Reminder Bot

> [!NOTE]
>
> This project serves as a functional prototype and a study guide for understanding how a **Messenger bot**, **scheduled reminders**, **per-group JSON persistence**, and an optional **Discord-based controller** can work together to automate classroom coordination.

Welcome to the **ClassReminder v2** repository. This project is a Node.js-based **Facebook Messenger task scheduler bot** designed to help student groups manage activities, subjects, class schedules, exam weeks, and deadline reminders inside their Messenger group chats.

---

## Features

- [x] **Per-Group Activity Tracking** (each group chat keeps its own independent task list)
- [x] **Subject Management** (add, remove, suggest, and list subjects)
- [x] **Flexible Deadline Parsing** (supports quoted names, natural dates, and time shortcuts)
- [x] **Scheduled Deadline Reminders** (automated reminder checks run every minute)
- [x] **Class Schedule Support** (send schedule image or offline text version)
- [x] **NO CLASS Overrides** (mark specific classes as cancelled for the day)
- [x] **Midterm and Finals Week Handling** (manage exam-week schedule states)
- [x] **Custom Reminder System** (one-time or recurring reminders per group)
- [x] **Batch Command Processing** (multiple slash commands can be sent in one message)
- [x] **Confirmation Workflow** (`/confirm` and `/cancel` for sensitive actions)
- [x] **Auto-Unsend Utility Messages** (help, reminders, and schedule replies can clean themselves up)
- [x] **Discord Controller Bot** (optional admin controller for uptime, restart, status, and appstate replacement)
- [x] **PM2-Ready Deployment** (includes `ecosystem.config.js` for process management)

---

## Architecture Overview

Unlike a traditional website, ClassReminder v2 is an **event-driven messaging automation system**.

- **The Messenger Session:** Uses `@dongdev/fca-unofficial` to log in with `appstate.json` and listen for Messenger events.
- **The Command Router:** Parses slash commands, supports aliases, and dispatches each command to its matching handler.
- **The Scheduler Engine:** Uses `node-cron` plus `moment-timezone` to check reminders and class events in the `Asia/Manila` timezone.
- **The Persistence Layer:** Uses local JSON files to store group threads, subjects, activities, reminders, no-class flags, and exam states.
- **The Controller Layer:** Includes an optional Discord controller that can supervise the Messenger bot process and replace session state when needed.

---

## Core Educational Concepts

For anyone studying this codebase, these are the main ideas behind the system:

> [!IMPORTANT]
> **What is an Event-Driven Bot?**  
> An event-driven bot does not wait for a webpage refresh. Instead, it listens for messages, group events, and replies, then reacts instantly when something happens. In this project, Messenger messages are the main trigger for all bot behavior.

> [!IMPORTANT]
> **What is Scheduled Automation?**  
> Scheduled automation means code runs at defined times without manual input. In this project, `node-cron` checks tasks every minute so the bot can send deadline alerts, class reminders, and recurring notices automatically.

> [!IMPORTANT]
> **What is Per-Group Persistence?**  
> Per-group persistence means every Messenger thread keeps its own separate data file. This prevents one section, class, or group chat from overwriting another group's activities and reminders.

> [!IMPORTANT]
> **What is a Controller Process?**  
> A controller process is a second program that monitors or manages the main bot. Here, `controller.js` acts as an optional Discord-based control panel that can check uptime, test session validity, restart the Messenger bot, and replace `appstate.json`.

### Workflow at a Glance

1. A user sends a slash command such as `/addact` or `/reminder`.
2. The bot parses the command, validates the input, and resolves the target group data.
3. Information is saved into the proper JSON file for that Messenger thread.
4. A scheduled loop checks all tracked groups every minute.
5. The bot sends alerts when activities, classes, or reminders reach their trigger window.

---

## ⚙️ Installation & Setup

> [!WARNING]
> ClassReminder v2 requires **Node.js 18+**, a valid **`appstate.json`** for Messenger login, and optional **`.env`** configuration if you want to use the Discord controller.

**1. Clone the repository:**

```bash
git clone <your-repository-url>
cd ClassReminder-v2
```

**2. Install Node modules:**

```bash
npm install
```

**3. Prepare the Messenger session:**

- Place a valid `appstate.json` file in the project root.
- Review `fca-config.json` if you want to adjust Messenger/FCA behavior.
- Use a secondary or test account when working with unofficial APIs.

**4. (Optional) Create a `.env` file for the Discord controller:**

```env
DISCORD_TOKEN=your_discord_bot_token_here
```

**5. Start the main Messenger bot:**

```bash
npm start
```

**6. (Optional) Start the Discord controller:**

```bash
node controller.js
```

**7. (Optional) Run with PM2:**

```bash
pm2 start ecosystem.config.js
```

---

## Command Reference

### Everyone

- `/help` - Show command list or help for a specific command
- `/status` - Show bot uptime and VPS info
- `/activities` - Show pending activities in the current group
- `/listsub` - Show all registered subjects
- `/confirm CODE` - Confirm a pending admin action
- `/cancel CODE` - Cancel a pending admin action
- `/schedule` - Show the schedule image
- `/schedule offline` - Show the text version of the weekly schedule

### PIO / Representative Only

- `/addact "Name" "Subject" [Date] [Time]` - Add a new activity
- `/removeact (#N | id:XXXXXX | "Name" "Subject")` - Remove an activity
- `/extend (#N | id:XXXXXX | "Name" "Subject") ([NewDate] [NewTime] | +2d/+3h/+30m)` - Extend or reschedule a deadline
- `/addsub "Subject"` - Add a subject
- `/removesub "Subject"` - Remove a subject
- `/listgroups` - Show tracked Messenger groups
- `/noclass <#>` - Mark a listed class as no class for today
- `/reminder "Message" [Date] Time <true/false>` - Create a custom reminder
- `/reminderlist` - Show stored reminders
- `/removereminder rem:XXXXXX` - Remove a reminder
- `/midterm ...` - Manage midterm exam week behavior
- `/finals ...` - Manage finals exam week behavior

### Input Tips

- Quoted input is supported for names with spaces.
- Natural dates such as `today`, `tomorrow`, and weekdays are supported.
- Time shortcuts such as `10pm`, `10:30pm`, or `22:30` are supported.
- Multiple slash commands can be sent in one message on separate lines.

Example:

```text
/addact "Performance Task 3" "English" tomorrow 10pm
/reminder "Check class gc" 6pm true
```

---

## Optional Controller Commands (Discord)

When `controller.js` is running, the Discord controller can manage the Messenger bot with commands such as:

- `/uptime` - Show controller and Messenger bot uptime
- `/status` - Probe whether the current `appstate.json` still works
- `/replace` - Replace `appstate.json` and restart the Messenger bot
- `/restart` - Restart the Messenger bot process

This is useful when the Messenger session expires or when the main process needs remote supervision.

---

## Project Structure

```text
ClassReminder-v2/
|- index.js
|- controller.js
|- ecosystem.config.js
|- package.json
|- package-lock.json
|- fca-config.json
|- .env
|- appstate.json
|- controller_state.json
|- data/
|  |- activities.json
|  |- subjects.json
|  |- group_threads.json
|  |- groups/
|  |- reminders/
|  |- exams/
|  |- noclass/
|  |- schedule/
|  |- pogi/
|  |- LT/
|- appstate_backups/
|- Fca_Database/
```

---

## Why This Project Matters

This repository is a strong study project for learning:

- Messenger bot development
- command parsing and aliases
- cron-based automation
- JSON-based persistence
- multi-group state management
- schedule and deadline workflows
- optional process supervision with Discord
- lightweight Node.js automation for school operations

---

## Final Note

ClassReminder v2 is best understood as a **chat-based classroom workflow assistant**. It shows how messaging commands, stored records, scheduled jobs, and optional remote process control can be combined into a practical productivity bot for academic group chats.
