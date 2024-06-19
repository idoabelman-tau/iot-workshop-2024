import logging
import azure.functions as func
from azure.data.tables import TableClient
import random
import os
import json 


def main(
        req: func.HttpRequest,
        signalrHub: func.Out[str]
    ) -> func.HttpResponse:
    # logging.info('Python HTTP trigger function processed a request.')
    # Because Azure functions are stateless, we cannot locally define and manipulate local variables
    # lets just randomly draw our counter and return it.
    # count = random.randint(0, 499)
    try:
        connection_string = os.getenv('AzureWebJobsStorage')
        with TableClient.from_connection_string(connection_string, table_name='myTable') as table:
            entity = table.get_entity("counters", "counter1")
            count = entity['value'] = entity['value'] - 1
            table.update_entity(entity=entity)
        signalrHub.set(json.dumps({
            'target': 'newCountUpdate',
            'arguments': [f'{count}']
        }))
        return func.HttpResponse(f"{count}", status_code=200)
    except:
        return func.HttpResponse(f"Something went wrong", status_code=500)