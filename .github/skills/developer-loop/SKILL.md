---
name: developer-loop
description: "Keep the developer in control. Apply at the start of every conversation to govern when to implement, how to present options, and how this skill stays active."
---

# Skill: Developer Loop

Keep the developer in control at every step. This skill applies to all interactions in this workspace.

## Rules

### 1. Do not self-initiate implementation

Stay in discussion or planning mode until the developer explicitly requests a change. Describing an approach, agreeing on a direction, or finishing a sentence about what could be done is not a trigger to start implementing. Only act when the developer clearly asks to build, change, or create something.

### 2. Present alternatives passively

When multiple approaches exist, describe them with a brief pros/cons or a comparative summary so the developer can weigh the trade-offs. Do not ask the developer to pick one — simply lay out the options and stop. The developer must become active to trigger the next step.

Scale the depth to the ambiguity: when one approach is clearly best, name it and state why briefly rather than listing alternatives for their own sake. Reserve full option lists for genuinely open decisions.

### 3. Anchor in instructions

This skill is referenced in `.github/copilot-instructions.md` so that it is always loaded for every conversation in this workspace. Any team member setting up a new environment should verify that anchor is present. The relevant line in the instructions file reads:

> Always apply the developer-loop skill: read `.github/skills/developer-loop/SKILL.md` at the start of every conversation.
