
exports.up = function up(knex) {
  return knex.schema
  .raw("CREATE TYPE gender_t AS ENUM ('male', 'female')")
  .raw(`CREATE TABLE surveys (
    id SERIAL PRIMARY KEY,
    age INTEGER NOT NULL,
    experience INTEGER NOT NULL,
    gender gender_t NOT NULL,
    birth VARCHAR(64) NOT NULL,
    locality VARCHAR(64) NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`)
  .raw(`CREATE TABLE surveys_routes (
    id SERIAL PRIMARY KEY,
    survey_id INTEGER NOT NULL REFERENCES surveys(id),
    initialEdge INTEGER NOT NULL,
    finalEdge INTEGER NOT NULL,
    help BOOLEAN NOT NULL,
    path INTEGER[] NOT NULL,
    numKnownRoutes VARCHAR(3),
    index INTEGER NOT NULL
  );`)
  .raw(`CREATE OR REPLACE FUNCTION insertCompletedSurvey(json_obj json) RETURNS VOID AS $BODY$
  DECLARE
    survey_id INT;
  BEGIN
    INSERT INTO surveys(age, experience, gender, birth, locality)
    SELECT * FROM json_to_record(json_obj->'form') AS (age int, experience int, gender gender_t, birth varchar, locality varchar)
    RETURNING id INTO survey_id;
  
    INSERT INTO surveys_routes(survey_id, initialEdge, finalEdge, help, path, numKnownRoutes, index)
    SELECT survey_id, "initialEdge", "finalEdge", help, path_array AS path, "numKnownRoutes", row_number() over() AS index
    FROM json_array_elements(json_obj->'routes') routes
      CROSS JOIN json_to_record(routes) AS ("initialEdge" int, "finalEdge" int, help boolean, path json, "numKnownRoutes" varchar),
      LATERAL (
      SELECT array_agg(path_pg::text::int) path_array
      FROM json_array_elements(path) path_pg
      ) aux_lateral;
  END;
  $BODY$ LANGUAGE plpgsql;`);
};

exports.down = function down(knex) {
  return knex.schema
    .raw('DROP FUNCTION insertCompletedSurvey(json_obj json)')
    .raw('DROP TABLE surveys_routes')
    .raw('DROP TABLE surveys')
    .raw('DROP TYPE gender_t');
};
