function GetPokemonCP(pStats) {
  var CP_Multiplier = 0.7903001;
  var BAttack = pStats[1].base_stat;
  var BDefense = pStats[2].base_stat;
  var BStamina = pStats[0].base_stat;
  var SAttack = pStats[3].base_stat;
  var SDefense = pStats[4].base_stat;
  var BSpeed = pStats[5].base_stat;

  var SeedMod = 1 + (BSpeed - 75) / 500;

  var Base_Attack = Math.round(
    ((1 / 4) * Math.min(BAttack, SAttack) + (7 / 4) * Math.max(BAttack, SAttack)) * SeedMod
  );

  var Base_Defense = Math.round(
    ((3 / 4) * Math.min(BDefense, SDefense) + (5 / 4) * Math.max(BDefense, SDefense)) * SeedMod
  );

  var Base_HP = Math.floor(BStamina * 1.75 + 50);

  var cp = Math.round(
    ((Base_Attack + 15) *
      Math.pow(Base_Defense + 15, 0.5) *
      Math.pow(Base_HP + 15, 0.5) *
      Math.pow(CP_Multiplier, 2)) /
      10
  );

  if (cp > 4200)
    cp = Math.round(
      ((Base_Attack * 0.91 + 15) *
        Math.pow(Base_Defense * 0.91 + 15, 0.5) *
        Math.pow(Base_HP * 0.91 + 15, 0.5) *
        Math.pow(0.7903001, 2)) /
        10
    );
  return cp;
}

export default GetPokemonCP;
