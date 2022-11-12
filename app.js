const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

/*

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    jerseyNumber: dbObject.jersey_number,
    role: dbObject.role,
  };
};
*/

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// API 1

app.get("/states/", async (request, response) => {
  const getStateDetails = `
        SELECT *
        FROM state;`;
  const dbResponse = await db.all(getStateDetails);
  console.log(dbResponse);
  const ans = [];
  for (let state of dbResponse) {
    let temp = {
      stateId: state.state_id,
      stateName: state.state_name,
      population: state.population,
    };
    //console.log(temp);
    ans.push(temp);
  }
  response.send(ans);
});

// API 2

app.get("/states/:stateId/", async (request, response) => {
  try {
    const { stateId } = request.params;
    const id = parseInt(stateId);
    const getStateQuery = `
    SELECT *
    FROM state
    WHERE state_id = ${id};`;

    const dbResponse = await db.get(getStateQuery);

    const temp = {
      stateId: dbResponse.state_id,
      stateName: dbResponse.state_name,
      population: dbResponse.population,
    };
    response.send(temp);
  } catch (e) {
    console.log(e);
  }
});

// API 3

app.post("/districts/", async (request, response) => {
  const query = `
    SELECT MAX(district_id) AS district_id
    FROM district
    `;
  const dbResponse = await db.get(query);
  const newId = dbResponse.district_id + 1;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
    INSERT INTO district(district_id,district_name,state_id,cases,cured,active,deaths)
    VALUES(${newId},
        "${districtName}",${stateId},${cases},${cured},${active},${deaths});`;
  await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

// API 4

app.get("/districts/:districtId/", async (request, response) => {
  const id = parseInt(request.params.districtId);

  const query = `
        SELECT *
        FROM district
        WHERE district_id = ${id};`;
  const dbResponse = await db.get(query);
  const temp = {
    districtId: dbResponse.district_id,
    districtName: dbResponse.district_name,
    stateId: dbResponse.state_id,
    cases: dbResponse.cases,
    cured: dbResponse.cured,
    active: dbResponse.active,
    deaths: dbResponse.deaths,
  };

  response.send(temp);
});

//API 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const id = parseInt(districtId);
  const deleteDistrictQuery = `
    DELETE FROM district
    WHERE district_id = ${id};`;
  let dbResponse = await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API 6

app.put("/districts/:districtId/", async (request, response) => {
  const id = parseInt(request.params.districtId);
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  console.log(id, districtName, stateId, cases, cured, active, deaths);

  const deleteDistrictQuery = `
    UPDATE district
    SET 
        district_name = "${districtName}",
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE district_id = ${id};`;
  let dbResponse = await db.run(deleteDistrictQuery);
  response.send("District Details Updated");
});

//API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const id = parseInt(stateId);
  const getStatsQuery = `
    SELECT SUM(cases) as totalCases,SUM(cured) as totalCured,
        SUM(active) as totalActive,
        SUM(deaths) as totalDeaths
    FROM district LEFT JOIN state ON district.state_id = state.state_id
    WHERE district.state_id = ${id}`;
  const dbResponse = await db.all(getStatsQuery);
  response.send(dbResponse);
});

//API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const id = parseInt(request.params.districtId);
  const query = `
    SELECT state.state_name as stateName
    FROM district JOIN state ON district.state_id = state.state_id
    WHERE district.district_id = ${id};`;
  const dbResponse = await db.get(query);
  response.send(dbResponse);
});

module.exports = app;
