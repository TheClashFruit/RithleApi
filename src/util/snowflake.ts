import { Snowflake } from '@se-oss/snowflake-sequence';

const nodeId = parseInt(import.meta.env.SNOWFLAKE_NODE_ID || '0', 10);
if (isNaN(nodeId) || nodeId < 0 || nodeId > 1023) {
  throw new Error(
    'Invalid SNOWFLAKE_NODE_ID. Must be an integer between 0 and 1023.'
  );
}

const snowflakeGenerator = new Snowflake({
  epoch: new Date('2026-10-01T00:00:00.000Z').getTime(),
  nodeId
});

export default snowflakeGenerator;