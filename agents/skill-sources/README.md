# Imported agent skills

Installed from the four user-supplied ZIP archives; see installed.json for source paths. All 20 skill folders include their supporting assets and upstream licenses. No plugin hooks or upstream root AGENTS.md were installed.

Local adaptations: UI/UX Pro Max command examples use .agents/skills rather than Claude plugin paths. Anti-slop companion skills point to the installed core. Ponytail Gain includes its cited benchmark and upstream README. Taste is installed under its declared name, design-taste-frontend.

Start a new Codex task/session to refresh skill discovery. Invoke a skill explicitly, for example $ui-ux-pro-max, $design-taste-frontend, $antislop or $ponytail. These are project-local skills, not account-wide plugins.

Repository storage: agents/skills/. Codex discovery: .agents/skills is a relative symlink to ../agents/skills.
