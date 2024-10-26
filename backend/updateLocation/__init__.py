import azure.functions as func
import json
from datetime import datetime
from azure.data.tables import TableServiceClient

# Configure your Azure Table Storage connection
connection_string = "DefaultEndpointsProtocol=https;AccountName=managementapp;AccountKey=meprd6YMwgYsPiKqPLm1nAB0DZoZ5dZfq4ul7sGd4X2Kx5ixApUnYkFcPqedMfPcE+V/yHpRe4ya+AStKHEowA==;EndpointSuffix=core.windows.net"
table_service_client = TableServiceClient.from_connection_string(connection_string)
table_name = "CourierLocations"
table_client = table_service_client.get_table_client(table_name)

async def main(req: func.HttpRequest) -> func.HttpResponse:
    try:
        # Parse JSON data from request
        data = req.get_json()
        courier_id = data.get('courierId')
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        company_id = data.get('company_id')

        if not courier_id or latitude is None or longitude is None:
            return func.HttpResponse(
                json.dumps({"error": "Invalid data"}),
                status_code=400,
                mimetype="application/json"
            )

      
        location_data = {
            "PartitionKey": "LocationData",
            "RowKey": courier_id,
            "Latitude": latitude,
            "Longitude": longitude,
            "companyId" : company_id,
            "Timestamp": datetime.utcnow().isoformat()
        }

        # Store data in Azure Table Storage
        table_client.upsert_entity(location_data)

        return func.HttpResponse(
            json.dumps({"message": "Location updated"}),
            status_code=200,
            mimetype="application/json"
        )

    except Exception as e:
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json"
        )
