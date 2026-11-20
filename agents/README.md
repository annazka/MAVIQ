# Agent skills

20 project-local skills imported from the four supplied archives:

- UI/UX Pro Max: 7 skills
- Taste: 1 skill (`design-taste-frontend`)
- Anti-slop: 6 skills
- Ponytail: 6 skills

Skill folders, supporting assets, and upstream licenses live in `skills/`. Import provenance is recorded in `skill-sources/`.

Codex discovers them through the relative symlink `.agents/skills -> ../agents/skills`. Run skill command examples from the repository root. Start a new task/session to refresh discovery, then invoke a skill such as `$ui-ux-pro-max`, `$design-taste-frontend`, `$antislop` or `$ponytail`. No plugin hooks are installed.
