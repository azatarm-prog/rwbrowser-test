# Browser Test Service

A simple test service to verify browserless connection on Railway.

## What It Does

This service automatically tests the connection to your browserless service when it starts up. It performs the following tests:

1. ✅ Connects to browserless service
2. ✅ Gets browser version
3. ✅ Creates a new page
4. ✅ Navigates to example.com
5. ✅ Gets page title
6. ✅ Gets page content
7. ✅ Closes page cleanly

## Deploy to Railway

1. Create a new service from this GitHub repository
2. Add environment variable:
   ```
   BROWSER_WS_ENDPOINT_PRIVATE=${browserless.BROWSER_WS_ENDPOINT_PRIVATE}
   ```
3. Deploy
4. Check the logs to see test results

## Endpoints

- `GET /` - Service info and test results
- `GET /health` - Health check with test results
- `GET /test` - Manually trigger a test

## Expected Output

If everything works, you'll see in the logs:

```
============================================================
✅ ALL TESTS PASSED!
============================================================

Total duration: 2500ms

Browser service is working correctly.
You can now use it in your agent services.

============================================================
```

## Troubleshooting

If tests fail, the service will provide specific troubleshooting steps based on the error type.

Common issues:
- Missing environment variable
- Services not in same Railway project
- Private networking not enabled
- Browserless service not running
- Insufficient memory allocation

## After Testing

Once you verify the connection works, you can:
1. Delete this test service
2. Use the same environment variable pattern in your actual agent services
3. Reference the code examples in the logs
