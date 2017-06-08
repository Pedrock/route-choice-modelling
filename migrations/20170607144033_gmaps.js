
exports.up = function up(knex) {
  return knex.schema
  .raw(`
  CREATE TABLE gmaps_edges (
    edgeid INTEGER PRIMARY KEY REFERENCES edges(id),
    placeId VARCHAR(64) NOT NULL,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    snappedPoints JSON NOT NULL,
    geometry geometry(LineString,4326) NOT NULL
  )`).raw(`
  CREATE TABLE gmaps_distances (
    fromedgeid INTEGER NOT NULL REFERENCES edges(id),
    toedgeid INTEGER NOT NULL REFERENCES edges(id),
    distance INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    PRIMARY KEY (fromedgeid, toedgeid)
  )`).raw(`CREATE FUNCTION on_gmaps_edges_insert()
    RETURNS TRIGGER AS $$
  BEGIN
    SELECT ST_MakeLine(ST_SetSRID(ST_POINT((location->'longitude')::text::numeric, (location->'latitude')::text::numeric), 4326)) INTO NEW.geometry
    FROM json_to_recordset(NEW.snappedpoints) AS (location json);
    RETURN NEW;
  END $$ LANGUAGE 'plpgsql';`)
  .raw(`CREATE TRIGGER trigger_gmaps_edges_insert
  BEFORE INSERT ON gmaps_edges
  FOR EACH ROW
  EXECUTE PROCEDURE on_gmaps_edges_insert();`);
};

exports.down = function down(knex) {
  return knex.schema
  .raw('DROP TABLE gmaps_edges')
  .raw('DROP TABLE gmaps_distances')
  .raw('DROP TRIGGER trigger_gmaps_edges_insert ON gmaps_edges')
  .raw('DROP FUNCTION on_gmaps_edges_insert()');
};
