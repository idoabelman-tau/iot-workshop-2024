import json
import logging
import azure.functions as func
import pyodbc


def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    server = 'sql-erver.database.windows.net'
    database = 'LocationManagementDB'
    username = 'app-data'
    password = 'password!1'
    driver = '{ODBC Driver 17 for SQL Server}'

    # Connection string for Azure SQL database
    connection_string = 'Driver={ODBC Driver 18 for SQL Server};Server=tcp:sql-erver.database.windows.net,1433;Database=LocationManagementDB;Uid=app-data;Pwd={' + password + '};Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;'

    try:
        # Get the request body
        req_body = req.get_json()
        # fetch users by uid
        uid = req_body.get('UID')

        if not uid:
            return func.HttpResponse(
                body="UID not provided",
                status_code=400
            )

        with pyodbc.connect(connection_string) as conn:
            with conn.cursor() as cursor:
                # Fetch data from 'users' table where UID is not NULL and matches the given UID
                query = "SELECT * FROM [dbo].[users] WHERE UID = ? AND UID IS NOT NULL"
                cursor.execute(query, uid)
                rows = cursor.fetchall()

                # Create a list of dictionaries from the rows
                results = []
                for row in rows:
                    result = {}
                    for i, column in enumerate(cursor.description):
                        result[column[0]] = row[i]
                    results.append(result)

        # Return the query result as JSON
        return func.HttpResponse(
            body=json.dumps(results),
            mimetype="application/json",
            status_code=200
        )
    except Exception as e:
        logging.error(f"Error: {str(e)}")
        return func.HttpResponse(
            body=str(e),
            status_code=500
        )