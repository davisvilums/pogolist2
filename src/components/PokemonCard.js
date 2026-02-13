import * as React from "react";
import { styled } from "@mui/material/styles";
import Check from "@mui/icons-material/CheckBox";

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
  padding: "1px 3px",
  cursor: "pointer",
});

const PokemonSpriteWrap = styled("div")`
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 5px;
  min-height: 104px;
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

const CollectionTagsWrap = styled("div")`
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 2px 2px 3px;
  justify-content: center;
`;

const CollectionTag = styled("span")`
  display: inline-flex;
  align-items: center;
  background: #e3e8f7;
  color: #3f51b5;
  font-size: 9px;
  line-height: 1;
  padding: 1px 3px;
  border-radius: 3px;
  max-width: 96px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  & .tag-x {
    margin-left: 2px;
    cursor: pointer;
    font-size: 10px;
    font-weight: bold;
    opacity: 0.6;
    &:hover {
      opacity: 1;
    }
  }
`;

function PokemonCard({ pokemon, selected, select, collections, showCollectionTags, removePokemonFromCollection }) {
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
      {/* {selected} */}
      <PokemonID>#{pokemon.id}</PokemonID>
      <PokemonGeneration>
        {selected ? <Check color="primary" /> : "G" + pokemon.gen}
      </PokemonGeneration>
      <PokemonSpriteWrap>
        <img src={pokemon.sprite} alt="" />
      </PokemonSpriteWrap>

      <PokemonMeta>
        {/* style={`font-size=${TitleSize}`} */}
        <PokemonName style={{ fontSize: TitleSize }}>
          <div>{pokemon.name.split("-").join(" ")}</div>
        </PokemonName>
        <PokemonCP>CP {pokemon.cp}</PokemonCP>
        {showCollectionTags && collections && collections.length > 0 && (
          <CollectionTagsWrap>
            {collections.map((c) => (
              <CollectionTag key={c.id}>
                {c.text}
                <span
                  className="tag-x"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePokemonFromCollection(pokemon.id, c.id);
                  }}
                >
                  ×
                </span>
              </CollectionTag>
            ))}
          </CollectionTagsWrap>
        )}
      </PokemonMeta>
    </PokemonItem>
  );
}

export default PokemonCard;
