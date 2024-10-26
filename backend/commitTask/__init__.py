import logging
import json
import pyodbc
import os
import azure.functions as func
from datetime import datetime



def main(req: func.HttpRequest, signalrHub: func.Out[str]) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    try:
        logging.error("item")
        req_body = req.get_json()
        logging.error("req_body")

        server = 'sql-erver.database.windows.net'
        database = 'LocationManagementDB'
        username = 'app-data'
        password = 'password!1'
        driver = '{ODBC Driver 17 for SQL Server}'
        
        connection_string = 'Driver={ODBC Driver 18 for SQL Server};Server=tcp:sql-erver.database.windows.net,1433;Database=LocationManagementDB;Uid=app-data;Pwd={' + password + '};Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;'
        
        with pyodbc.connect(connection_string) as conn:
            cursor = conn.cursor()
            
            for item in req_body:
                logging.error(item)

                company_id = int(item['company_id'])
                user_id = int(item['user_id'])
                courier_id = int(item['courier_id'])
                delivery_address = item['delivery_address']
                status = item['status']
                try:
                    delivery_time = item['delivery_time'] # Change to date type
                
                except ValueError as ve:
                    logging.error(f"Invalid date format for delivery_time: {item['delivery_time']}. Error: {str(ve)}")
                    return func.HttpResponse(f"Invalid date format: {item['delivery_time']}", status_code=400)
         
                cursor.execute("""
                    INSERT INTO dbo.Shipments (company_id, user_id, courier_id, delivery_address, delivery_time, status)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, company_id, user_id, courier_id, delivery_address, delivery_time, status)
            
            conn.commit()

          
        signalrHub.set(json.dumps({
            'target': 'newTaskUpdate',
            'arguments': [f'{count}']
        }))
        
        return func.HttpResponse("Items successfully inserted into database.", status_code=200)

    except Exception as e:
        logging.error(f"An error occurred: {str(e)}")
        return func.HttpResponse(f"An error occurred: {str(e)}", status_code=500)
