
exports.up = function up(knex) {
  return knex.schema
  .raw(`
  CREATE TABLE gmaps_edges (
    edgeid INTEGER PRIMARY KEY REFERENCES edges(id),
    placeId VARCHAR(64) NOT NULL,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    snappedPoints JSON NOT NULL
  )`).raw(`
  CREATE TABLE gmaps_distances (
    fromedgeid INTEGER NOT NULL REFERENCES edges(id),
    toedgeid INTEGER NOT NULL REFERENCES edges(id),
    distance INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    PRIMARY KEY (fromedgeid, toedgeid)
  )`);
};

exports.down = function down(knex) {
  return knex.schema
  .raw('DROP TABLE gmaps_edges')
  .raw('DROP TABLE gmaps_distances');
};
