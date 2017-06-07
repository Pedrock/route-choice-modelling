
exports.up = function up(knex) {
  return knex.schema
  .raw(`
  CREATE TABLE gmaps_edges (
    edgeid INTEGER PRIMARY KEY REFERENCES edges(id),
    placeId VARCHAR(64) NOT NULL,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    snappedPoints JSON NOT NULL
  )`);
};

exports.down = function down(knex) {
  return knex.schema
  .raw('DROP TABLE gmaps_edges');
};