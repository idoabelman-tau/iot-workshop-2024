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
        company_id = req.params.get('companyId')
        if not company_id:
            return func.HttpResponse(
                json.dumps({"error": "companyId parameter is required"}),
                status_code=400,
                mimetype="application/json"
            )
        
        # Query all location data under the 'LocationData' partition
        filter_query = f"PartitionKey eq 'LocationData' and companyId eq '{company_id}'"
        couriers = table_client.query_entities(filter_query)


        # Parse data into a list of dictionaries
        courier_locations = []
        for courier in couriers:
            courier_locations.append({
                "courierId": courier["RowKey"],
                "latitude": courier["Latitude"],
                "longitude": courier["Longitude"],
                #"timestamp": courier["Timestamp"]
            })

        # Return all courier locations as JSON
        return func.HttpResponse(
            json.dumps({"courierLocations": courier_locations}),
            status_code=200,
            mimetype="application/json"
        )

    except Exception as e:
        logging.exception("Function failed with exception: %s", e)
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json"
        )
