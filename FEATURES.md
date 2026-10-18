# Features

This file lists every implemented feature of this project. Each entry links to a skill file
with full detail, so this file stays short.

See the workspace-level `CLAUDE.md` (one directory up) for the delegation, writing, and git
policies shared by every project here.

- Media library: upload, list, and delete files in Supabase Storage, plus the generic `media`
  content-field widget and its `PlutoMediaAdapter`. See
  @.claude/skills/media-library/SKILL.md. The upload modal explains each rejected or failed
  upload (wrong type, too big, server error).
