const https = require('https');
const fs = require('fs');
const path = require('path');

const GRAPHQL_URL = 'https://beta.pokeapi.co/graphql/v1beta';

const query = `{
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
}`;

function calculateCP(stats) {
  if (!stats || stats.length < 6) return 0;
  const hp = stats[0].base_stat;
  const attack = stats[1].base_stat;
  const defense = stats[2].base_stat;
  const spAttack = stats[3].base_stat;
  const spDefense = stats[4].base_stat;
  const speed = stats[5].base_stat;

  // Speed modifier: 1 + (Speed - 75) / 500
  const speedMod = 1 + (speed - 75) / 500;

  // Attack: round((1/4 * min + 7/4 * max) * SpeedMod)
  // This equals: round((0.25 * min + 1.75 * max) * SpeedMod)
  const baseAttack = Math.round(
    (0.25 * Math.min(attack, spAttack) + 1.75 * Math.max(attack, spAttack)) * speedMod
  );

  // Defense: round((3/4 * min + 5/4 * max) * SpeedMod)
  // This equals: round((0.75 * min + 1.25 * max) * SpeedMod)
  const baseDefense = Math.round(
    (0.75 * Math.min(defense, spDefense) + 1.25 * Math.max(defense, spDefense)) * speedMod
  );

  // HP/Stamina: floor(HP * 1.75 + 50)
  const baseHP = Math.floor(hp * 1.75 + 50);

  // CP Multiplier at level 40
  const cpMultiplier = 0.7903001;

  // Calculate max CP at level 40 with 15/15/15 IVs
  // CP = floor((Attack + 15) * sqrt(Defense + 15) * sqrt(HP + 15) * CPM^2 / 10)
  let cp = Math.floor(
    ((baseAttack + 15) * Math.sqrt(baseDefense + 15) * Math.sqrt(baseHP + 15) * Math.pow(cpMultiplier, 2)) / 10
  );

  // Apply 9% nerf for Pokemon with CP >= 4000
  if (cp >= 4000) {
    const nerfedAttack = Math.round(baseAttack * 0.91);
    const nerfedDefense = Math.round(baseDefense * 0.91);
    const nerfedHP = Math.floor(baseHP * 0.91);
    cp = Math.floor(
      ((nerfedAttack + 15) * Math.sqrt(nerfedDefense + 15) * Math.sqrt(nerfedHP + 15) * Math.pow(cpMultiplier, 2)) / 10
    );
  }

  return Math.max(10, cp);
}

function determineSprite(pokemon) {
  // Local sprites for Koraidon/Miraidon forms
  const specialSprites = {
    10264: './img/pokemon/10264.png',
    10265: './img/pokemon/10265.png',
    10266: './img/pokemon/10265.png',
    10267: './img/pokemon/10264.png',
    10268: './img/pokemon/10268.png',
    10269: './img/pokemon/10269.png',
    10270: './img/pokemon/10270.png',
    10271: './img/pokemon/10271.png',
  };

  if (specialSprites[pokemon.id]) {
    return specialSprites[pokemon.id];
  }

  // Use home sprites for gmax Pokemon (more reliable than pokesprite)
  if (pokemon.name.includes('-gmax')) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemon.id}.png`;
  }

  // Use home sprites for alternate forms that may not have official artwork
  if (pokemon.id >= 10000) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemon.id}.png`;
  }

  // Default to official artwork for base Pokemon
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
}

