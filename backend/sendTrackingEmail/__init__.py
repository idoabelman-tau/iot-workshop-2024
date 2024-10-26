import logging

import azure.functions as func
from azure.communication.email import EmailClient
import pyodbc
import json

def send_tracking_mail(email, tracking_id):
    email_connection_string = "endpoint=https://tasksmssender.germany.communication.azure.com/;accesskey=FnzvCFLIkQfX4UARfHNBpzmMmAJh1P1BjMQj05sVa0mylbuQleZrJQQJ99AJACULyCpPSPD9AAAAAZCSbhQ1"
    client = EmailClient.from_connection_string(email_connection_string)
    tracking_url = "https://lively-coast-03156710f.5.azurestaticapps.net?id=" + tracking_id

    message = {
        "senderAddress": "DoNotReply@4df177e4-693d-4c47-873d-26a897cec342.azurecomm.net",
        "recipients": {
            "to": [{"address": email}]
        },
        "content": {
            "subject": "Your delivery is on the way!",
            "plainText": "Tracking link: " + tracking_url,
            "html": f"""
            <html>
                <body>
                    Tracking link: <a href={tracking_url}>{tracking_url}</a>
                </body>
            </html>"""
        },
        
    }

    poller = client.begin_send(message)
    return poller.result()

def main(req: func.HttpRequest) -> func.HttpResponse:
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
                query = "SELECT * FROM [dbo].[Shipments] WHERE shipment_id = ?"
                cursor.execute(query, req_body["shipment_id"])  # Parameterized query
                rows = cursor.fetchall()

                if len(rows) == 0:
                    return func.HttpResponse("Shipment not found", status_code=404)
                else:
                    result = send_tracking_mail(rows[0].email, rows[0].tracking_id)

                    return func.HttpResponse(
                        body=json.dumps(result),
                        mimetype="application/json",
                        status_code= 200 if result["status"] == "Succeeded" else 500
                    )

    except Exception as e:
        logging.error(f"Error: {str(e)}")
        return func.HttpResponse(
            body=str(e),
            status_code=500
        )


