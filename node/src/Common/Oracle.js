const oracledb = require("oracledb");
const MyConfig = require("./MyConfig");
class OracleDB {
  constructor() {
    const { host, port, database, user, password, persistent } = MyConfig;

    this.host = host;
    this.port = port;
    this.username = user;
    this.password = password;
    this.service = "XE";
    this.result;
  }

  async Connect() {
    try {
      this.conn = await oracledb.getConnection({
        user: this.username,
        password: this.password,
        connectString: `${this.host}:${this.port}/${this.service}`,
      });
      if (this.conn) {
        console.log("OracleDB Connected...");
      }
    } catch (err) {
      throw new Error(`Failed to connect to Oracle: ${err.message}`);
    }
  }

  async Query(sql, params = [], retparams = []) {
    try {
      if (!this.conn) {
        await this.Connect();
      }

      this.result = await this.conn.execute(sql, params, { autoCommit: false });
      // console.log(this.result);
      const returnValues = {};
      for (const paramName of Object.keys(retparams)) {
        returnValues[retparams[paramName]] =
          result.outBinds[retparams[paramName]];
      }

      return this.result;
    } catch (err) {
      throw new Error(`Error executing SQL: ${err.message}`);
    }
  }

  async Begin() {
    try {
      if (!this.conn) {
        await this.Connect();
      }

      await this.conn.execute("BEGIN");
      console.log("Transaction begun successfully.");
    } catch (err) {
      throw new Error(`Error beginning transaction: ${err.message}`);
    }
  }

  async FetchAll() {
    try {
      const rows = await this.result.rows;
      const metaData = this.result.metaData.map((meta) => meta.name); // Assuming metaData is available

      // Map through the rows and create objects with keys corresponding to metaData
      const objects = rows.map((row) => {
        const obj = {};
        metaData.forEach((key, index) => {
          obj[key.toLowerCase()] = row[index];
        });
        return obj;
      });

      return objects;
    } catch (err) {
      throw new Error(`Error fetching rows: ${err.message}`);
    }
  }

  async Commit() {
    try {
      await this.conn.commit();
    } catch (err) {
      throw new Error(`Error committing transaction: ${err.message}`);
    }
  }

  async Rollback() {
    try {
      await this.conn.rollback();
    } catch (err) {
      throw new Error(`Error rolling back transaction: ${err.message}`);
    }
  }

  async version() {
    try {
      const version = await this.conn.oracleServerVersion;
      return version;
    } catch (err) {
      throw new Error(`Error getting Oracle server version: ${err.message}`);
    }
  }

  async DBClose() {
    try {
      if (this.conn) {
        await this.conn.close();
      }
    } catch (err) {
      throw new Error(`Error closing connection: ${err.message}`);
    }
  }
}

module.exports = OracleDB;
