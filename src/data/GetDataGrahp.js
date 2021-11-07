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
      }
      pokemon_v2_pokemonstats {
        base_stat
      }
    }
  }
`;

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
      for (const pokemon of pokemons) {
        var pok = new Object();
        pok.cp = GetPokemonCP(pokemon.pokemon_v2_pokemonstats);
        pok.name = pokemon.name;
        pok.order = pokemon.order;
        pok.id = pokemon.id;
        pok.kind = "normal";
        pok.gen = pokemon.pokemon_v2_pokemonspecy.generation_id;
        pok.tags = [];

        pok.visible = true;
        pok.released = false;

        if (releasedList.includes(pok.id)) pok.released = true;
        if (pokemon.pokemon_v2_pokemonspecy.is_baby) pok.tags.push("baby");
        if (pokemon.pokemon_v2_pokemonspecy.is_legendary) pok.tags.push("legendary");
        if (pokemon.pokemon_v2_pokemonspecy.is_mythical) pok.tags.push("mythical");
        if (pokemon.pokemon_v2_pokemonforms[0].is_mega) pok.tags.push("mega");
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
          pok.order = pok.id + 200;
        }

        pok.sprite =
          "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/" +
          pok.id +
          ".png";

        var rawList = [
          10093, 10080, 10081, 10082, 10083, 10084, 10085, 10094, 10095, 10096, 10097, 10098, 10099,
          10148, 10149, 10065, 10057, 10085, 10017, 10175, 10116, 10117, 10406, 10130,
        ];
        if (rawList.includes(pok.id))
          pok.sprite =
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/" +
            pok.id +
            ".png";

        if (pok.name.includes("castform-")) {
          var evArr = pok.name.split("castform");
          var newname = 351 + evArr[1] + ".svg";
          pok.sprite =
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/" +
            newname;
        }

        var includeForms = [412, 413, 421, 422, 423, 585, 586];
        if (pokemon.pokemon_v2_pokemonforms[1] && includeForms.includes(pok.id)) {
          var forms = pokemon.pokemon_v2_pokemonforms;

          forms.map((form, index) => {
            var pokf = Object.assign({}, pok);
            pokf.id = form.id;
            pokf.name = form.name;
            var newname = form.name.split("-");
            if (newname.length > 0 && index > 0) {
              pokf.imgname = pok.id + "-" + newname[1];
              pokf.sprite =
                "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/" +
                pokf.imgname +
                ".svg";

              var rawList2 = [664, 665, 666, 676, 670, 671, 773, 774, 10136];
              if (rawList2.includes(pok.id)) {
                pokf.sprite =
                  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/" +
                  pokf.imgname +
                  ".png";
              }
            }
            if (!ExcludeList.includes(pokf.id)) pokeList.push(pokf);
          });
        } else {
          if (!ExcludeList.includes(pok.id)) pokeList.push(pok);
        }
      }
      // setpokemonList(pokeList);
    });
  // }, []);
  // console.log(pokeList, 'tam ta ram');
  return pokeList;
}

export default GetDataGrahp;

//https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png //ARTWORK
//https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/412-sandy.svg //SVG
//https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/10099.png //SPRITE
