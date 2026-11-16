-- 2022-2024 sprint points (8-7-6-5-4-3-2-1) for the 2019-2024 preset
INSERT INTO ruleset_sprint_points (ruleset_id, finish_position, points)
SELECT r.id, p.pos, p.pts
FROM scoring_ruleset r
CROSS JOIN (SELECT 1 AS pos, 8 AS pts UNION ALL SELECT 2, 7 UNION ALL SELECT 3, 6
            UNION ALL SELECT 4, 5 UNION ALL SELECT 5, 4 UNION ALL SELECT 6, 3
            UNION ALL SELECT 7, 2 UNION ALL SELECT 8, 1) p
WHERE r.code = 'fl-2019-2024';

-- 2021: same race points and fastest-lap point, but sprint points of 3-2-1
INSERT INTO scoring_ruleset (code, name, description, fastest_lap_point, fastest_lap_requires_top_ten)
VALUES ('sprint-2021', '2021', '25-18-15-12-10-8-6-4-2-1, sprint 3-2-1, fastest-lap point for top ten', 1, TRUE);

INSERT INTO ruleset_race_points (ruleset_id, finish_position, points)
SELECT (SELECT id FROM scoring_ruleset WHERE code = 'sprint-2021'), finish_position, points
FROM ruleset_race_points
WHERE ruleset_id = (SELECT id FROM scoring_ruleset WHERE code = 'fl-2019-2024');

INSERT INTO ruleset_sprint_points (ruleset_id, finish_position, points)
SELECT id, 1, 3 FROM scoring_ruleset WHERE code = 'sprint-2021'
UNION ALL SELECT id, 2, 2 FROM scoring_ruleset WHERE code = 'sprint-2021'
UNION ALL SELECT id, 3, 1 FROM scoring_ruleset WHERE code = 'sprint-2021';