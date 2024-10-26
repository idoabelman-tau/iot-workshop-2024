import logging
import json
import pyodbc
import os
import azure.functions as func
from datetime import datetime



def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    try:
        req_body = req.get_json()

        server = 'sql-erver.database.windows.net'
        database = 'LocationManagementDB'
        username = 'app-data'
        password = 'password!1'
        driver = '{ODBC Driver 17 for SQL Server}'
        
        connection_string = 'Driver={ODBC Driver 18 for SQL Server};Server=tcp:sql-erver.database.windows.net,1433;Database=LocationManagementDB;Uid=app-data;Pwd={' + password + '};Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;'
        
        with pyodbc.connect(connection_string) as conn:
            cursor = conn.cursor()
            
            tracking_id = req_body['tracking_id']
            confirmation_id = req_body['confirmation_id']
            query = "SELECT shipment_id FROM [dbo].[Shipments] WHERE tracking_id = ? AND confirmation_id = ?"
            cursor.execute(query, tracking_id, confirmation_id)
            rows = cursor.fetchall()
            if len(rows) == 0:
                return func.HttpResponse("Shipment not found", status_code=404)
            else:
                cursor.execute("DELETE FROM dbo.Shipments WHERE shipment_id = ?", rows[0][0]);
                conn.commit()
                return func.HttpResponse("Shipment completed", status_code=200)

    except Exception as e:
        logging.error(f"An error occurred: {str(e)}")
        return func.HttpResponse(f"An error occurred: {str(e)}", status_code=500)
