const RANDOM_SUFFIX_LENGTH = 8;

export const createId = () => {
  const timeComponent = Date.now().toString(36);
  const randomComponent = Math.random()
    .toString(36)
    .slice(2, 2 + RANDOM_SUFFIX_LENGTH);
  return `${timeComponent}-${randomComponent}`;
};
