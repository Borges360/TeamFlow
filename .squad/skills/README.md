# Skills

Skills are small, load-on-demand procedures that help a role perform a bounded kind of work. They are portable Markdown guidance—not Python plugins, runtime classes, or a claim that every technology requires a separate agent.

## Selection

Load a skill only when the demand, workflow, repository metadata, or risk profile requires it. A task contract names the selected capability and provides the minimal context.

Universal skills here cover recurring engineering methods. Technology- or domain-specific examples belong under `.project/skills/` and should be replaced by each adopting squad.

## Skill authoring contract

Every skill should state:

- purpose and activation triggers;
- prerequisites and required context;
- procedure and decision points;
- expected artifacts/evidence;
- safety/stop conditions;
- completion criteria.

Skills may reference optional tools, but must not assume an orchestrator owned by this repository.
