export const getIdFromClassName = (input) => {
  const regex = /designcombo-scene-item id-([^ ]+)/;
  const match = input.match(regex);
  return match ? match[1] : null;
};