function fetchGraphQL() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query });

    const options = {
      hostname: 'beta.pokeapi.co',
      path: '/graphql/v1beta',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('Fetching Pokemon data from PokeAPI GraphQL...');

  try {
    const result = await fetchGraphQL();
    const pokemons = result.data.pokemon_v2_pokemon;

    console.log(`Fetched ${pokemons.length} Pokemon entries`);

    const pokeList = [];
    const includeForms = [412, 413, 421, 422, 423, 585, 586, 666, 669, 670, 671, 676];

    for (const pokemon of pokemons) {
      const pok = {
        cp: calculateCP(pokemon.pokemon_v2_pokemonstats),
        name: pokemon.name,
        order: pokemon.order,
        id: pokemon.id,
        kind: 'normal',
        gen: pokemon.pokemon_v2_pokemonspecy?.generation_id || 0,
        tags: [],
        visible: true,
        released: false,
        sprite: determineSprite(pokemon),
        selected: false,
      };

      if (pokemon.pokemon_v2_pokemonspecy?.is_baby) pok.tags.push('baby');
      if (pokemon.pokemon_v2_pokemonspecy?.is_legendary) pok.tags.push('legendary');
      if (pokemon.pokemon_v2_pokemonspecy?.is_mythical) pok.tags.push('mythical');
      if (pokemon.name.includes('-mega')) pok.tags.push('mega');
      if (pokemon.name.includes('-gmax')) pok.tags.push('gmax');

      // Paradox Legendaries (not marked as legendary in PokeAPI)
      const paradoxLegendaries = [1009, 1010, 1020, 1021, 1022, 1023];
      if (paradoxLegendaries.includes(pok.id) && !pok.tags.includes('legendary')) {
        pok.tags.push('legendary');
      }

      // Ultra Beasts
      const ultraBeasts = [793, 794, 795, 796, 797, 798, 799, 803, 804, 805, 806];
      if (ultraBeasts.includes(pok.id)) {
        pok.tags.push('ultra');
      }

      if (pokemon.order < 0) {
        const evPoId = pokemon.pokemon_v2_pokemonspecy?.evolves_from_species_id;
        if (evPoId) {
          const obj = pokeList.find((p) => p && p.id === evPoId);
          if (obj && obj.order > 0) pok.order = obj.order + 0.1;
        }
      }
      if (pok.order < 0) {
        pok.order = pok.id + 20000;
      }

      if (pokemon.pokemon_v2_pokemonforms[1] && includeForms.includes(pokemon.id)) {
        const forms = pokemon.pokemon_v2_pokemonforms;
        forms.forEach((form, index) => {
          const pokf = { ...pok };
          pokf.id = form.id + 10000;
          pokf.name = form.name;
          const newname = form.name.split('-');
          if (newname.length > 1 && index > 0) {
            pokf.imgname = pok.id + '-' + newname[1];
            pokf.sprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${pokf.imgname}.svg`;

            const rawList2 = [664, 665, 666, 676, 670, 671, 773, 774, 10136];
            if (rawList2.includes(pok.id)) {
              pokf.sprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokf.imgname}.png`;
            }

            const sprites = form.pokemon_v2_pokemonformsprites[0]?.sprites;
            if (sprites && sprites.front_default) {
              pokf.sprite = sprites.front_default;
            }
            if (form.id === 10086) {
              pokf.sprite = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/666-icy-snow.png';
            }
          }
          pokeList.push(pokf);
        });
      } else {
        pokeList.push(pok);
      }
    }

    // Sort by CP descending
    pokeList.sort((a, b) => b.cp - a.cp);

    const outputPath = path.join(__dirname, '../public/data/pokelist.json');
    fs.writeFileSync(outputPath, JSON.stringify({ pokelist: pokeList }, null, 2));

    console.log(`\nGenerated pokelist.json with ${pokeList.length} Pokemon`);

    // Stats
    const maxId = Math.max(...pokeList.filter(p => p.id < 10000).map(p => p.id));
    const gens = [...new Set(pokeList.map(p => p.gen))].sort((a, b) => a - b);

    console.log(`Max base Pokemon ID: ${maxId}`);
    console.log(`Generations: ${gens.join(', ')}`);
    console.log(`\nBreakdown by generation:`);

    for (const gen of gens) {
      const count = pokeList.filter(p => p.gen === gen).length;
      console.log(`  Gen ${gen}: ${count} Pokemon`);
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
