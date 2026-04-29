// Memory DB stub - no external dependencies
// Studio uses API-based auth, not direct DB queries

const mockData = {};

export default {
  prepare: (sql) => ({
    get: (param) => null,
    all: () => [],
    run: (...args) => ({ changes: 0 }),
  }),
  exec: (sql) => {}
};
