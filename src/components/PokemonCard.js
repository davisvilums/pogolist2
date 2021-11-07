import * as React from "react";
import { styled, useTheme, alpha } from "@mui/material/styles";
import { Box, ThemeProvider, createTheme } from "@mui/system";
// import styled from "styled-components";

const PokemonItem = styled("div")`
  border: 1px solid #ddd;
  width: 100px;
  display: flex;
  justify-content: center;
  flex-direction: column;
  position: relative;
  margin: 0 -1px -1px 0;
  cursor: pointer;
  &.selected {
    background: rgba(85, 108, 214, 0.08);
  }
  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
`;

const PokemonID = styled("div")`
  position: absolute;
  top: 0;
  left: 0;
  font-size: 12px;
  padding: 1px 3px;
`;

const PokemonGeneration = styled("div")({
  position: "absolute",
  top: 0,
  right: 0,
  fontWeight: "bold",
  fontSize: "12px",
  // background: "#ddd",
  padding: "1px 3px",
  cursor: "pointer",
});

const PokemonSpriteWrap = styled("div")`
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 5px;
  & img {
    max-width: 100%;
    max-height: 100px;

    &[src$="svg"] {
      padding: 10px;
    }
  }
`;

const PokemonMeta = styled("div")`
  background-color: rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;
const PokemonName = styled("div")({
  fontSize: "15px",
  textAlign: "center",
  textTransform: "capitalize",
  fontWeight: "bold",
  maxWidth: "100%",
  lineHeight: "0.9em",
  minHeight: "25px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});
const PokemonCP = styled("div")`
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  line-height: 1em;
`;

function PokemonCard(props) {
  var pokemon = props.pokemon;
  var selected = props.selected;
  var select = props.select;
  var TitleSize = "15px";

  if (pokemon.name.length > 15) {
    TitleSize = "12px";
  } else if (pokemon.name.length > 12) {
    TitleSize = "13px";
  } else if (pokemon.name.length > 10) {
    TitleSize = "14px";
  }

  return (
    <PokemonItem className={selected ? "selected" : ""} onClick={select}>
      {selected}
      <PokemonID>#{pokemon.id}</PokemonID>
      <PokemonGeneration>G{pokemon.gen}</PokemonGeneration>
      <PokemonSpriteWrap>
        <img src={pokemon.sprite} alt="" />
      </PokemonSpriteWrap>

      <PokemonMeta>
        {/* style={`font-size=${TitleSize}`} */}
        <PokemonName style={{ fontSize: TitleSize }}>
          <div>{pokemon.name.split("-").join(" ")}</div>
        </PokemonName>
        <PokemonCP>CP {pokemon.cp}</PokemonCP>
      </PokemonMeta>
    </PokemonItem>
  );
}

export default PokemonCard;
