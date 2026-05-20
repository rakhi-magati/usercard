function usersearch({
  search,
  setSearch,
}) {
  return (
    <input
      type="text"
      placeholder="Search users..."
      value={search}
      onChange={(e) =>
        setSearch(e.target.value)
      }
    />
  );
}

export default usersearch;