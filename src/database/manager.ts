import { FastifyBaseLogger } from "fastify";
import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

export class DatabaseManager {
  private pool: Pool;
  //   private config: IDatabaseConfig;
  private connectionPromise: Promise<void> | null = null;
  private logger: FastifyBaseLogger;

  constructor(connectionString: string, logger: FastifyBaseLogger) {
    this.pool = new Pool({
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      connectionString: connectionString,
    }); // Use the passed config, not the imported one
    this.setUpEventListeners();
    this.logger = logger;
  }

  private setUpEventListeners(): void {
    this.pool.on("connect", (client: PoolClient) => {
      this.logger.debug("New client connected to the pool");
    });

    this.pool.on("error", (error: Error) => {
      this.logger.error(
        `Unexpected database pool error: ${{ error: error.message }}`
      );
    });
  }

  /**
   * Initializes the connection pool and validates it with a test query.
   * Uses a promise to prevent multiple simultaneous connection attempts during startup.
   */
  public async connect(): Promise<void> {
    // If a connection attempt is already in flight, return that promise.
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          // Use the pool's built-in connection and test it
          const client = await this.pool.connect();
          await client.query("SELECT NOW()");
          client.release(); // Release the client back to the pool

          this.logger.info("Database connection pool initialized successfully");
          return; // Success, exit the function
        } catch (error) {
          retries++;
          this.logger.warn(
            `Database connection attempt failed: ${JSON.stringify({
              attempt: retries,
              maxAttempts: maxRetries,
              error: (error as Error).message,
            })}`
          );

          if (retries === maxRetries) {
            const errorMessage = `Failed to connect to database after ${maxRetries} attempts`;
            this.logger.error(errorMessage);
            this.connectionPromise = null; // Reset so a future call can retry
            throw new Error(errorMessage);
          }
          // Wait before retrying
          await this.delay(1000 * retries); // Simple backoff
        }
      }
    })();

    return this.connectionPromise;
  }

  /**
   * Executes a query. Relies on the pg.Pool's internal connection management.
   * @param text The SQL query text
   * @param params The query parameters
   * @returns The query result
   */
  public async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      // The pool handles acquiring a connection, checking it, and retrying if needed.
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;

      this.logger.debug(
        `Executed query: ${JSON.stringify({
          query: text,
          duration: `${duration}ms`,
          rowCount: result.rowCount,
        })}`
      );

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.logger.error(
        `Database query failed: ${JSON.stringify({
          query: text,
          params,
          duration: `${duration}ms`,
          error: (error as Error).message,
        })}`
      );
      throw error; // Re-throw the error for the caller to handle
    }
  }

  /**
   * Gets a client directly from the pool. The caller is responsible for releasing it.
   * @returns A Promise resolving to a PoolClient
   */
  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Executes a database transaction.
   * @param callback A function that contains the queries to be executed in the transaction.
   * @returns The result of the callback function.
   */
  public async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();

    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      this.logger.error(
        `Transaction rolled back: ${JSON.stringify({
          error: (error as Error).message,
        })}`
      );
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Returns current statistics about the pool.
   */
  public getPoolStats(): {
    total: number;
    idle: number;
    waiting: number;
  } {
    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
    };
  }

  /**
   * Gracefully shuts down the connection pool.
   */
  public async disconnect(): Promise<void> {
    this.logger.info("Shutting down database connection pool");
    await this.pool.end();
    this.connectionPromise = null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
