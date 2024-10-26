import json
import logging
import azure.functions as func
import pyodbc


def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function to add a new employee.')

    # Database connection details
    server = 'sql-erver.database.windows.net'
    database = 'LocationManagementDB'
    username = 'app-data'
    password = 'password!1'
    driver = '{ODBC Driver 17 for SQL Server}'

    # Connection string for Azure SQL database
    connection_string = 'Driver={ODBC Driver 18 for SQL Server};Server=tcp:sql-erver.database.windows.net,1433;Database=LocationManagementDB;Uid=app-data;Pwd={' + password + '};Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;'

    try:
        # Get the request body (expects JSON input)
        req_body = req.get_json()

        # Extract employee details from the request body
        name = req_body.get('name')
        company_id = req_body.get('company_id')
        role = req_body.get('role')
        uid = req_body.get('UID')

        # Check if all required fields are provided
        if not (name and company_id and role and uid):
            return func.HttpResponse(
                body="Missing employee details (name, company_id, role, or UID).",
                status_code=400
            )

        # Connect to the database and insert the new employee
        with pyodbc.connect(connection_string) as conn:
            with conn.cursor() as cursor:
                # SQL Insert query to add new employee
                insert_query = """
                INSERT INTO [dbo].[users] (name, company_id, role, UID) 
                VALUES (?, ?, ?, ?)
                """
                cursor.execute(insert_query, (name, company_id, role, uid))
                conn.commit()  # Commit the transaction

        # Return a success response
        return func.HttpResponse(
            body=json.dumps({"message": "Employee added successfully."}),
            mimetype="application/json",
            status_code=200
        )

    except Exception as e:
        logging.error(f"Error: {str(e)}")
        return func.HttpResponse(
            body=str(e),
            status_code=500
        )