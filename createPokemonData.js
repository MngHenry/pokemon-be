const fs= require('fs');
const csv = require('csvtojson');

const createPokemonData = async() => {
  let newData = await csv().fromFile("Pokemon.csv");
  newData = Array.from(newData);
  newData = newData.map((e) =>{
    return {
      id: e["#"],
      name: e.Name,
      types: [e["Type 1"], e["Type 2"]],
      url: `http://localhost:5000/images/${e["#"]}.png`,
    };
  })
  // newData = new Set(newData.map((obj) => obj["id"]));
  console.log(newData);
  // let data = fs.readFileSync("db.json");
  // data = JSON.parse(data);
  // data.PokemonData = newData;
  // fs.writeFileSync("db.json", JSON.stringify(data));
  // console.log('done')n
}

createPokemonData()