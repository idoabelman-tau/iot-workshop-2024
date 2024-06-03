# Known errors:
If you get this error (or similar one):
> Access to fetch at '...' from origin 'http://localhost' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource. If an opaque response serves your needs, set the request's mode to 'no-cors' to fetch the resource with CORS disabled.
"

When you launch the Azure Function locally, it typically runs on port 7071. Meanwhile, your local website runs on a different port (e.g., 8081). By default, the Azure Function Project disables CORS communication.

To enable CORS for all ports in your local.settings.json, you can configure the CORS policy to allow all origins, including different ports. You need to set up your local.settings.json by adding:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "python"
  },
  "Host": {
    "CORS": "*"
  }
}
```

See further information [here:](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)