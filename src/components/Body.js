import EnhancedTable from "./EnhancedTable";

export default function Body() {
  //   const [pokemonData, setPokemonData] = useState(
  //     JSON.parse(localStorage.getItem("pokelist")) || ""
  //   );

  const data = JSON.parse(localStorage.getItem("pokelist"));
  console.log("data", data);

  return (
    <>
      {/* {!data && (
        <div className="PokeTableLoading">
          <CircularProgress />
        </div>
      )} */}
      <EnhancedTable data={data} />
    </>
  );
}
