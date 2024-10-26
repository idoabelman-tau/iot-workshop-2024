import azure.functions as func
import json
from azure.data.tables import TableServiceClient

# Azure Table Storage connection setup
connection_string = "DefaultEndpointsProtocol=https;AccountName=managementapp;AccountKey=meprd6YMwgYsPiKqPLm1nAB0DZoZ5dZfq4ul7sGd4X2Kx5ixApUnYkFcPqedMfPcE+V/yHpRe4ya+AStKHEowA==;EndpointSuffix=core.windows.net"
table_service_client = TableServiceClient.from_connection_string(connection_string)
table_name = "CourierLocations"
table_client = table_service_client.get_table_client(table_name)

async def main(req: func.HttpRequest) -> func.HttpResponse:
    try:
        # Get the courier_id from the query parameters
        courier_id = req.params.get('courierId')
        if not courier_id:
            return func.HttpResponse(
                json.dumps({"error": "courierId parameter is required"}),
                status_code=400,
                mimetype="application/json"
            )

        # Query for the specific courier's location using PartitionKey and RowKey
        courier_location = table_client.get_entity(partition_key="LocationData", row_key=courier_id)

        # Format the response with the courier's location
        location_data = {
            "courierId": courier_location["RowKey"],
            "latitude": courier_location["Latitude"],
            "longitude": courier_location["Longitude"]        }

        return func.HttpResponse(
            json.dumps({"courierLocations": [location_data]}),
            status_code=200,
            mimetype="application/json"
        )

    except Exception as e:
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json"
        )
