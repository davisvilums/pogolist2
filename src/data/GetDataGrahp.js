import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import GetPokemonCP from "./datasets/GetPokemonCP";
// import ReleasedList from "./datasets/ReleasedList";
import ExcludeList from "./datasets/ExcludeList";

const client = new ApolloClient({
  uri: "https://beta.pokeapi.co/graphql/v1beta",
  cache: new InMemoryCache({}),
});

var releasedList;
fetch("./data/released.json")
  .then((response) => response.json())
  .then((data) => (releasedList = data.released));
// .then((data) => console.log(data.released));

const getPokemonQuery = gql`
  {
    pokemon_v2_pokemon {
      name
      id
      order
      pokemon_v2_pokemonspecy {
        id
        is_mythical
        is_legendary
        is_baby
        name
        evolves_from_species_id
        generation_id
      }
      pokemon_v2_pokemonforms {
        name
        id
        is_default
        is_mega
        pokemon_v2_pokemonformsprites {
          sprites
        }
      }
      pokemon_v2_pokemonstats {
        base_stat
      }
    }
  }
`;

function determineSprite(pokemon) {
  let spriteUrl;

  // Specific sprite overrides based on unique IDs or conditions
  const specialSprites = {
    // 10178:
    //   "https://archives.bulbagarden.net/media/upload/thumb/3/39/HOME555GZ.png/220px-HOME555GZ.png",
    // 10182:
    //   "https://archives.bulbagarden.net/media/upload/3/32/902Basculegion.png",
    // 10183:
    //   "https://archives.bulbagarden.net/media/upload/thumb/0/01/HOME845Go.png/220px-HOME845Go.png",
    // Add other special cases here
  };

  // Check if there's a special sprite for this Pokemon ID
  if (specialSprites[pokemon.id]) {
    return specialSprites[pokemon.id];
  }

  // Use different artwork based on certain conditions or ID ranges
  if (pokemon.id > 891 && pokemon.id < 1000) {
    spriteUrl = `https://assets.pokemon.com/assets/cms2/img/pokedex/detail/${pokemon.id}.png`;
  } else if (pokemon.name.includes("-gmax")) {
    spriteUrl = `https://img.pokemondb.net/artwork/avif/${pokemon.name}.avif`;
  } else {
    // Default to official artwork for most cases
    spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
  }

  return spriteUrl;
}

async function GetDataGrahp() {
  var pokeList = new Array();
  // const [pokemonList, setpokemonList] = useState(null);
  // console.log(pokeList, 'EXPORT2');
  // useEffect(() => {
  await client
    .query({
      query: getPokemonQuery,
    })
    .then((result) => {
      var pokemons = result.data.pokemon_v2_pokemon;
      // console.log("TEST 1", pokemons);
      for (const pokemon of pokemons) {
        var pok = {
          cp: GetPokemonCP(pokemon.pokemon_v2_pokemonstats),
          name: pokemon.name,
          order: pokemon.order,
          id: pokemon.id,
          kind: "normal",
          gen: pokemon.pokemon_v2_pokemonspecy.generation_id,
          tags: [],
          visible: true,
          // released: releasedList.includes(pokemon.id),
          released: true,
          sprite: determineSprite(pokemon), // Assume determineSprite is a function you define to clean up sprite determination
        };

        if (pokemon.pokemon_v2_pokemonspecy.is_baby) pok.tags.push("baby");
        if (pokemon.pokemon_v2_pokemonspecy.is_legendary)
          pok.tags.push("legendary");
        if (pokemon.pokemon_v2_pokemonspecy.is_mythical)
          pok.tags.push("mythical");
        // if (pokemon.pokemon_v2_pokemonforms[0].is_mega) pok.tags.push("mega");
        if (pokemon.name.includes("-gmax")) pok.tags.push("gmax");

        if (pokemon.order < 0) {
          var evPoId = pokemon.pokemon_v2_pokemonspecy.evolves_from_species_id;
          if (evPoId) {
            var obj = pokeList.find(function (pok) {
              if (pok && pok.id == evPoId) return true;
            });
            if (obj && obj.order > 0) pok.order = obj.order + 0.1;
          }
        }
        if (pok.order < 0) {
          pok.order = pok.id + 20000;
        }

        var includeForms = [
          412, 413, 421, 422, 423, 585, 586, 666, 669, 670, 671, 676,
        ];
        // var includeForms = [];
        if (
          pokemon.pokemon_v2_pokemonforms[1] &&
          includeForms.includes(pok.id)
        ) {
          var forms = pokemon.pokemon_v2_pokemonforms;
          // console.log("form 1", forms);
          forms.map((form, index) => {
            var pokf = Object.assign({}, pok);
            // console.log("pokf", pokf);
            pokf.id = form.id + 10000;
            pokf.name = form.name;
            var newname = form.name.split("-");
            if (newname.length > 0 && index > 0) {
              pokf.imgname = pok.id + "-" + newname[1];
              pokf.sprite =
                "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/" +
                pokf.imgname +
                ".svg";

              var rawList2 = [664, 665, 666, 676, 670, 671, 773, 774, 10136];
              // var rawList2 = [];
              if (rawList2.includes(pok.id)) {
                pokf.sprite =
                  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/" +
                  pokf.imgname +
                  ".png";
              }

              var sprites = form.pokemon_v2_pokemonformsprites[0].sprites;
              // console.log("sprites", sprites);
              if (sprites) {
                // var spar = JSON.parse(sprites);
                pokf.sprite = sprites.front_default;
                // console.log("sprite", spar.front_default);
              }
              // console.log("form 2", form);
              if (10086 == form.id) {
                pokf.sprite =
                  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/666-icy-snow.png";
              }
            }
            /*
             */
            // if (!ExcludeList.includes(pokf.id))
            pokeList.push(pokf);
          });
        } else {
          // if (!ExcludeList.includes(pok.id))
          pokeList.push(pok);
        }

        // pokeList.push(pok);
      }
      // setpokemonList(pokeList);
    });
  // }, []);
  // console.log(pokeList, "tam ta ram");
  return pokeList;
}

export default GetDataGrahp;

//https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png //ARTWORK
//https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/412-sandy.svg //SVG
//https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/10099.png //SPRITE
