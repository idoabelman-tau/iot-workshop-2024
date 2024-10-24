const express = require('express');
const { Connection, Request } = require('tedious'); // Use the Tedious library for SQL Server

const app = express();
const port = 3000;

// Configure database connection
const config = {
  server: 'sql-erver.database.windows.net',
  authentication: {
    type: 'default',
    options: {
      userName: 'app-data',
      password: 'password!1'
    }
  },
  options: {
    database: 'LocationManagementDB',
    encrypt: true  // For Azure SQL > You might need to ensure this is set true
  }
};

const connectToDatabase = async () => {
  return new Promise((resolve, reject) => {
    const connection = new Connection(config);

    connection.on('connect', (err) => {
      if (err) {
        console.error('Connection Error:', err.message);
        reject(err);
      } else {
        console.log('Connected to the database');
        resolve(connection);
      }
    });

    connection.connect();
  });
};

const executeQuery = async (connection, sql) => {
  return new Promise((resolve, reject) => {
    const request = new Request(sql, (err, rowCount, rows) => {
      if (err) {
        console.error('SQL Query Error:', err.message);
        reject(err);
      } else {
        console.log('Row Count:', rowCount);
        const results = [];
        rows.forEach(row => {
          const result = {};
          row.forEach(column => {
            result[column.metadata.colName] = column.value;
          });
          results.push(result);
        });

        console.log('Query Results:', results);
        resolve(results);
      }
    });

    connection.execSql(request);
  });
};

app.get('/locations', async (req, res) => {
  try {
    const connection = await connectToDatabase();
    const results = await executeQuery(connection, 'SELECT courier_name FROM [dbo].[Tasks]');
    res.json(results);
    connection.close(); // Close connection when done
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});