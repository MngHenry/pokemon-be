const express = require('express');
const fs = require('fs');
const { restart } = require('nodemon');
const router = express.Router();
const crypto = require("crypto");
const { request } = require('https');
 
//router get pokemons

router.get('/', function (req, res, next) {
  const allowedFilter = ["id", "name", "types", "page", "limit"];
  try {
    let { page, limit, ...filterQuery } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    const filterKeys = Object.keys(filterQuery);

    filterKeys.forEach((key) => {
      if(!allowedFilter.includes(key)) {
        const exception = new Error(`Query ${key} is not allowed`);
        exception.statusCode = 401;
        throw exception;
      }
      if(!filterQuery[key]) delete filterKeys[key]
    });

    let offset = limit * (page - 1);

    let db = fs.readFileSync("db.json", "utf8");
    db = JSON.parse(db);
    const { PokemonData } = db;
    let result = [];
    if(filterKeys.length){
      filterKeys.forEach((condition)=> {
          result = result.length
            ? result.filter(
                (pokemon) => pokemon[condition] === filterQuery[condition]
              )
            : PokemonData.filter(
                (pokemon) => pokemon[condition] === filterQuery[condition]
              );
      })
    } else {
      result = PokemonData;
    }

    result = result.slice(offset, offset + limit)

    res.status(200).send(result);

  } catch (error) {
    next(error);
  }
});

router.post("/",(req, res, next) => {
  try {
    const { name, type, url} = req.body;
    if(!name || !type || !url) {
      const exception = new Error("Missing info of pokemon");
      exception.statusCode = 401;
      throw exception;
    }
    const newPokemon = {
      name,
      type,
      url,
      id: crypto.randomBytes(4).toString("hex"),
    };
    let db = fs.readFileSync("db.json", "utf8");
    db = JSON.parse(db);
    const { PokemonData } = db;

    PokemonData.push(newPokemon);
    db.PokemonData = PokemonData;
    db = JSON.stringify(db);
    fs.writeFileSync("db.json", db);
    res.status(200).send(newPokemon);
  } catch (error) {
    next(error);
  }
})

router.put("/:pokemonId", (req, res, next) => {
  try {
    const allowedUpdate =  [ "name", "types", "url"]
    const { pokemonId } = req.params
    const updates = req.body
    const updateKeys = Object.keys(updates)

    const notAllow = updateKeys.filter( e => !allowedUpdate.includes(e) );

    if(notAllow.length){
      const exception = new Error(`Update field not allow`);
      exception.statusCode = 401;
      throw exception;
    }

    let db = JSON.parse(fs.readFileSync("db.json", "utf8"))
    const { PokemonData } = db;

    const targetPokemon = PokemonData.findIndex (
      (pokemon) => pokemon.id === pokemonId
    );
    if(targetPokemon < 0) {
      const exception = new Error(`Pokemon not found`);
      exception.statusCode = 404;
      throw exception;
    };

    const updatedPokemon = { ...db.PokemonData[targetPokemon], ...updates };
    db.PokemonData[targetPokemon] = updatedPokemon;
    db=JSON.stringify(db);
    fs.writeFileSync("db.json",db);
    res.status(200).send(updatedPokemon);

  } catch (error) {
    next(error);
  }
})

router.delete(`/:pokemonId`, (req, res, next) => {
  try {
    const { pokemonId } = req.params;
    
    let db = JSON.parse(fs.readFileSync("db.json", "utf-8"));
    const { PokemonData } = db;

    const targetPokemon = PokemonData.findIndex(
      (pokemon) => pokemon.id === pokemonId
    );
    
    if( targetPokemon < 0) {
      const exception = new Error("Pokemon not found");
      exception.statusCode = 404;
      throw exception;
    }

    db.PokemonData = PokemonData.filter((pokemon) => pokemon.id !== pokemonId);

    db = JSON.stringify(db);

    fs.writeFileSync("db.json", db);
    
    res.status(200).send({});
  } catch (error) {
    next(error);
  }
});

module.exports = router;