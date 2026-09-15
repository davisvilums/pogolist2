import * as React from "react";
import { styled, alpha } from "@mui/material/styles";
import Check from "@mui/icons-material/CheckBox";

const PokemonItem = styled("div")`
  border: 1px solid ${({ theme }) => theme.palette.divider};
  width: 100px;
  display: flex;
  justify-content: center;
  flex-direction: column;
  position: relative;
  margin: 0 -1px -1px 0;
  &.selected {
    background: ${({ theme }) => alpha(theme.palette.primary.main, 0.12)};
  }
  &:hover {
    background-color: ${({ theme }) => theme.palette.action.hover};
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
  cursor: pointer;
  & img {
    max-width: 100%;
    max-height: 100px;

    &[src$="svg"] {
      padding: 10px;
    }
  }
`;

const PokemonMeta = styled("div")`
  background-color: ${({ theme }) => theme.palette.action.hover};
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
  background: ${({ theme }) => alpha(theme.palette.primary.main, 0.15)};
  color: ${({ theme }) => theme.palette.primary.main};
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

// PokeAPI keeps shiny sprites in a "shiny" folder next to the regular ones
function getShinySprite(sprite) {
  if (!sprite || !sprite.includes("PokeAPI/sprites")) return sprite;
  return sprite.replace(/\/([^/]+\.png)$/, "/shiny/$1");
}

function PokemonCard({ pokemon, selected, select, collections, showCollectionTags, removePokemonFromCollection, showShiny }) {
  var TitleSize = "15px";

  if (pokemon.name.length > 15) {
    TitleSize = "12px";
  } else if (pokemon.name.length > 12) {
    TitleSize = "13px";
  } else if (pokemon.name.length > 10) {
    TitleSize = "14px";
  }

  return (
    <PokemonItem className={selected ? "selected" : ""}>
      {/* {selected} */}
      <PokemonID>#{pokemon.id}</PokemonID>
      {/* Only the picture and the G/checkbox badge select; the text stays selectable */}
      <PokemonGeneration onClick={select}>
        {selected ? <Check color="primary" /> : "G" + pokemon.gen}
      </PokemonGeneration>
      <PokemonSpriteWrap onClick={select}>
        <img
          src={showShiny ? getShinySprite(pokemon.sprite) : pokemon.sprite}
          alt=""
          onError={(e) => {
            // Fall back to the regular sprite when no shiny version exists
            if (showShiny && e.currentTarget.src !== pokemon.sprite) {
              e.currentTarget.src = pokemon.sprite;
            }
          }}
        />
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
