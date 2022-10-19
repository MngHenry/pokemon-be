const express = require('express');
const fs = require('fs');
const { restart } = require('nodemon');
const router = express.Router();
const crypto = require("crypto");
const { request } = require('https');
const { info } = require("console");

//router get pokemons

router.get("/", function (req, res, next) {
  const allowedFilter = ["id", "name", "type", "page", "limit", "search"];
  try {
    let { page, limit, ...filterQuery } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    const filterKeys = Object.keys(filterQuery);

    filterKeys.forEach((key) => {
      if (!allowedFilter.includes(key)) {
        const exception = new Error(`Query ${key} is not allowed`);
        exception.statusCode = 401;
        throw exception;
      }
      if (!filterQuery[key]) delete filterKeys[key];
    });

    let offset = limit * (page - 1);

    let db = fs.readFileSync("db.json", "utf8");
    db = JSON.parse(db);
    const { PokemonData } = db;
    let result = [];
    if (filterKeys.length) {
      filterKeys.forEach((condition) => {
        let value = filterQuery[condition].toLowerCase();
        if (condition === "search") {
          parseInt(value) ? (condition = "id") : (condition = "name");
        }
        if (condition === "type") {
          condition = "types";
        }
        result = result.length
          ? result.filter((pokemon) => pokemon[condition].includes(value))
          : PokemonData.filter((pokemon) => pokemon[condition].includes(value));
      });
    } else {
      result = PokemonData;
    }

    result = result.slice(offset, offset + limit);

    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});

router.get(`/:pokemonId`, (req, res, next) => {
  try {
    const { pokemonId } = req.params;

    let db = JSON.parse(fs.readFileSync("db.json", "utf-8"));
    const { PokemonData } = db;

    let result = { previousPokemon: "", pokemon: "", nextPokemon: "" };
    const targetPokemon = PokemonData.findIndex(
      (pokemon) => pokemon.id === pokemonId
    );

    if (targetPokemon < 0) {
      const exception = new Error("Pokemon not found");
      exception.statusCode = 404;
      throw exception;
    }

    for (let i = -1; i < 2; i++) {
      let value = 0;
      parseInt(pokemonId) + i === 0
        ? (value = PokemonData.length)
        : (value = parseInt(pokemonId) + i);
      let resultId = [];
      resultId = PokemonData.filter(
        (pokemon) => pokemon.id === value.toString()
      );
      if (i < 0) {
        result.previousPokemon = resultId[0];
      } else if (i === 0) {
        result.pokemon = resultId[0];
      } else {
        result.nextPokemon = resultId[0];
      }
    }

    result = result;

    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});

router.post("/", (req, res, next) => {
  try {
    const { name, id, types, url } = req.body;
    if (!name || !id || !types || !url) {
      const exception = new Error("Missing info of pokemon");
      exception.statusCode = 401;
      throw exception;
    }

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
      "",
    ];

    // check types and
    if (types.length > 2) {
      const exception = new Error("types of pokemon amount is over 2");
      exception.statusCode = 401;
      throw exception;
    }
    types.map((type) => {
      if (!pokemonTypes.includes(type)) {
        const exception = new Error("Pokémon type is invalid");
        exception.statusCode = 401;
        throw exception;
      }
    });

    const newPokemon = {
      id,
      name,
      types,
      url,
    };

    // handle validated of type

    let db = fs.readFileSync("db.json", "utf8");
    db = JSON.parse(db);
    const { PokemonData } = db;
    PokemonData.filter((pokemon) => {
      if (
        pokemon["name"].includes(newPokemon["name"]) ||
        pokemon["id"].toString().includes(newPokemon["id"])
      ) {
        const exception = new Error(
          `Id or Name of Pokémon is exists. Note: Id should be over ${PokemonData.length}`
        );
        exception.statusCode = 401;
        throw exception;
      }
    });

    PokemonData.push(newPokemon);
    db.PokemonData = PokemonData;

    db = JSON.stringify(db);
    fs.writeFileSync("db.json", db);
    res.status(200).send(newPokemon);
  } catch (error) {
    next(error);
  }
});

router.put(`/:pokemonId`, (req, res, next) => {
  try {
    const allowedUpdate = ["name", "type", "url"];
    const { pokemonId } = req.params;
    const updates = req.body;

    const updateKeys = Object.keys(updates);

    const notAllow = updateKeys.filter((e) => !allowedUpdate.includes(e));

    if (notAllow.length) {
      const exception = new Error(`Update field not allow`);
      exception.statusCode = 401;
      throw exception;
    }

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

    if (updates.types.length > 2) {
      const exception = new Error(
        "types of pokemon amount is over 2 or Id is not a number"
      );
      exception.statusCode = 401;
      throw exception;
    }

    updates.types.map((type) => {
      if (!pokemonTypes.includes(type)) {
        const exception = new Error("Pokémon type is invalid");
        exception.statusCode = 401;
        throw exception;
      }
    });

    let db = JSON.parse(fs.readFileSync("db.json", "utf8"));
    const { PokemonData } = db;

    const targetPokemon = PokemonData.findIndex(
      (pokemon) => pokemon["id"] === pokemonId
    );
    if (targetPokemon < 0) {
      const exception = new Error(`Pokemon not found`);
      exception.statusCode = 404;
      throw exception;
    }

    const updatedPokemon = { ...db.PokemonData[targetPokemon], ...updates };
    db.PokemonData[targetPokemon] = updatedPokemon;
    db = JSON.stringify(db);
    fs.writeFileSync("db.json", db);
    res.status(200).send(updatedPokemon);
  } catch (error) {
    next(error);
  }
});

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