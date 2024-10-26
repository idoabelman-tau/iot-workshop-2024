import json
import logging
import azure.functions as func
import pyodbc


def main(req: func.HttpRequest, signalrHub: func.Out[str]) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    server = 'sql-erver.database.windows.net'
    database = 'LocationManagementDB'
    username = 'app-data'
    password = 'password!1'
    driver = '{ODBC Driver 17 for SQL Server}'

    connection_string = 'Driver={ODBC Driver 18 for SQL Server};Server=tcp:sql-erver.database.windows.net,1433;Database=LocationManagementDB;Uid=app-data;Pwd={' + password + '};Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;'

    try:

        req_body = req.get_json()

        with pyodbc.connect(connection_string) as conn:
            with conn.cursor() as cursor:
                query = "SELECT UID FROM [dbo].[Shipments] WHERE tracking_id = ?"
                cursor.execute(query, req_body["tracking_id"])  # Parameterized query
                rows = cursor.fetchall()
                
                if len(rows) == 0:
                    return func.HttpResponse("Shipment not found", status_code=404)
                else:
                    return func.HttpResponse(
                        body=row[0][0],
                        mimetype="application/json",
                        status_code=200
                    )

    except Exception as e:
        logging.error(f"Error: {str(e)}")
        return func.HttpResponse(
            body=str(e),
            status_code=500
        )
