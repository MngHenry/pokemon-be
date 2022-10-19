const fs= require('fs');
const csv = require('csvtojson');
const { enabled } = require("./app");
const { resourceLimits } = require("worker_threads");

const createPokemonData = async () => {
  let moreData = [];
  let response = await csv().fromFile("pokemon2.csv");
  moreData = response.map((e) => {
    let arr = e.abilities.split(",");
    arr = arr.map((e) => e.replace(/[^a-zA-Z0-9]/g, ""));
    return {
      name: e.name,
      abilities: arr,
      category: e.classfication,
      height: `${e.height_m} m`,
      weight: `${e.weight_kg} kg`,
    };
  });
  let desData = fs.readFileSync("description.json");
  desData = JSON.parse(desData);
  const { description } = desData;

  let newData = await csv().fromFile("Pokemon.csv");
  newData = newData.map((e, index) => {
    let result = [];
    moreData.filter((value) => {
      if (value.name === e.Name) {
        result.push(
          value.name,
          value.abilities,
          value.category,
          value.height,
          value.weight
        );
      }
    });

    const pokemonTypes = [
      "bug",
      "dragon",
      "fairy",
      "fire",
      "ghost",
      "ground",
      "normal",
      "psychic",
      "steel",
      "dark",
      "electric",
      "fighting",
      "flyingText",
      "grass",
      "ice",
      "poison",
      "rock",
      "water",
    ];
    let desValue = [];
    pokemonTypes.map((type, index) => {
      if (type === e["Type 1"].toLowerCase()) {
        desValue.push(description[index]);
      }
    });
    return {
      id: (index + 1).toString(),
      name: e.Name.toLowerCase(),
      types: [e["Type 1"].toLowerCase(), e["Type 2"].toLowerCase()],
      url: `http://localhost:5000/images/${e["#"]}.png`,
      description: desValue[0],
      abilities: result[1],
      category: result[2],
      height: result[3],
      weight: result[4],
    };
  });
  let data = fs.readFileSync("db.json");
  data = JSON.parse(data);
  data.PokemonData = newData;
  fs.writeFileSync("db.json", JSON.stringify(data));
  console.log("done");
};

createPokemonData()