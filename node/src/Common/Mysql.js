const mysql = require('mysql');
const MyConfig = require('./MyConfig');

class MySqlDB {
  constructor() {
    const { host, port, database, user, password, persistent } = MyConfig; // Adjust the path accordingly

    this.host = host;
    this.port = port;
    this.dbName = database;
    this.user = user;
    this.password = password;
    this.persistent = persistent;

    this.connection = this.Connect();
  }

  Connect() {
    const connection = mysql.createConnection({
      host: this.host,
      port: this.port,
      database: this.dbName,
      user: this.user,
      password: this.password,
      multipleStatements: true, // Allow multiple SQL statements
      connectTimeout: 20000, // Connection timeout in milliseconds
      timezone: 'UTC', // Set MySQL timezone
      charset: 'utf8mb4' // Set character set
    });

    connection.connect((err) => {
      if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1); // Exit Node.js process if unable to connect to MySQL
      }
      console.log('Connected to MySQL database');
    });

    return connection;
  }

  Query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, params, (error, results, fields) => {
        if (error) {
          console.error('Error executing SQL statement:', error);
          return reject(error);
        }
        resolve(results);
      });
    });
  }

  async FetchAll(sql, params = []) {
    try {
      const results = await this.query(sql, params);
      return results;
    } catch (error) {
      throw error;
    }
  }

  async DBClose() {
    if (this.connection) {
      this.connection.end((err) => {
        if (err) {
          console.error('Error closing MySQL connection:', err);
        } else {
          console.log('MySQL connection closed');
        }
      });
    }
  }

  async Begin() {
    this.connection.beginTransaction((err) => {
      if (err) {
        console.error('Error beginning transaction:', err);
        throw err;
      }
      console.log('Transaction began');
    });
  }

  async Commit() {
    this.connection.commit((err) => {
      if (err) {
        console.error('Error committing transaction:', err);
        throw err;
      }
      console.log('Transaction committed');
    });
  }

  async Rollback() {
    this.connection.rollback((err) => {
      if (err) {
        console.error('Error rolling back transaction:', err);
        throw err;
      }
      console.log('Transaction rolled back');
    });
  }
}

module.exports = MySqlDB;
