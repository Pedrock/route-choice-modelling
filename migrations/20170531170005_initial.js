
exports.up = function up(knex) {
  return knex.schema
  .raw(`CREATE FUNCTION getEdgeFinalHeading(edge integer) RETURNS double precision
    LANGUAGE sql
    AS $$
SELECT ST_Azimuth((array_agg(point))[2],(array_agg(point))[1])
FROM (
       SELECT ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) AS point, index
       FROM edgepoints
         JOIN points ON (edgepoints.pointid = points.id)
       WHERE edgeid = edge
       ORDER BY index DESC
       LIMIT 2
     ) aux;
$$;`)
  .raw(`CREATE FUNCTION getPathToIntersectionFromEdge(edge integer) RETURNS integer[]
    LANGUAGE plpgsql
    AS $$
DECLARE
  finished BOOLEAN;
  currEdge INTEGER;
  possibleEdges INTEGER[];
  path INTEGER[];
BEGIN
  SELECT FALSE INTO finished;
  SELECT edge INTO currEdge;
  SELECT ARRAY[edge] INTO path;

  WHILE finished = FALSE LOOP
    -- Get possible edge choices from the current edge
    SELECT array_agg(toedgeid) INTO possibleEdges
    FROM (
           SELECT toedgeid
           FROM connections
           WHERE fromedgeid = currEdge AND connections.allow = 1
           GROUP BY toedgeid
         ) aux;

    -- If there is one and only one possible edge choice keep looping
    SELECT array_length(possibleEdges, 1) <> 1 INTO finished;
    IF NOT finished THEN
      SELECT possibleEdges[1] INTO currEdge;
      SELECT path || ARRAY[currEdge] INTO path;
      SELECT currEdge = edge INTO finished; -- avoid infinite loops
    END IF;

  END LOOP;
  RETURN path;
END;
$$;`);
};

exports.down = function down(knex) {
  return knex.schema
  .raw('DROP FUNCTION getPathToIntersectionFromEdge(integer)')
  .raw('DROP FUNCTION getEdgeFinalHeading(integer)');
};
