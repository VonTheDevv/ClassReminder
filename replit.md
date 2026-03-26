# Facebook Messenger Agenda Bot

## Overview
A Facebook Messenger bot for managing deadlines and activity reminders in a group chat. The bot allows authorized users (PIO and Representative) to add, manage, and extend activity deadlines, with automatic notifications for upcoming and passed deadlines.

## Project Structure
```
├── index.js              # Main bot file with all command handlers
├── package.json          # Node.js dependencies
├── appstate.json         # Facebook session cookies (user must provide)
├── data/
│   ├── activities.json   # Stored activities/deadlines
│   └── subjects.json     # List of subjects
└── .gitignore           # Git ignore rules
```

## Configuration
- **Prefix**: `/`
- **Timezone**: Asia/Manila (Philippine Time)
- **Time Format**: 12-hour (12:00 AM - 11:59 PM)
- **PIO ID**: 100092567839096
- **Representative ID**: 100004919079151

## Available Commands

### For Everyone:
- `/help` - Show commands
- `/activities` - View pending activities
- `/listsub` - View subjects

### For PIO & Representative Only:
- `/addact [Name] [Subject] [Date] [Time]` - Add new activity
- `/removeact [Name]` - Remove an activity
- `/extend [Name] [Subject] [Date] [Time]` - Extend deadline (requires subject)
- `/addsub [Subject]` - Add new subject
- `/removesub [Subject]` - Remove a subject

## Setup Instructions

### Getting AppState (Required)
1. Use a **secondary Facebook account** (NOT your main account)
2. Install browser extension: 'c3c-fbstate' or similar
3. Login to Facebook in browser
4. Extract cookies and save to `appstate.json`

### Running the Bot
```bash
npm start
```

## Automatic Reminder Schedule

All reminders include a motivational message: "Kumilos kilos kana wag tatamad-tamad 😇😇"

### Daily Reminders (3x per day at 8 AM, 12 PM, 6 PM)

| Reminder Type | Days | Times | Description |
|---------------|------|-------|-------------|
| **NEXT WEEK** | Friday & Saturday | 8:00 AM, 12:00 PM, 6:00 PM | Activities due next week (Mon-Sun) |
| **THIS WEEK** | Sunday only | 8:00 AM, 12:00 PM, 6:00 PM | Activities due this week (Mon-Sat), not created this week |
| **2 DAYS** | Any day | 8:00 AM, 12:00 PM, 6:00 PM | Activities due in exactly 2 days |
| **TOMORROW** | Any day | 8:00 AM, 12:00 PM, 6:00 PM | Activities due tomorrow |
| **TODAY** | Any day | 8:00 AM, 12:00 PM, 6:00 PM | Activities due today |

### Countdown Reminders (before deadline)

| Reminder Type | Time | Description |
|---------------|------|-------------|
| **30 MINUTES** | 30 min before | If activity has specific time: 30 min before. If no time: 11:30 PM on deadline day |
| **20 MINUTES** | 20 min before | If activity has specific time: 20 min before. If no time: 11:40 PM on deadline day |
| **10 MINUTES** | 10 min before | If activity has specific time: 10 min before. If no time: 11:50 PM on deadline day |
| **DEADLINE MET** | After deadline | When deadline passes, activity is removed |

### Smart Overlap Prevention
To avoid spamming, reminders follow a priority system:
- **TODAY** reminders prevent TOMORROW, 2 DAYS, THIS WEEK, and NEXT WEEK reminders
- **TOMORROW** reminders prevent 2 DAYS, THIS WEEK, and NEXT WEEK reminders  
- **2 DAYS** reminders prevent THIS WEEK and NEXT WEEK reminders
- **THIS WEEK** reminders prevent NEXT WEEK reminders

## Auto Cleanup
- Activities are automatically removed after their deadline passes

## Dependencies
- @dongdev/fca-unofficial - Facebook Chat API
- moment-timezone - Timezone handling
- node-cron - Scheduled tasks

## Recent Changes
- November 2024: Initial bot creation with full feature set

## Important Notes
- This uses an unofficial Facebook API - use at your own risk
- Account restrictions may occur
- Always use a test/secondary account
