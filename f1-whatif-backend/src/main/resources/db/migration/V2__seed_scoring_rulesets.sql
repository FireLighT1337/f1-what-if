-- Preset points systems. Verify against official sources before publishing the app.
INSERT INTO scoring_ruleset (id, code, name, description, fastest_lap_point, fastest_lap_requires_top_ten) VALUES
 (1, 'current-2025',   'Current (2025 onwards)', '25-18-15-12-10-8-6-4-2-1 plus sprint points, no fastest-lap point', 0, FALSE),
 (2, 'fl-2019-2024',   '2019-2024',              '25-18-15-12-10-8-6-4-2-1 plus a fastest-lap point for top-ten finishers', 1, TRUE),
 (3, 'modern-2010',    '2010-2018',              '25-18-15-12-10-8-6-4-2-1', 0, FALSE),
 (4, 'classic-2003',   '2003-2009',              '10-8-6-5-4-3-2-1', 0, FALSE),
 (5, 'classic-1991',   '1991-2002',              '10-6-4-3-2-1', 0, FALSE),
 (6, 'classic-1961',   '1961-1990',              '9-6-4-3-2-1', 0, FALSE);

-- 25-18-15-12-10-8-6-4-2-1 for rulesets 1, 2 and 3
INSERT INTO ruleset_race_points (ruleset_id, finish_position, points)
SELECT r.id, p.pos, p.pts
FROM scoring_ruleset r
CROSS JOIN (SELECT 1 AS pos, 25 AS pts UNION ALL SELECT 2, 18 UNION ALL SELECT 3, 15
      UNION ALL SELECT 4, 12 UNION ALL SELECT 5, 10 UNION ALL SELECT 6, 8
      UNION ALL SELECT 7, 6 UNION ALL SELECT 8, 4 UNION ALL SELECT 9, 2
      UNION ALL SELECT 10, 1) p
WHERE r.id IN (1, 2, 3);

INSERT INTO ruleset_race_points (ruleset_id, finish_position, points) VALUES
 (4, 1, 10), (4, 2, 8), (4, 3, 6), (4, 4, 5), (4, 5, 4), (4, 6, 3), (4, 7, 2), (4, 8, 1),
 (5, 1, 10), (5, 2, 6), (5, 3, 4), (5, 4, 3), (5, 5, 2), (5, 6, 1),
 (6, 1, 9),  (6, 2, 6), (6, 3, 4), (6, 4, 3), (6, 5, 2), (6, 6, 1);

-- Sprint points (8-7-6-5-4-3-2-1) for the current system
INSERT INTO ruleset_sprint_points (ruleset_id, finish_position, points) VALUES
 (1, 1, 8), (1, 2, 7), (1, 3, 6), (1, 4, 5), (1, 5, 4), (1, 6, 3), (1, 7, 2), (1, 8, 1);
