---
title: "Clarechen Events"
activeEvents:
  - welcome-to-the-world-party
---

# Events Management

This is the master control file for all events on Clarechen.com.au.

## How It Works

- The `activeEvents` list above controls which events appear on the homepage
- Event content is stored in `/event/list/{slug}/{slug}.md`
- To show/hide an event, add or remove it from the `activeEvents` list

## Available Events

All event markdown files in `/event/list/`:
- `welcome-to-the-world-party/welcome-to-the-world-party.md`
- `design-workshop/design-workshop.md`

## To Show an Event

Add the event slug (folder name, without .md) to the `activeEvents` list:
```yaml
activeEvents:
  - welcome-to-the-world-party
  - design-workshop
```

## To Hide an Event

Remove it from the `activeEvents` list:
```yaml
activeEvents:
  - welcome-to-the-world-party
```
