# M5 phase 1 implementation notes

- Local baseline is commit `30b57b6`; the remote main branch is newer. Git fetch could not connect from this environment and Git metadata is read-only, so this is a working-tree prototype, not a synchronized or committed branch.
- Ruling: build the first-phase controls with labelled mocks in the existing checkout because worktree creation and a safe Git fetch require metadata writes/network access; reconcile with remote before integration. Cost: the prototype is not validated against the latest files on disk and must be merged carefully.
- The mock adapter uses M1 geometry's typed-array names and M4's existing playback function names, with speed 1 mapped to raw 60. It is not real geometry or animation.
- Fixture triangles are for interface testing only, not renderable representative word geometry. Per-letter bounds are not present.
- Mock geometry replacement is transactional for the test harness. The real M2 renderer must independently provide replacement/rollback semantics.
- User-facing colours and depth update the simulated preview. Light, camera, material, advanced colours and export remain pending teammate integration or later phases.
- Depth range 0.2–3 and speed range 0.5–2 are prototype choices, not confirmed teammate contracts.
- GitHub review previously showed internal whitespace rejected; M1 should confirm this difference from the earlier discussion.
- Remote animation includes a scale-down phase that the archived assignment summary did not list; M4 should check the official brief.
- Automated Node tests cover adapter mapping, mock metadata, capabilities, word validation, replacement failure, colour-only update and playback continuity. Visual and real-WebGL browser checks remain required.
- AI assistance was used for planning, interface code, test creation and documentation. Review implementation and log prompts, changes and verification for the assignment's disclosure.
