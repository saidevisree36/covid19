const express = require("express");
const path = require("path");
const { open } = require("sqlite");

const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`Db Error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
// get all state details
app.get("/states/", async (request, response) => {
  const getPlayerDetails = `SELECT * FROM state ;`;
  const stateArray = await db.all(getPlayerDetails);
  response.send(
    stateArray.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});

//get only one state
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getPlayerDetails = `SELECT * FROM state WHERE state_id=${stateId};`;
  const state = await db.get(getPlayerDetails);
  response.send(convertDbObjectToResponseObject(state));
});

// post district details
const convertDbObjectToResponseObject1 = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};
//get all districtdetails
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetails = `
     SELECT * FROM district
     WHERE district_id=${districtId};`;
  const getResponseDetails = await db.get(getDistrictDetails);
  response.send(convertDbObjectToResponseObject1(getResponseDetails));
});

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const getDistrictDetails = `
     INSERT INTO
     district (district_name, state_id,cases, cured, active, deaths)
     VALUES 
     (
         '${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;
  const districtVal = await db.run(getDistrictDetails);
  response.send("District Successfully Added");
});
// delete particular district
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const distinctDetails = request.body;
  const getDistrictDetails = `
    DELETE FROM district WHERE district_id=${districtId};`;
  const deleteItem = await db.run(getDistrictDetails);
  response.send("District Removed");
});

// put district
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const distinctDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = distinctDetails;
  const getDistrictDetails = `
  UPDATE 
      district
  SET
    district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
 WHERE district_id=${districtId}`;

  await db.run(getDistrictDetails);
  response.send("District Details Updated");
});

// get all state details

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsDetails = `
    SELECT 
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
    FROM district
    WHERE state_id=${stateId};`;
  const stats = await db.get(getStateStatsDetails);
  console.log(stats);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});
// add district details
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetails = `
    SELECT state_id FROM district 
    WHERE district_id=${districtId};`;
  const getDistrictIdQueryResponse = await db.get(getDistrictDetails);

  const getStateDetails = `
    SELECT state_name as stateName FROM state
    WHERE state_id=${getDistrictIdQueryResponse.state_id};`;
  const getStateIdQueryResponse = await db.get(getStateDetails);
  response.send(getStateIdQueryResponse);
});
module.exports = app;
